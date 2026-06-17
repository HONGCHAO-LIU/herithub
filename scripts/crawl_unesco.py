#!/usr/bin/env python3
"""
crawl_unesco.py — UNESCO 世界遗产 API 数据采集脚本

采集 UNESCO 世界遗产中心 API 数据，转换为项目 heritage.json 格式。

用法:
    python scripts/crawl_unesco.py                    # 采集全部
    python scripts/crawl_unesco.py --limit 50          # 限制 50 条
    python scripts/crawl_unesco.py --dry-run           # 只打印不写入
    python scripts/crawl_unesco.py --limit 20 --dry-run

数据来源: https://whc.unesco.org/en/list/json/
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error
import ssl
from pathlib import Path

# ── 配置常量 ──────────────────────────────────────────────
API_URL = "https://whc.unesco.org/en/list/json/"
REQUEST_TIMEOUT = 30  # 请求超时（秒）
MAX_RETRIES = 3       # 最大重试次数
RETRY_BACKOFF = 2.0   # 退避基础秒数（指数增长）

# 分类映射：UNESCO category → 项目分类字段
CATEGORY_MAP = {
    "Cultural": "文化遗产",
    "Natural": "自然遗产",
    "Mixed": "文化与自然双重遗产",
}

# 输出路径（相对于项目根目录）
OUTPUT_FILE = "src/data/unesco_heritage.json"


def get_project_root() -> Path:
    """获取项目根目录（scripts/ 的父目录）。"""
    return Path(__file__).resolve().parent.parent


def fetch_unesco_data() -> list:
    """
    带重试逻辑调用 UNESCO API，返回遗产列表 JSON。

    退避策略：指数退避，RETRY_BACKOFF * 2^attempt 秒。
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(
                API_URL,
                headers={"User-Agent": "HeritHub-DataCollector/1.0"},
            )
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT, context=ctx) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)

                # UNESCO API 返回结构：{ "data": [ ... ] }
                if isinstance(data, dict) and "data" in data:
                    return data["data"]
                if isinstance(data, list):
                    return data
                print(f"[WARN] 未知的 API 响应结构，keys={list(data.keys()) if isinstance(data, dict) else type(data)}",
                      file=sys.stderr)
                return data if isinstance(data, list) else []

        except urllib.error.HTTPError as e:
            last_error = e
            if e.code == 429:
                wait = RETRY_BACKOFF * (2 ** attempt)
                print(f"[WARN] HTTP 429 限流，{wait:.0f}s 后重试 (attempt {attempt+1}/{MAX_RETRIES})",
                      file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"[ERROR] HTTP {e.code}: {e.reason}", file=sys.stderr)
            raise
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last_error = e
            wait = RETRY_BACKOFF * (2 ** attempt)
            print(f"[WARN] 网络错误: {e}, {wait:.0f}s 后重试 (attempt {attempt+1}/{MAX_RETRIES})",
                  file=sys.stderr)
            time.sleep(wait)
            continue
        except json.JSONDecodeError as e:
            last_error = e
            print(f"[ERROR] JSON 解析失败: {e}", file=sys.stderr)
            raise

    print(f"[FATAL] 已达最大重试次数，最终错误: {last_error}", file=sys.stderr)
    raise RuntimeError(f"UNESCO API 请求失败，已重试 {MAX_RETRIES} 次")


def transform_item(item: dict, index: int) -> dict:
    """
    将单条 UNESCO API 返回数据转换为 heritage.json 格式。

    UNESCO API 字段（示例）：
        - id_number
        - category (Cultural / Natural / Mixed)
        - name_en, name_fr
        - short_description_en, short_description_fr
        - states (逗号分隔国家列表)
        - region
        - latitude, longitude
        - image_url
        - date_inscribed
    """
    category_raw = item.get("category", "")
    category_cn = CATEGORY_MAP.get(category_raw, category_raw)

    states_raw = item.get("states", "")
    # states 可能是逗号分隔的字符串或列表
    if isinstance(states_raw, list):
        country = states_raw[0] if states_raw else ""
    elif isinstance(states_raw, str):
        country = states_raw.split(",")[0].strip()
    else:
        country = ""

    region_raw = item.get("region", "")

    # 名称：英文名优先
    name = item.get("name_en", "") or item.get("name_fr", "") or f"UNESCO-{item.get('id_number', index)}"
    # 描述：英文短描述优先
    desc_en = item.get("short_description_en", "")
    desc = desc_en if desc_en else "暂无详细描述"

    # 网址
    item_id = item.get("id_number", "")
    url = f"https://whc.unesco.org/en/list/{item_id}" if item_id else "https://whc.unesco.org/en/list/"

    return {
        "名称": name,
        "网址": url,
        "描述": desc,
        "来源": "UNESCO WHC API",
        "分类": "世界遗产",
        "地区": f"国际-{country}" if country else "国际",
        "平台类型": "网站",
    }


def main():
    parser = argparse.ArgumentParser(description="采集 UNESCO 世界遗产数据")
    parser.add_argument("--limit", type=int, default=0,
                        help="限制采集数量，0 或不传表示全部")
    parser.add_argument("--dry-run", action="store_true",
                        help="只打印预览，不写入文件")
    args = parser.parse_args()

    root = get_project_root()
    output_path = root / OUTPUT_FILE

    # 1. 获取数据
    print("[crawl_unesco] 请求 UNESCO API ...")
    raw_data = fetch_unesco_data()
    print(f"[crawl_unesco] 已获取 {len(raw_data)} 条世界遗产记录")

    # 2. 截取（如有 --limit）
    if args.limit and args.limit > 0:
        raw_data = raw_data[: args.limit]
        print(f"[crawl_unesco] --limit={args.limit}，实际采集 {len(raw_data)} 条")

    # 3. 转换格式
    transformed = []
    for i, item in enumerate(raw_data):
        try:
            transformed.append(transform_item(item, i))
        except Exception as e:
            print(f"[WARN] 第 {i+1} 条转换失败: {e}", file=sys.stderr)
            continue

    print(f"[crawl_unesco] 成功转换 {len(transformed)} 条 / 总计 {len(raw_data)} 条")

    # 4. 输出
    if args.dry_run:
        print("\n[crawl_unesco] --dry-run 模式，预览前 5 条：")
        for item in transformed[:5]:
            print(json.dumps(item, ensure_ascii=False, indent=2))
            print("---")
        print(f"\n... 共 {len(transformed)} 条（未写入文件）")
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(transformed, f, ensure_ascii=False, indent=2)
        print(f"[crawl_unesco] 已保存到 {output_path}")


if __name__ == "__main__":
    main()
