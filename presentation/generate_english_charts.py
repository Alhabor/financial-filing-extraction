#!/usr/bin/env python3
"""Generate the English chart variants used by the bilingual HTML deck."""

from __future__ import annotations

import csv
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import ListedColormap
from matplotlib.patches import Patch


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "report" / "data" / "reviewed_results.csv"
OUT = ROOT / "presentation" / "assets"

BLUE = "#2E5A9E"
PURPLE = "#5C2D91"
GREEN = "#3E8E5A"
ORANGE = "#D9801A"
RED = "#B03A3A"
DARK = "#222222"
GRAY = "#6F7680"
MODELS = ["DeepSeek", "Gemma", "Finance pipeline"]
MODEL_COLORS = {"DeepSeek": BLUE, "Gemma": PURPLE, "Finance pipeline": GREEN}
STATUS_VALUE = {"failed": 0, "preflight_failed": 0, "partial": 1, "passed": 2}
STATUS_LABEL = {"failed": "Failed", "preflight_failed": "Preflight failed", "partial": "Partial", "passed": "Passed"}


def rows() -> list[dict[str, str]]:
    with DATA.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def save(fig: plt.Figure, stem: str) -> None:
    path = OUT / f"{stem}.en.svg"
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    # Matplotlib writes spaces after many SVG path commands. Normalize them so
    # generated assets remain clean under `git diff --check`.
    lines = path.read_text(encoding="utf-8").splitlines()
    path.write_text("\n".join(line.rstrip() for line in lines) + "\n", encoding="utf-8")


def outcome_matrix(data: list[dict[str, str]]) -> None:
    cases = ["PFE-FY24", "JPM-FY24", "META-FY24"]
    case_labels = ["Pfizer", "JPMorgan", "Meta"]
    selected = [row for row in data if row["condition"] == "Optimized text"]
    matrix = np.zeros((3, 3), dtype=int)
    labels = np.empty((3, 3), dtype=object)
    for i, case in enumerate(cases):
        for j, model in enumerate(MODELS):
            row = next(item for item in selected if item["case_id"] == case and item["model_alias"] == model)
            matrix[i, j] = STATUS_VALUE[row["automatic_status"]]
            labels[i, j] = STATUS_LABEL[row["automatic_status"]]

    fig, ax = plt.subplots(figsize=(10.5, 5.3))
    ax.imshow(matrix, cmap=ListedColormap([RED, ORANGE, GREEN]), vmin=-0.5, vmax=2.5, aspect="auto")
    ax.set_xticks(range(3), MODELS, fontsize=11)
    ax.set_yticks(range(3), case_labels, fontsize=11)
    for i in range(3):
        for j in range(3):
            ax.text(j, i, labels[i, j], ha="center", va="center", color="white", fontsize=12)
    ax.set_title("Frozen workflows: three companies × three solutions", loc="left", fontsize=17, color=DARK, pad=20)
    ax.text(0, 1.03, "Companies passing every automatic gate: DeepSeek 1, Gemma 2, Finance pipeline 3; each workflow ran once per company.", transform=ax.transAxes, fontsize=10.5, color=GRAY, va="bottom")
    ax.set_xticks(np.arange(-0.5, 3, 1), minor=True)
    ax.set_yticks(np.arange(-0.5, 3, 1), minor=True)
    ax.grid(which="minor", color="white", linewidth=3)
    ax.tick_params(which="minor", bottom=False, left=False)
    ax.spines[:].set_visible(False)
    ax.legend(handles=[Patch(facecolor=GREEN, label="Passed"), Patch(facecolor=ORANGE, label="Partial"), Patch(facecolor=RED, label="Failed")], loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=3, frameon=False)
    save(fig, "02_blind_outcome_matrix")


def latency_chart(data: list[dict[str, str]]) -> None:
    cases = ["PFE-FY24", "JPM-FY24", "META-FY24"]
    selected = [row for row in data if row["condition"] == "Optimized text"]
    fig, ax = plt.subplots(figsize=(11.5, 6.2))
    x = np.arange(len(cases))
    width = 0.23
    for offset, model in enumerate(MODELS):
        values = [float(next(row for row in selected if row["case_id"] == case and row["model_alias"] == model)["latency_seconds"]) for case in cases]
        bars = ax.bar(x + (offset - 1) * width, values, width, color=MODEL_COLORS[model], label=model)
        for bar, value in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width() / 2, value * 1.08, f"{value:.1f}s", ha="center", va="bottom", fontsize=9, color=DARK)
    ax.set_yscale("log")
    ax.set_ylim(4, 420)
    ax.set_xticks(x, ["Pfizer", "JPMorgan", "Meta"], fontsize=11)
    ax.set_ylabel("End-to-end runtime (seconds, log scale)")
    ax.set_title("Runtime differs by more than one order of magnitude", loc="left", fontsize=17, color=DARK, pad=18)
    ax.text(0, 1.02, "Each bar is one no-retry run of a frozen workflow; the log scale keeps roughly 6-second and 240-second results visible together.", transform=ax.transAxes, fontsize=10.5, color=GRAY)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", color="#D9DDE5", linewidth=0.8, alpha=0.8)
    ax.set_axisbelow(True)
    ax.legend(frameon=False, ncol=3, loc="upper left")
    save(fig, "03_optimized_latency")


if __name__ == "__main__":
    data = rows()
    outcome_matrix(data)
    latency_chart(data)
    print("Generated English presentation charts")
