#!/usr/bin/env python3
"""
AI 数据审核脚本 (ai_review.py)
===============================
对采集结果进行 LLM 辅助审核：分类修正、标签推荐、质量评分。

使用方式:
  python ai_review.py                # 审核所有 raw 文件
  python ai_review.py --business     # 仅审核商业情报
  python ai_review.py --dry-run      # 仅输出审核建议，不修改数据

依赖:
  - llm_client.py (同目录)
  - LLM_API_KEY 环境变量

输出:
  - 更新 raw_business.json / raw_conferences.json / raw_papers.json
  - 生成 review_report.json
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

LOG_FILE = LOGS_DIR / f"review_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

sys.path.insert(0, str(SCRIPT_DIR))
try:
    from llm_client import chat, is_available
except ImportError:
    logger.error("无法导入 llm_client.py")
    sys.exit(1)

RAW_FILES = {
    "business": DATA_DIR / "raw_business.json",
    "conferences": DATA_DIR / "raw_conferences.json",
    "papers": DATA_DIR / "raw_papers.json",
}
REPORT_FILE = DATA_DIR / "review_report.json"
BATCH_SIZE = 10

# 文化遗产领域分类体系
HERITAGE_CATEGORIES = [
    "考古发掘", "文物保护", "博物馆建设", "数字化与信息化",
    "非物质文化遗产", "遗址保护与规划", "文物修复", "展陈设计",
    "学术研究与出版", "文化遗产管理", "文创开发", "国际合作",
    "教育培训", "政策法规", "其他",
]


def review_business(items: list[dict], dry_run: bool) -> list[dict]:
    """审核商业情报分类"""
    if not items:
        return []

    # 批量处理，每次发送 BATCH_SIZE 条
    changes = []
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        logger.info(f"  审核商业情报 {i+1}-{min(i+BATCH_SIZE, len(items))}/{len(items)}")

        items_text = "\n---\n".join([
            f"[{j}] 标题: {it.get('title', '')[:80]}\n"
            f"    描述: {it.get('description', '')[:150]}\n"
            f"    当前分类: {it.get('sector', it.get('category', '未分类'))}"
            for j, it in enumerate(batch)
        ])

        prompt = f"""你是文化遗产领域数据审核专家。请逐条审核以下商业情报条目，纠正不准确的分类。

可用分类: {', '.join(HERITAGE_CATEGORIES)}

{items_text}

请对每条返回 JSON 数组，格式:
[{{"index": 序号, "category": "正确分类", "quality": 1-5, "tags": ["标签1", "标签2"], "note": "简短说明"}}]

仅返回 JSON 数组，不要加任何前缀。"""

        result = chat([{"role": "user", "content": prompt}], max_tokens=2000, temperature=0.2)
        if not result:
            continue

        try:
            # 提取 JSON 部分
            start = result.find("[")
            end = result.rfind("]") + 1
            if start >= 0 and end > start:
                parsed = json.loads(result[start:end])
                for rec in parsed:
                    idx = rec.get("index", -1)
                    if 0 <= idx < len(batch):
                        item = batch[idx]
                        old_cat = item.get("sector", item.get("category", ""))
                        new_cat = rec.get("category", old_cat)
                        if new_cat != old_cat:
                            if not dry_run and new_cat in HERITAGE_CATEGORIES:
                                item["sector"] = new_cat
                                item["category"] = new_cat
                            changes.append({
                                "title": item.get("title", "")[:60],
                                "old_category": old_cat,
                                "new_category": new_cat,
                                "quality": rec.get("quality", 3),
                                "note": rec.get("note", ""),
                            })
                        # 添加质量评分
                        quality = rec.get("quality", 3)
                        if isinstance(quality, int) and 1 <= quality <= 5:
                            if not dry_run:
                                item["ai_quality_score"] = quality
                            if quality <= 2:
                                if not dry_run:
                                    item["ai_flagged"] = True
                                    item["ai_flag_reason"] = rec.get("note", "低质量")
                                changes.append({
                                    "title": item.get("title", "")[:60],
                                    "old_category": old_cat,
                                    "new_category": new_cat,
                                    "quality": quality,
                                    "flagged": True,
                                    "note": rec.get("note", ""),
                                })
                        # 推荐标签
                        tags = rec.get("tags", [])
                        if tags and not dry_run:
                            existing = item.get("tags", [])
                            if isinstance(existing, list):
                                item["tags"] = list(set(existing + tags))
        except Exception as e:
            logger.warning(f"  解析审核结果失败: {e}")

    return changes


def review_conferences(items: list[dict], dry_run: bool) -> list[dict]:
    """审核会议分类和日期"""
    if not items:
        return []

    changes = []
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        logger.info(f"  审核会议 {i+1}-{min(i+BATCH_SIZE, len(items))}/{len(items)}")

        items_text = "\n---\n".join([
            f"[{j}] 名称: {it.get('name', it.get('title', ''))[:80]}\n"
            f"    日期: {it.get('date', '待定')}\n"
            f"    地点: {it.get('location', '未知')}\n"
            f"    组织者: {it.get('organizer', '未知')}"
            for j, it in enumerate(batch)
        ])

        prompt = f"""你是文化遗产领域会议审核专家。请审核以下会议条目，评估其质量和相关性。

{items_text}

对每条返回 JSON 数组:
[{{"index": 序号, "quality": 1-5, "tags": ["标签"], "note": "说明"}}]

仅返回 JSON 数组。"""

        result = chat([{"role": "user", "content": prompt}], max_tokens=1500, temperature=0.2)
        if not result:
            continue

        try:
            start = result.find("[")
            end = result.rfind("]") + 1
            if start >= 0 and end > start:
                parsed = json.loads(result[start:end])
                for rec in parsed:
                    idx = rec.get("index", -1)
                    if 0 <= idx < len(batch):
                        item = batch[idx]
                        quality = rec.get("quality", 3)
                        if not dry_run:
                            item["ai_quality_score"] = quality
                        if quality <= 2:
                            if not dry_run:
                                item["ai_flagged"] = True
                            changes.append({
                                "title": item.get("name", "")[:60],
                                "quality": quality,
                                "flagged": True,
                                "note": rec.get("note", ""),
                            })
                        tags = rec.get("tags", [])
                        if tags and not dry_run:
                            existing = item.get("tags", [])
                            if isinstance(existing, list):
                                item["tags"] = list(set(existing + tags))
        except Exception as e:
            logger.warning(f"  解析审核结果失败: {e}")

    return changes


def main():
    dry_run = "--dry-run" in sys.argv
    business_only = "--business" in sys.argv

    if not is_available():
        logger.error("LLM_API_KEY 未配置，无法执行审核。")
        sys.exit(1)

    logger.info("=" * 50)
    logger.info(f"AI 数据审核启动 {'(dry-run)' if dry_run else ''}")
    logger.info("=" * 50)

    all_changes = {}

    if not business_only:
        for cat_key, cat_label in [("conferences", "会议"), ("papers", "论文")]:
            raw_file = RAW_FILES[cat_key]
            if not raw_file.exists():
                logger.info(f"跳过 {cat_label}: raw 文件不存在")
                continue

            with open(raw_file, "r", encoding="utf-8") as f:
                raw = json.load(f)
            items = raw.get("items", []) if isinstance(raw, dict) else raw
            logger.info(f"审核 {cat_label}: {len(items)} 条")

            if cat_key == "conferences":
                changes = review_conferences(items, dry_run)
            else:
                # papers: 简单质量评分
                changes = []
                for it in items:
                    if not it.get("ai_quality_score"):
                        it["ai_quality_score"] = 3  # 默认中等

            if changes:
                all_changes[cat_key] = changes
                logger.info(f"  {cat_label} 变更: {len(changes)} 条")

            if not dry_run and changes:
                raw["items"] = items
                with open(raw_file, "w", encoding="utf-8") as f:
                    json.dump(raw, f, ensure_ascii=False, indent=2)

    # 审核商业情报
    raw_file = RAW_FILES["business"]
    if raw_file.exists():
        with open(raw_file, "r", encoding="utf-8") as f:
            raw = json.load(f)
        items = raw.get("items", []) if isinstance(raw, dict) else raw
        logger.info(f"审核商业情报: {len(items)} 条")

        changes = review_business(items, dry_run)
        if changes:
            all_changes["business"] = changes
            logger.info(f"  商业情报变更: {len(changes)} 条")

        if not dry_run and changes:
            raw["items"] = items
            with open(raw_file, "w", encoding="utf-8") as f:
                json.dump(raw, f, ensure_ascii=False, indent=2)

    # 输出报告
    report = {
        "generated_at": datetime.now().isoformat(),
        "dry_run": dry_run,
        "changes": all_changes,
    }
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"AI 审核完成")
    total = sum(len(v) for v in all_changes.values())
    print(f"  变更: {total} 条")
    print(f"  报告: {REPORT_FILE}")
    print(f"  日志: {LOG_FILE}")
    print(f"{'='*50}")
    return 0


if __name__ == "__main__":
    sys.exit(main())