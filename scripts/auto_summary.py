#!/usr/bin/env python3
"""
论文摘要生成脚本 (auto_summary.py)
========================================
读取 academic_papers.json，对英文摘要调用 LLM 生成精炼概述，
写入 paper_summary 和/或 english_summary 字段。

使用方式:
  python auto_summary.py                           # 处理所有论文（增量），默认中文
  python auto_summary.py --force                   # 强制重新生成所有摘要
  python auto_summary.py --output-lang zh          # 仅生成中文摘要（默认）
  python auto_summary.py --output-lang en          # 仅生成英文摘要
  python auto_summary.py --output-lang bilingual   # 同时生成中英文摘要

依赖:
  - llm_client.py (同目录)
  - LLM_API_KEY 环境变量

输出:
  - 更新 src/data/academic_papers.json
"""

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
LOGS_DIR = SCRIPT_DIR / "logs"

os.makedirs(LOGS_DIR, exist_ok=True)

LOG_FILE = LOGS_DIR / f"summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# 导入 LLM 客户端
sys.path.insert(0, str(SCRIPT_DIR))
try:
    from llm_client import chat, is_available
except ImportError:
    logger.error("无法导入 llm_client.py，请确保该文件存在于 scripts/ 目录")
    sys.exit(1)

PAPERS_FILE = DATA_DIR / "academic_papers.json"
BATCH_SIZE = 5  # 每批处理的论文数


def load_papers() -> list[dict]:
    """加载论文数据"""
    if not PAPERS_FILE.exists():
        logger.error(f"论文数据文件不存在: {PAPERS_FILE}")
        return []
    with open(PAPERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data.get("items", []) if isinstance(data, dict) else data
    return items


def save_papers(items: list[dict]):
    """保存论文数据"""
    with open(PAPERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["items"] = items
    data["metadata"]["summarized_at"] = datetime.now().isoformat()
    with open(PAPERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"已保存 {len(items)} 篇论文到 {PAPERS_FILE}")


def generate_summary_zh(title: str, abstract: str) -> str | None:
    """调用 LLM 生成中文摘要"""
    if not abstract or len(abstract.strip()) < 20:
        return None

    prompt = f"""你是一位文化遗产领域的学术编辑。请将以下英文学术论文摘要翻译并精炼为 2-3 句中文概述（不超过 150 字），突出研究问题、方法和核心发现。

标题: {title}

摘要: {abstract[:2000]}

请直接输出中文概述，不要加前缀或引号。"""

    messages = [{"role": "user", "content": prompt}]
    return chat(messages, max_tokens=300, temperature=0.3)


def generate_summary_en(title: str, abstract: str) -> str | None:
    """调用 LLM 生成英文精炼摘要"""
    if not abstract or len(abstract.strip()) < 20:
        return None

    prompt = f"""You are an academic editor in cultural heritage. Refine the following abstract into a concise 2-3 sentence English summary (max 150 words), highlighting research question, methodology, and key findings.

Title: {title}

Abstract: {abstract[:2000]}

Output the refined English summary directly, without any prefix or quotation marks."""

    messages = [{"role": "user", "content": prompt}]
    return chat(messages, max_tokens=300, temperature=0.3)


def generate_summary(title: str, abstract: str) -> str | None:
    """兼容旧版调用，生成中文摘要"""
    return generate_summary_zh(title, abstract)


def main():
    force = "--force" in sys.argv

    # 解析 --output-lang 参数
    output_lang = "zh"  # 默认仅中文，向后兼容
    for i, arg in enumerate(sys.argv):
        if arg == "--output-lang" and i + 1 < len(sys.argv):
            val = sys.argv[i + 1]
            if val in ("zh", "en", "bilingual"):
                output_lang = val
            else:
                logger.error(f"无效的 --output-lang 值: {val}，可选: zh, en, bilingual")
                sys.exit(1)

    if not is_available():
        logger.error("LLM_API_KEY 未配置，无法生成摘要。请设置环境变量后重试。")
        sys.exit(1)

    logger.info("=" * 50)
    logger.info(f"论文摘要生成启动 (output-lang={output_lang})")
    logger.info("=" * 50)

    papers = load_papers()
    logger.info(f"加载论文: {len(papers)} 篇")

    # 筛选需要处理的论文
    to_process = []
    for p in papers:
        need_zh = output_lang in ("zh", "bilingual") and (
            force or not p.get("paper_summary") or len(p.get("paper_summary", "")) < 10
        )
        need_en = output_lang in ("en", "bilingual") and (
            force or not p.get("english_summary") or len(p.get("english_summary", "")) < 10
        )
        if need_zh or need_en:
            to_process.append(p)

    if not to_process:
        logger.info("所有论文已有摘要，无需处理。使用 --force 强制重新生成。")
        return 0

    logger.info(f"待处理: {len(to_process)} 篇 (已跳过 {len(papers) - len(to_process)} 篇)")

    generated_zh = 0
    generated_en = 0
    failed_zh = 0
    failed_en = 0

    for i, paper in enumerate(to_process):
        title = paper.get("title", "")
        abstract = paper.get("abstract", "")

        logger.info(f"[{i+1}/{len(to_process)}] {title[:60]}...")

        need_zh = output_lang in ("zh", "bilingual") and (
            force or not paper.get("paper_summary") or len(paper.get("paper_summary", "")) < 10
        )
        need_en = output_lang in ("en", "bilingual") and (
            force or not paper.get("english_summary") or len(paper.get("english_summary", "")) < 10
        )

        if need_zh:
            zh_summary = generate_summary_zh(title, abstract)
            if zh_summary:
                paper["paper_summary"] = zh_summary
                generated_zh += 1
                logger.info(f"  中文摘要已生成 ({len(zh_summary)} 字)")
            else:
                failed_zh += 1
                logger.warning("  中文摘要生成失败")

        if need_en:
            en_summary = generate_summary_en(title, abstract)
            if en_summary:
                paper["english_summary"] = en_summary
                generated_en += 1
                logger.info(f"  English summary generated ({len(en_summary)} chars)")
            else:
                failed_en += 1
                logger.warning("  English summary generation failed")

    # 写回
    total_generated = generated_zh + generated_en
    if total_generated > 0:
        save_papers(papers)

    logger.info(
        f"完成: 中文生成 {generated_zh} 篇/失败 {failed_zh} 篇, "
        f"英文生成 {generated_en} 篇/失败 {failed_en} 篇"
    )
    print(f"\n{'='*50}")
    print(f"摘要生成完成 (output-lang={output_lang})")
    if output_lang in ("zh", "bilingual"):
        print(f"  中文摘要: 生成 {generated_zh} 篇, 失败 {failed_zh} 篇")
    if output_lang in ("en", "bilingual"):
        print(f"  英文摘要: 生成 {generated_en} 篇, 失败 {failed_en} 篇")
    print(f"  日志: {LOG_FILE}")
    print(f"{'='*50}")
    return 0


if __name__ == "__main__":
    sys.exit(main())