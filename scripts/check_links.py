#!/usr/bin/env python3
"""
链接可达性检查脚本 (check_links.py)
===========================================
用途: 遍历 src/data/ 下所有 JSON 文件中的 URL，异步检查外链可达性。
      标记失效链接（HTTP 状态码 >= 400 或超时），生成失效链接报告，
      并更新各数据文件中的链接状态字段。

输入: src/data/ 下所有 .json 文件
输出: src/data/link_check_report.json
副作用: 更新各数据文件中条目的 link_status 字段

依赖: aiohttp, asyncio, json, logging, datetime, pathlib, re, sys, os
"""

import asyncio
import json
import logging
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import aiohttp

# ==================== 路径配置 ====================
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
LOGS_DIR = SCRIPT_DIR / "logs"
REPORT_FILE = DATA_DIR / "link_check_report.json"

os.makedirs(LOGS_DIR, exist_ok=True)

# ==================== 日志配置 ====================
LOG_FILE = LOGS_DIR / f"check_links_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# ==================== 常量 ====================
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=15, connect=10)
MAX_CONCURRENT = 10  # 最大并发数
USER_AGENT = "ZhihuiYicang-LinkChecker/1.0"

# 需要跳过检查的域名/URL模式
SKIP_PATTERNS = [
    r"localhost",
    r"127\.0\.0\.1",
    r"\.local$",
    r"example\.com",
    r"^$",  # 空URL
]

# 需要从中提取URL的字段名
URL_FIELDS = {"url", "link", "website", "homepage", "doi_url"}


# ==================== URL 提取 ====================
def is_skippable(url: str) -> bool:
    """判断URL是否应跳过"""
    if not url or not url.strip():
        return True
    for pattern in SKIP_PATTERNS:
        if re.search(pattern, url):
            return True
    return False


def extract_urls_from_item(item: dict, item_index: int) -> list[tuple[str, str]]:
    """从单条数据中提取所有URL及其字段名"""
    urls = []
    for field in URL_FIELDS:
        val = item.get(field, "")
        if isinstance(val, str) and not is_skippable(val):
            urls.append((field, val))
    # 也检查 link 的别名
    aliases = ["link", "source_url", "reference_url", "pdf_url"]
    for alias in aliases:
        if alias not in URL_FIELDS:
            val = item.get(alias, "")
            if isinstance(val, str) and not is_skippable(val):
                urls.append((alias, val))
    return urls


def extract_all_urls(data_dir: Path) -> list[dict]:
    """遍历所有JSON文件提取URL"""
    all_links = []
    json_files = list(data_dir.glob("*.json"))

    for json_file in json_files:
        # 跳过报告文件和链接检查报告本身
        if "report" in json_file.name.lower() or "link_check" in json_file.name:
            continue
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            logger.warning(f"无法读取 {json_file.name}: {e}")
            continue

        items = data.get("items", []) if isinstance(data, dict) else data
        if not isinstance(items, list):
            continue

        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            urls = extract_urls_from_item(item, idx)
            for field, url in urls:
                all_links.append({
                    "source_file": json_file.name,
                    "item_index": idx,
                    "item_id": item.get("id", f"idx_{idx}"),
                    "field": field,
                    "url": url,
                    "status": "pending",
                    "http_code": None,
                    "error": None,
                })

    logger.info(f"总计提取 {len(all_links)} 个URL，来自 {len(json_files)} 个文件")
    return all_links


# ==================== 异步检查 ====================
async def check_single_link(
    session: aiohttp.ClientSession,
    link_info: dict,
    semaphore: asyncio.Semaphore,
) -> dict:
    """异步检查单个链接"""
    async with semaphore:
        url = link_info["url"]
        try:
            async with session.head(url, timeout=REQUEST_TIMEOUT,
                                    allow_redirects=True) as resp:
                link_info["http_code"] = resp.status
                link_info["final_url"] = str(resp.url)
                if resp.status >= 400:
                    link_info["status"] = "dead"
                    link_info["error"] = f"HTTP {resp.status}"
                else:
                    link_info["status"] = "alive"
        except asyncio.TimeoutError:
            link_info["status"] = "dead"
            link_info["error"] = "timeout"
            link_info["http_code"] = -1
        except aiohttp.ClientConnectorError as e:
            link_info["status"] = "dead"
            link_info["error"] = f"connection_error: {e}"
            link_info["http_code"] = -2
        except aiohttp.ClientError as e:
            link_info["status"] = "dead"
            link_info["error"] = f"client_error: {e}"
            link_info["http_code"] = -3
        except Exception as e:
            link_info["status"] = "error"
            link_info["error"] = str(e)[:200]
            link_info["http_code"] = -99
        return link_info


async def check_all_links(links: list[dict]) -> list[dict]:
    """异步批量检查所有链接"""
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT, force_close=True)

    async with aiohttp.ClientSession(
        headers={"User-Agent": USER_AGENT},
        connector=connector,
        timeout=REQUEST_TIMEOUT,
    ) as session:
        tasks = [check_single_link(session, link, semaphore) for link in links]
        results = []
        total = len(tasks)
        completed = 0
        for coro in asyncio.as_completed(tasks):
            result = await coro
            results.append(result)
            completed += 1
            if completed % 20 == 0 or completed == total:
                logger.info(f"  进度: {completed}/{total}")

    return results


# ==================== 更新数据文件 ====================
def update_data_files(links: list[dict], data_dir: Path):
    """将检查结果写回到各数据文件"""
    # 按文件分组
    file_groups: dict[str, dict[int, dict[str, str]]] = {}
    for link in links:
        fname = link["source_file"]
        idx = link["item_index"]
        if fname not in file_groups:
            file_groups[fname] = {}
        if idx not in file_groups[fname]:
            file_groups[fname][idx] = {}
        field_key = f"link_status_{link['field']}"
        file_groups[fname][idx][field_key] = link["status"]
        # 也写入全局 link_status
        if "link_status" not in file_groups[fname][idx]:
            file_groups[fname][idx]["link_status"] = link["status"]

    for fname, updates in file_groups.items():
        file_path = data_dir / fname
        if not file_path.exists():
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            items = data.get("items", []) if isinstance(data, dict) else data
            modified = False
            for idx, statuses in updates.items():
                if idx < len(items) and isinstance(items[idx], dict):
                    for k, v in statuses.items():
                        items[idx][k] = v
                    modified = True
            if modified:
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                logger.info(f"更新数据文件: {fname} ({len(updates)} 条)")
        except Exception as e:
            logger.warning(f"更新 {fname} 失败: {e}")


# ==================== 主流程 ====================
def main():
    logger.info("=" * 60)
    logger.info(f"链接可达性检查启动 — {datetime.now().isoformat()}")
    logger.info("=" * 60)

    # 步骤1: 提取所有URL
    all_links = extract_all_urls(DATA_DIR)
    if not all_links:
        logger.warning("未找到任何URL，退出")
        return 0

    # 步骤2: 异步检查
    start_time = time.time()
    logger.info(f"开始检查 {len(all_links)} 个链接...")
    try:
        checked_links = asyncio.run(check_all_links(all_links))
    except Exception as e:
        logger.error(f"异步检查异常: {e}")
        checked_links = all_links

    elapsed = time.time() - start_time
    logger.info(f"检查完成，耗时 {elapsed:.1f}s")

    # 步骤3: 统计
    alive = sum(1 for l in checked_links if l["status"] == "alive")
    dead = sum(1 for l in checked_links if l["status"] == "dead")
    error = sum(1 for l in checked_links if l["status"] == "error")
    dead_links = [l for l in checked_links if l["status"] == "dead"]

    # 步骤4: 更新数据文件
    update_data_files(checked_links, DATA_DIR)

    # 步骤5: 生成报告
    report = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_checked": len(checked_links),
            "alive": alive,
            "dead": dead,
            "error": error,
            "elapsed_seconds": round(elapsed, 1),
        },
        "dead_links": dead_links,
        "all_results": checked_links,
    }

    try:
        with open(REPORT_FILE, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        logger.info(f"报告已写入: {REPORT_FILE}")
    except Exception as e:
        logger.error(f"写入报告失败: {e}")
        return 1

    # 步骤6: 摘要
    print(f"\n{'='*60}")
    print(f" 链接检查摘要")
    print(f"{'='*60}")
    print(f"  总计检查: {len(checked_links)} 个URL")
    print(f"  存活: {alive} | 失效: {dead} | 错误: {error}")
    if dead_links:
        print(f"\n  失效链接详情 (前10条):")
        for dl in dead_links[:10]:
            print(f"    [{dl['source_file']}] {dl['url'][:70]}...")
            print(f"    原因: {dl.get('error', 'unknown')}")
    print(f"\n  报告文件: {REPORT_FILE}")
    print(f"  日志文件: {LOG_FILE}")
    print(f"{'='*60}")
    logger.info("链接检查完成")
    return 0 if dead == 0 else 0  # 不因有死链而退出非零


if __name__ == "__main__":
    sys.exit(main())
