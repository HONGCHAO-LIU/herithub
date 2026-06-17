#!/usr/bin/env python3
"""
论文摘要生成脚本 (auto_summary.py)
====================================
读取 academic_papers.json，对论文摘要调用 LLM 生成精炼概述。

使用方式:
  python auto_summary.py                             # 增量中文摘要（默认）
  python auto_summary.py --force                     # 强制重新生成
  python auto_summary.py --output-lang zh            # 仅生成中文摘要
  python auto_summary.py --output-lang en            # 仅生成英文精炼摘要
  python auto_summary.py --output-lang bilingual     # 同时生成中英文

字段:
  - paper_summary      — 中文精炼摘要（2-3 句，≤150 字）
  - english_abstract   — 英文精炼摘要（2-3 sentences）

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


def parse_args() -> dict:
    """解析命令行参数，返回 {output_lang, force}"""
    args = {
        "output_lang": "zh",  # zh | en | bilingual
        "force": False,
    }

    i = 1
    while i < len(sys.argv):
        if sys.argv[i] == "--output-lang" and i + 1 < len(sys.argv):
            val = sys.argv[i + 1]
            if val in ("zh", "en", "bilingual"):
                args["output_lang"] = val
            else:
                logger.error(f"无效的 --output-lang 值: {val}，应为 zh / en / bilingual")
                sys.exit(1)
            i += 2
        elif sys.argv[i] == "--force":
            args["force"] = True
            i += 1
        else:
            i += 1
    return args


def load_papers() -> list[dict]:
    """加载论文数据，兼容数组和 {items: [...]} 两种格式"""
    if not PAPERS_FILE.exists():
        logger.error(f"论文数据文件不存在: {PAPERS_FILE}")
        return []
    with open(PAPERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    return data


def save_papers(items: list[dict]):
    """保存论文数据，保持原文件结构"""
    with open(PAPERS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data["items"] = items
        if "metadata" not in data:
            data["metadata"] = {}
        data["metadata"]["summarized_at"] = datetime.now().isoformat()
        data["metadata"]["output_lang"] = parse_args()["output_lang"]
    else:
        data = items

    with open(PAPERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"已保存 {len(items)} 篇论文到 {PAPERS_FILE}")


def generate_zh_summary(title: str, abstract: str) -> str | None:
    """调用 LLM 生成中文精炼摘要"""
    if not abstract or len(abstract.strip()) < 20:
        return None

    prompt = f"""你是一位文化遗产领域的学术编辑。请将以下英文学术论文摘要翻译并精炼为 2-3 句中文概述（不超过 150 字），突出研究问题、方法和核心发现。

标题: {title}

摘要: {abstract[:2000]}

请直接输出中文概述，不要加前缀或引号。"""

    messages = [{"role": "user", "content": prompt}]
    return chat(messages, max_tokens=300, temperature=0.3)


def generate_en_summary(title: str, abstract: str) -> str | None:
    """调用 LLM 生成英文精炼摘要（从原文提炼 2-3 句核心要点）"""
    if not abstract or len(abstract.strip()) < 20:
        return None

    prompt = f"""You are an academic editor in the cultural heritage field. Condense the following paper abstract into 2-3 concise English sentences (no more than 120 words), highlighting the research problem, method, and core findings. Do not add commentary or quotation marks.

Title: {title}

Abstract: {abstract[:2000]}

Output only the refined English summary:"""

    messages = [{"role": "user", "content": prompt}]
    return chat(messages, max_tokens=250, temperature=0.3)


def needs_processing(paper: dict, lang: str, force: bool) -> bool:
    """判断论文是否需要处理"""
    if force:
        return True
    if lang in ("zh", "bilingual"):
        if not paper.get("paper_summary") or len(paper.get("paper_summary", "")) < 10:
            return True
    if lang in ("en", "bilingual"):
        if not paper.get("english_abstract") or len(paper.get("english_abstract", "")) < 10:
            return True
    return False


def main():
    args = parse_args()
    output_lang = args["output_lang"]
    force = args["force"]

    if not is_available():
        logger.error("LLM_API_KEY 未配置，无法生成摘要。请设置环境变量后重试。")
        sys.exit(1)

    logger.info("=" * 56)
    logger.info(f"论文摘要生成启动 (output_lang={output_lang}, force={force})")
    logger.info("=" * 56)

    papers = load_papers()
    logger.info(f"加载论文: {len(papers)} 篇")

    # 筛选需要处理的论文
    to_process = [p for p in papers if needs_processing(p, output_lang, force)]

    if not to_process:
        logger.info("所有论文已有对应摘要，无需处理。使用 --force 强制重新生成。")
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

        # 中文摘要
        if output_lang in ("zh", "bilingual"):
            # 中文论文跳过中文摘要生成（原文已是中文）
            if force or not paper.get("paper_summary"):
                zh = generate_zh_summary(title, abstract)
                if zh:
                    paper["paper_summary"] = zh
                    generated_zh += 1
                    logger.info(f"  paper_summary ({len(zh)} 字)")
                else:
                    failed_zh += 1
                    logger.warning("  paper_summary 生成失败")

        # 英文精炼摘要
        if output_lang in ("en", "bilingual"):
            if force or not paper.get("english_abstract"):
                en = generate_en_summary(title, abstract)
                if en:
                    paper["english_abstract"] = en
                    generated_en += 1
                    logger.info(f"  english_abstract ({len(en)} chars)")
                else:
                    failed_en += 1
                    logger.warning("  english_abstract 生成失败")

    # 写回
    total_generated = generated_zh + generated_en
    if total_generated > 0:
        save_papers(papers)

    logger.info(f"完成: paper_summary 生成 {generated_zh} 篇 / 失败 {failed_zh} 篇")
    logger.info(f"完成: english_abstract 生成 {generated_en} 篇 / 失败 {failed_en} 篇")
    print(f"\n{'='*56}")
    print(f"摘要生成完成 (output_lang={output_lang})")
    print(f"  paper_summary:    {generated_zh} 成功, {failed_zh} 失败")
    print(f"  english_abstract: {generated_en} 成功, {failed_en} 失败")
    print(f"  日志: {LOG_FILE}")
    print(f"{'='*56}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
