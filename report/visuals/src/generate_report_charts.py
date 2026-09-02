#!/usr/bin/env python3
"""Generate reproducible report charts from reviewed experiment data."""

from __future__ import annotations

import csv
import math
import os
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import ListedColormap
from matplotlib.patches import Patch


ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "report" / "data"
OUT_DIR = ROOT / "report" / "visuals" / "rendered"
OUT_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, os.path.expanduser("~/.local/lib/libplot"))
try:
    from libplot import BLUE, DARK, GRAY, GREEN, LIGHT, ORANGE, PURPLE, RED
except ImportError:
    BLUE, DARK, GRAY, GREEN = "#2E5A9E", "#222222", "#777777", "#3E8E5A"
    LIGHT, ORANGE, PURPLE, RED = "#EEF0F5", "#D9801A", "#5C2D91", "#B03A3A"


MODEL_ORDER = ["DeepSeek", "Gemma", "Finance pipeline"]
MODEL_COLORS = {"DeepSeek": BLUE, "Gemma": PURPLE, "Finance pipeline": GREEN}
STATUS_COLORS = {
    "passed": GREEN,
    "partial": ORANGE,
    "failed": RED,
    "preflight_failed": RED,
    "not_applicable": "#D9DDE5",
}
STATUS_LABELS = {
    "passed": "通过",
    "partial": "部分通过",
    "failed": "未通过",
    "preflight_failed": "预检未通过",
    "not_applicable": "不适用",
}


def read_csv(name: str) -> list[dict[str, str]]:
    with (DATA_DIR / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def save_both(fig: plt.Figure, stem: str) -> None:
    fig.savefig(OUT_DIR / f"{stem}.png", dpi=180, bbox_inches="tight", facecolor="white")
    fig.savefig(OUT_DIR / f"{stem}.svg", bbox_inches="tight", facecolor="white")
    plt.close(fig)


def style_axis(ax: plt.Axes) -> None:
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", color="#D9DDE5", linewidth=0.8, alpha=0.8)
    ax.set_axisbelow(True)


def outcome_matrix(rows: list[dict[str, str]], *, stem: str, title: str, row_order: list[str], subtitle: str) -> None:
    value_map = {"failed": 0, "preflight_failed": 0, "partial": 1, "passed": 2, "not_applicable": 3}
    matrix = np.full((len(row_order), len(MODEL_ORDER)), 3, dtype=int)
    labels = np.full_like(matrix, "不适用", dtype=object)
    for row_index, row_name in enumerate(row_order):
        for model_index, model in enumerate(MODEL_ORDER):
            match = next((r for r in rows if r["condition"] == row_name and r["model_alias"] == model), None)
            if match:
                status = match["automatic_status"]
                matrix[row_index, model_index] = value_map[status]
                labels[row_index, model_index] = STATUS_LABELS[status]

    cmap = ListedColormap([RED, ORANGE, GREEN, "#D9DDE5"])
    fig, ax = plt.subplots(figsize=(10.5, 5.3))
    ax.imshow(matrix, cmap=cmap, vmin=-0.5, vmax=3.5, aspect="auto")
    ax.set_xticks(range(len(MODEL_ORDER)), MODEL_ORDER, fontsize=11)
    ax.set_yticks(range(len(row_order)), row_order, fontsize=11)
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            text_color = DARK if matrix[i, j] == 3 else "white"
            ax.text(j, i, labels[i, j], ha="center", va="center", color=text_color, fontsize=12)
    ax.set_title(title, loc="left", fontsize=17, color=DARK, pad=20)
    ax.text(0, 1.03, subtitle, transform=ax.transAxes, fontsize=10.5, color=GRAY, va="bottom")
    ax.set_xticks(np.arange(-0.5, len(MODEL_ORDER), 1), minor=True)
    ax.set_yticks(np.arange(-0.5, len(row_order), 1), minor=True)
    ax.grid(which="minor", color="white", linewidth=3)
    ax.tick_params(which="minor", bottom=False, left=False)
    ax.spines[:].set_visible(False)
    legend = [
        Patch(facecolor=GREEN, label="全部自动门槛通过"),
        Patch(facecolor=ORANGE, label="仅部分通过"),
        Patch(facecolor=RED, label="未通过"),
        Patch(facecolor="#D9DDE5", label="不适用"),
    ]
    ax.legend(handles=legend, loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=4, frameon=False)
    save_both(fig, stem)


def plot_latency(rows: list[dict[str, str]]) -> None:
    cases = ["PFE-FY24", "JPM-FY24", "META-FY24"]
    fig, ax = plt.subplots(figsize=(11.5, 6.2))
    x = np.arange(len(cases))
    width = 0.23
    for offset, model in enumerate(MODEL_ORDER):
        values = []
        for case in cases:
            row = next(r for r in rows if r["case_id"] == case and r["condition"] == "Optimized text" and r["model_alias"] == model)
            values.append(float(row["latency_seconds"]))
        bars = ax.bar(x + (offset - 1) * width, values, width, color=MODEL_COLORS[model], label=model)
        for bar, value in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width() / 2, value * 1.08, f"{value:.1f}s", ha="center", va="bottom", fontsize=9, color=DARK)
    ax.set_yscale("log")
    ax.set_ylim(4, 420)
    ax.set_xticks(x, ["Pfizer", "JPMorgan", "Meta"], fontsize=11)
    ax.set_ylabel("端到端运行时间（秒，对数刻度）")
    ax.set_title("冻结优化方案的速度差异超过一个数量级", loc="left", fontsize=17, color=DARK, pad=18)
    ax.text(0, 1.02, "每个柱子代表一次无重试运行；对数刻度用于同时显示约6秒与约240秒的结果。", transform=ax.transAxes, fontsize=10.5, color=GRAY)
    style_axis(ax)
    ax.legend(frameon=False, ncol=3, loc="upper left")
    save_both(fig, "03_optimized_latency")


def plot_tokens(rows: list[dict[str, str]]) -> None:
    cases = ["PFE-FY24", "JPM-FY24", "META-FY24"]
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.8), gridspec_kw={"wspace": 0.2})
    x = np.arange(len(cases))
    width = 0.23
    for panel, (field, title, ylabel) in enumerate([
        ("input_tokens", "输入Token", "Token数量"),
        ("output_tokens", "输出Token", "Token数量"),
    ]):
        ax = axes[panel]
        for offset, model in enumerate(MODEL_ORDER):
            values = []
            for case in cases:
                row = next(r for r in rows if r["case_id"] == case and r["condition"] == "Optimized text" and r["model_alias"] == model)
                values.append(int(row[field]))
            bars = ax.bar(x + (offset - 1) * width, values, width, color=MODEL_COLORS[model], label=model)
            for bar, value in zip(bars, values):
                ax.text(bar.get_x() + bar.get_width() / 2, value + max(values) * 0.025, f"{value:,}", ha="center", va="bottom", fontsize=8.3, rotation=90)
        ax.set_xticks(x, ["Pfizer", "JPMorgan", "Meta"])
        ax.set_ylabel(ylabel)
        ax.set_title(title, loc="left", fontsize=14, color=DARK)
        style_axis(ax)
        ax.margins(y=0.18)
    axes[0].legend(frameon=False, ncol=3, loc="upper left")
    fig.suptitle("金融管线减少了模型直接处理的文本量，也显著缩短了输出", x=0.06, ha="left", fontsize=17, color=DARK)
    fig.text(0.06, 0.91, "仅比较三个盲测案例中的冻结优化方案；Token来自各运行manifest。", fontsize=10.5, color=GRAY)
    save_both(fig, "04_optimized_tokens")


def plot_finance_evolution(rows: list[dict[str, str]]) -> None:
    plotted = [r for r in rows if r["input_tokens"] and r["stage"] != "P001 baseline"]
    labels = [f'{r["stage"]}\n{r["prompt_version"]}' for r in plotted]
    x = np.arange(len(plotted))
    inputs = [int(r["input_tokens"]) for r in plotted]
    latencies = [float(r["latency_seconds"]) for r in plotted]
    semantic_colors = [GREEN if r["semantic_gate"].startswith("passed") else RED for r in plotted]

    fig, axes = plt.subplots(2, 1, figsize=(13, 8.2), sharex=True, gridspec_kw={"hspace": 0.16})
    axes[0].bar(x, inputs, color=semantic_colors, alpha=0.86)
    axes[0].set_ylabel("输入Token")
    axes[0].set_title("金融方案的关键转折不是再加Prompt，而是缩小模型任务", loc="left", fontsize=17, color=DARK, pad=18)
    axes[0].text(0, 1.03, "绿色表示语义复核通过（含带分类备注的通过）；红色表示语义复核未通过。", transform=axes[0].transAxes, fontsize=10.5, color=GRAY)
    style_axis(axes[0])
    for index, value in enumerate(inputs):
        axes[0].text(index, value + 130, f"{value:,}", ha="center", fontsize=8.5)

    axes[1].plot(x, latencies, color=BLUE, marker="o", linewidth=2.2)
    axes[1].fill_between(x, latencies, color=BLUE, alpha=0.08)
    axes[1].set_ylabel("运行时间（秒）")
    axes[1].set_xticks(x, labels, fontsize=8.5)
    axes[1].tick_params(axis="x", labelrotation=0)
    style_axis(axes[1])
    for index, value in enumerate(latencies):
        axes[1].text(index, value + 8, f"{value:.0f}s", ha="center", fontsize=8.5)
    axes[1].set_ylim(0, max(latencies) * 1.2)
    fig.text(0.72, 0.49, "PV010 → PV011\n输入 5,070 → 1,952\n减少 61.5%", ha="center", va="center", fontsize=10.5, color=DARK,
             bbox={"boxstyle": "round,pad=0.4", "fc": "white", "ec": "#D9DDE5"})
    save_both(fig, "05_finance_optimization")


def main() -> None:
    rows = read_csv("reviewed_results.csv")
    blind_rows = [r for r in rows if r["condition"] == "Optimized text"]
    # Build the optimized case-by-model matrix.
    cases = ["PFE-FY24", "JPM-FY24", "META-FY24"]
    value_map = {"failed": 0, "preflight_failed": 0, "partial": 1, "passed": 2}
    matrix = np.zeros((3, 3), dtype=int)
    labels = np.empty((3, 3), dtype=object)
    for i, case in enumerate(cases):
        for j, model in enumerate(MODEL_ORDER):
            row = next(r for r in blind_rows if r["case_id"] == case and r["model_alias"] == model)
            matrix[i, j] = value_map[row["automatic_status"]]
            labels[i, j] = STATUS_LABELS[row["automatic_status"]]
    fig, ax = plt.subplots(figsize=(10.5, 5.3))
    ax.imshow(matrix, cmap=ListedColormap([RED, ORANGE, GREEN]), vmin=-0.5, vmax=2.5, aspect="auto")
    ax.set_xticks(range(3), MODEL_ORDER, fontsize=11)
    ax.set_yticks(range(3), ["Pfizer", "JPMorgan", "Meta"], fontsize=11)
    for i in range(3):
        for j in range(3):
            ax.text(j, i, labels[i, j], ha="center", va="center", color="white", fontsize=12)
    ax.set_title("冻结优化方案：三个公司 × 三种解决方案", loc="left", fontsize=17, color=DARK, pad=20)
    ax.text(0, 1.03, "自动完整通过的公司数：DeepSeek 1个、Gemma 2个、Finance pipeline 3个；每条工作流共运行3个公司。", transform=ax.transAxes, fontsize=10.5, color=GRAY, va="bottom")
    ax.set_xticks(np.arange(-0.5, 3, 1), minor=True)
    ax.set_yticks(np.arange(-0.5, 3, 1), minor=True)
    ax.grid(which="minor", color="white", linewidth=3)
    ax.tick_params(which="minor", bottom=False, left=False)
    ax.spines[:].set_visible(False)
    ax.legend(handles=[Patch(facecolor=GREEN, label="通过"), Patch(facecolor=ORANGE, label="部分通过"), Patch(facecolor=RED, label="未通过")], loc="upper center", bbox_to_anchor=(0.5, -0.12), ncol=3, frameon=False)
    save_both(fig, "02_blind_outcome_matrix")

    plot_latency(blind_rows)
    plot_tokens(blind_rows)
    plot_finance_evolution(read_csv("finance_optimization.csv"))
    print(f"generated report charts in {OUT_DIR}")


if __name__ == "__main__":
    main()
