#!/usr/bin/env python3
"""
合并与站点生成脚本 (merge_and_generate.py)
===========================================
用途: 读取所有原始数据文件，执行去重、时效性过滤，合并到正式数据文件。
      归档过期数据，输出数据统计摘要。

输入:
  - src/data/raw_business.json
  - src/data/raw_conferences.json
  - src/data/raw_papers.json
  - src/data/business_intelligence.json (现有)
  - src/data/academic_conferences.json (现有)
  - src/data/academic_papers.json (现有)

输出:
  - src/data/business_intelligence.json (合并后)
  - src/data/academic_conferences.json (合并后)
  - src/data/academic_papers.json (合并后)
  - src/data/archive/ (过期数据)
  - src/data/merge_statistics.json (统计摘要)

依赖: json, logging, datetime, pathlib, hashlib, shutil, sys, os
"""

import hashlib
import json
import logging
import os
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ==================== 路径配置 ====================
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
ARCHIVE_DIR = DATA_DIR / "archive"
LOGS_DIR = SCRIPT_DIR / "logs"

RAW_FILES = {
    "business": DATA_DIR / "raw_business.json",
    "conferences": DATA_DIR / "raw_conferences.json",
    "papers": DATA_DIR / "raw_papers.json",
}
MERGED_FILES = {
    "business": DATA_DIR / "business_intelligence.json",
    "conferences": DATA_DIR / "academic_conferences.json",
    "papers": DATA_DIR / "academic_papers.json",
}
STATS_FILE = DATA_DIR / "merge_statistics.json"

os.makedirs(ARCHIVE_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# ==================== 日志配置 ====================
LOG_FILE = LOGS_DIR / f"merge_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# ==================== 时效性阈值 ====================
NOW = datetime.now()
FRESHNESS = {
    "business": timedelta(days=90),       # 商业情报: 3个月
    "conferences": timedelta(days=60),    # 会议: 当前+未来2月
    "papers": timedelta(days=365),        # 论文: 12个月
}

# ==================== 工具函数 ====================
def make_dedup_key(item: dict) -> str:
    """基于标题+来源链接生成去重哈希"""
    title = item.get("title", "") or item.get("name", "")
    url = item.get("url", "") or item.get("link", "")
    raw = f"{title}|{url}".strip()
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def parse_date(date_str: str) -> datetime | None:
    """尝试多种格式解析日期"""
    if not date_str:
        return None
    import re
    # 提取日期部分
    match = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", str(date_str))
    if match:
        try:
            return datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except ValueError:
            pass
    return None


def is_fresh(item: dict, category: str) -> bool:
    """判断数据是否在时效窗口内"""
    threshold = FRESHNESS.get(category, timedelta(days=90))
    cutoff = NOW - threshold

    # 尝试多个日期字段
    date_str = (item.get("publish_date", "") or item.get("date", "")
                or item.get("published", "") or item.get("crawled_at", ""))
    if not date_str:
        # 无日期则保留（可能是持续有效数据）
        return True

    parsed = parse_date(date_str)
    if parsed is None:
        return True  # 无法解析日期则保留

    return parsed >= cutoff


def load_json(file_path: Path) -> dict:
    """安全加载JSON"""
    if not file_path.exists():
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"加载 {file_path.name} 失败: {e}")
        return {}


def save_json(file_path: Path, data: dict):
    """安全写入JSON"""
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"  已写入: {file_path} ({len(data.get('items', []))} 条)")
    except Exception as e:
        logger.error(f"  写入 {file_path.name} 失败: {e}")


# ==================== 合并逻辑 ====================
def merge_category(category: str) -> dict:
    """合并单个类别的数据"""
    logger.info(f"--- 合并类别: {category} ---")
    raw_file = RAW_FILES[category]
    merged_file = MERGED_FILES[category]

    # 加载原始数据
    raw_data = load_json(raw_file)
    raw_items = raw_data.get("items", []) if isinstance(raw_data, dict) else raw_data
    logger.info(f"  原始数据: {len(raw_items)} 条")

    # 加载现有合并数据
    existing_data = load_json(merged_file)
    existing_items = existing_data.get("items", []) if isinstance(existing_data, dict) else existing_data
    logger.info(f"  现有数据: {len(existing_items)} 条")

    # 合并
    all_items = list(raw_items) + list(existing_items)

    # 时效性过滤 → 分为新鲜和过期
    fresh_items = []
    expired_items = []
    for item in all_items:
        if is_fresh(item, category):
            fresh_items.append(item)
        else:
            expired_items.append(item)

    logger.info(f"  时效过滤: {len(fresh_items)} 新鲜, {len(expired_items)} 过期")

    # 去重
    seen = {}
    deduped = []
    for item in fresh_items:
        key = make_dedup_key(item)
        if key not in seen:
            seen[key] = item
            deduped.append(item)
    dup_count = len(fresh_items) - len(deduped)
    if dup_count > 0:
        logger.info(f"  去重: 移除 {dup_count} 条重复")

    # 按日期降序排列
    deduped.sort(
        key=lambda x: parse_date(x.get("publish_date", "") or x.get("date", "")
                                  or x.get("published", "") or x.get("crawled_at", ""))
        or datetime.min,
        reverse=True,
    )

    # 生成输出
    output = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "category": category,
            "total_items": len(deduped),
            "freshness_days": FRESHNESS[category].days,
            "sources": {},
        },
        "items": deduped,
    }

    # 统计来源
    source_count = {}
    for item in deduped:
        src = item.get("source", "unknown")
        source_count[src] = source_count.get(src, 0) + 1
    output["metadata"]["sources"] = source_count

    # 写入合并文件
    save_json(merged_file, output)

    # 归档过期数据
    if expired_items:
        archive_name = f"{category}_{NOW.strftime('%Y%m%d_%H%M%S')}.json"
        archive_path = ARCHIVE_DIR / archive_name
        archive_data = {
            "metadata": {
                "archived_at": datetime.now().isoformat(),
                "category": category,
                "total_items": len(expired_items),
                "reason": f"超出 {FRESHNESS[category].days} 天时效",
            },
            "items": expired_items,
        }
        save_json(archive_path, archive_data)
        logger.info(f"  已归档 {len(expired_items)} 条到 archive/{archive_name}")

    return {
        "category": category,
        "raw_count": len(raw_items),
        "existing_count": len(existing_items),
        "fresh_count": len(fresh_items),
        "expired_count": len(expired_items),
        "duplicate_removed": dup_count,
        "final_count": len(deduped),
        "sources": source_count,
    }


# ==================== 主流程 ====================
def main():
    logger.info("=" * 60)
    logger.info(f"合并与站点生成脚本启动 — {datetime.now().isoformat()}")
    logger.info("=" * 60)

    results = {}
    for category in ["business", "conferences", "papers"]:
        try:
            results[category] = merge_category(category)
        except Exception as e:
            logger.error(f"合并 {category} 失败: {e}")
            results[category] = {"category": category, "error": str(e)}

    # 输出统计摘要
    total_final = sum(r.get("final_count", 0) for r in results.values())
    total_expired = sum(r.get("expired_count", 0) for r in results.values())

    statistics = {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_final_items": total_final,
            "total_expired_archived": total_expired,
        },
        "details": results,
    }

    try:
        with open(STATS_FILE, "w", encoding="utf-8") as f:
            json.dump(statistics, f, ensure_ascii=False, indent=2)
        logger.info(f"统计摘要已写入: {STATS_FILE}")
    except Exception as e:
        logger.error(f"写入统计失败: {e}")

    # 控制台摘要
    print(f"\n{'='*60}")
    print(f" 合并与站点生成摘要")
    print(f"{'='*60}")
    for cat, r in results.items():
        if "error" in r:
            print(f"  {cat}: 错误 - {r['error']}")
            continue
        print(f"\n  [{cat}]")
        print(f"    原始: {r['raw_count']} | 现有: {r['existing_count']}")
        print(f"    新鲜: {r['fresh_count']} | 过期: {r['expired_count']}")
        print(f"    去重移除: {r['duplicate_removed']} | 最终: {r['final_count']}")
        print(f"    来源分布: {r['sources']}")
    print(f"\n  总计: {total_final} 条 (归档 {total_expired} 条)")
    print(f"  统计文件: {STATS_FILE}")
    print(f"  日志文件: {LOG_FILE}")
    print(f"{'='*60}")
    logger.info("合并与生成完成")
    return 0


if __name__ == "__main__":
    sys.exit(main())
