#!/usr/bin/env python3
"""Verify that report CSV metrics still agree with the immutable run index."""

from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
REPORT_DATA = ROOT / "report" / "data"
INDEX_PATH = ROOT / "experiments" / "INDEX.csv"

MODEL_TO_ALIAS = {
    "DeepSeek": "cloud-deepseek",
    "Gemma": "local-gemma",
    "Finance pipeline": "finance-llama",
}

ROUND_BY_PHASE_CONDITION = {
    ("R1", "Standard text"): "R1-standard-text",
    ("R1", "Optimized text"): "R1-optimized-text",
    ("R1", "Native vision"): "R1-native-vision",
    ("R2", "Optimized text"): "R2-optimized-text",
    ("R3", "Optimized text"): "R3-optimized-text",
}


def rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_equal(actual: str, expected: str, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: report={actual!r}, index={expected!r}")


def main() -> None:
    index = rows(INDEX_PATH)
    reviewed = rows(REPORT_DATA / "reviewed_results.csv")

    for report_row in reviewed:
        round_name = ROUND_BY_PHASE_CONDITION[(report_row["phase"], report_row["condition"])]
        candidates = [
            row
            for row in index
            if row["round"] == round_name
            and row["case_id"] == report_row["case_id"]
            and row["model_alias"] == MODEL_TO_ALIAS[report_row["model_alias"]]
        ]
        if len(candidates) != 1:
            raise AssertionError(f"Expected one index row for {report_row}, found {len(candidates)}")
        source = candidates[0]
        expected_latency = "" if not source["latency_ms"] else f'{int(source["latency_ms"]) / 1000:.3f}'
        assert_equal(report_row["latency_seconds"], expected_latency, f'{source["run_id"]} latency')
        expected_input = source["input_tokens"]
        if not expected_input and source["status"] == "preflight_failed":
            token_match = re.search(r"(\d+) input", source["notes"])
            expected_input = token_match.group(1) if token_match else ""
        assert_equal(report_row["input_tokens"], expected_input, f'{source["run_id"]} input tokens')
        assert_equal(report_row["output_tokens"], source["output_tokens"], f'{source["run_id"]} output tokens')

    finance = rows(REPORT_DATA / "finance_optimization.csv")
    for report_row in finance:
        if not report_row["latency_seconds"]:
            candidates = [
                row for row in index
                if row["case_id"] == report_row["case_id"]
                and row["model_alias"] == "finance-llama"
                and row["prompt_version"] == report_row["prompt_version"]
                and row["status"] == "preflight_failed"
            ]
        else:
            candidates = [
                row for row in index
                if row["case_id"] == report_row["case_id"]
                and row["model_alias"] == "finance-llama"
                and row["prompt_version"] == report_row["prompt_version"]
                and row["latency_ms"]
                and f'{int(row["latency_ms"]) / 1000:.3f}' == report_row["latency_seconds"]
            ]
        if len(candidates) != 1:
            raise AssertionError(f"Expected one finance index row for {report_row}, found {len(candidates)}")
        source = candidates[0]
        assert_equal(report_row["input_tokens"], source["input_tokens"], f'{source["run_id"]} input tokens')
        assert_equal(report_row["output_tokens"], source["output_tokens"], f'{source["run_id"]} output tokens')

    rendered = ROOT / "report" / "visuals" / "rendered"
    expected_stems = [
        "02_blind_outcome_matrix",
        "03_optimized_latency",
        "04_optimized_tokens",
        "05_finance_optimization",
        "experiment_route",
        "final_solution_architectures",
        "jpm_two_column_failure",
    ]
    for stem in expected_stems:
        for suffix in (".png", ".svg"):
            path = rendered / f"{stem}{suffix}"
            if not path.is_file() or path.stat().st_size == 0:
                raise AssertionError(f"Missing rendered asset: {path}")

    report_path = ROOT / "report" / "financial_filing_extraction_report_zh.md"
    report_text = report_path.read_text(encoding="utf-8")
    local_links = [
        match
        for match in re.findall(r"\]\(([^)]+)\)", report_text)
        if not match.startswith(("http://", "https://", "#"))
    ]
    for link in local_links:
        target = (report_path.parent / link.split("#", 1)[0]).resolve()
        if not target.exists():
            raise AssertionError(f"Broken local report link: {link}")

    print(
        f"verified {len(reviewed)} reviewed result rows, "
        f"{len(finance)} finance optimization rows, "
        f"{len(expected_stems) * 2} rendered assets, and {len(local_links)} local report links"
    )


if __name__ == "__main__":
    main()
