#!/usr/bin/env python3
"""
crawl_provincial_heritage.py — 各省文物局/文旅厅遗产数据采集框架

为 5 个重点省份（北京/陕西/河南/江苏/四川）预设采集骨架。
当前为框架版本，包含通用 HTML 表格解析函数和各省份 URL + 策略注释。
实际适配需要根据各省网站结构逐个实现。

用法:
    python scripts/crawl_provincial_heritage.py --province 北京
    python scripts/crawl_provincial_heritage.py --province all --dry-run
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional

# ── 第三方依赖（按需安装） ─────────────────────────────────
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("[ERROR] 请先安装依赖: pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(1)

# ── 配置 ──────────────────────────────────────────────────
REQUEST_TIMEOUT = 30
USER_AGENT = "HeritHub-DataCollector/1.0 (research)"
OUTPUT_DIR = "src/data"


# ═══════════════════════════════════════════════════════════
#  省份 URL 配置
# ═══════════════════════════════════════════════════════════
# TODO: 每个省份的实际数据页面 URL 需要根据官网结构调整
PROVINCE_CONFIG = {
    "北京": {
        "name": "北京市文物局",
        "base_url": "http://wwj.beijing.gov.cn",
        "data_urls": [
            # TODO: 确认实际数据发布页面 URL
            # 通常路径: /bwwbzs/bwwb/  或  /zwgk/sjfb/
            "http://wwj.beijing.gov.cn/bwwbzs/bwwb/",
        ],
        "parse_strategy": "html_table",  # 调整策略: html_table | list_page | pdf_links
        "notes": "数据以列表页形式展示，每项含保护单位名称、级别、批次。需翻页抓取。",
    },
    "陕西": {
        "name": "陕西省文物局",
        "base_url": "http://wwj.shaanxi.gov.cn",
        "data_urls": [
            # TODO: 确认实际路径
            "http://wwj.shaanxi.gov.cn/sjfb/",
        ],
        "parse_strategy": "html_table",
        "notes": "省级以上文保单位名录通常在「数据发布」或「政务公开」栏目下。",
    },
    "河南": {
        "name": "河南省文物局",
        "base_url": "https://wwj.henan.gov.cn",
        "data_urls": [
            # TODO: 河南省文物局已并入省文旅厅体系，需确认独立页面
            "https://wwj.henan.gov.cn/zwgk/sjfb/",
        ],
        "parse_strategy": "html_table",
        "notes": "河南是文物大省，全国重点文保单位数量第一。数据可能以 PDF/Excel 附件形式发布。",
    },
    "江苏": {
        "name": "江苏省文物局",
        "base_url": "http://wwj.jiangsu.gov.cn",
        "data_urls": [
            # TODO: 确认路径
            "http://wwj.jiangsu.gov.cn/col/colXXXXX/index.html",
        ],
        "parse_strategy": "html_table",
        "notes": "可能在「信息公开」→「数据发布」栏目下。",
    },
    "四川": {
        "name": "四川省文物局",
        "base_url": "http://wwj.sc.gov.cn",
        "data_urls": [
            # TODO: 确认路径
            "http://wwj.sc.gov.cn/scwwj/zdwwbhdw/",
        ],
        "parse_strategy": "html_table",
        "notes": "数据页面可能是单独的文保单位名录页面。",
    },
}


# ═══════════════════════════════════════════════════════════
#  通用工具函数
# ═══════════════════════════════════════════════════════════

def get_project_root() -> Path:
    """获取项目根目录。"""
    return Path(__file__).resolve().parent.parent


def fetch_page(url: str) -> Optional[str]:
    """
    获取页面 HTML，带简单重试。
    """
    for attempt in range(3):
        try:
            resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            # 尝试自动检测编码
            resp.encoding = resp.apparent_encoding or "utf-8"
            return resp.text
        except requests.RequestException as e:
            print(f"[WARN] 请求失败 (attempt {attempt+1}/3): {e}", file=sys.stderr)
            time.sleep(2 ** attempt)
    return None


def parse_html_table_to_json(html: str, name_col: int = 0, level_col: int = 1,
                              batch_col: int = 2, location_col: int = 3,
                              skip_header: bool = True) -> list[dict]:
    """
    通用 HTML <table> → JSON 解析函数。

    提取所有 <tr> 行，按列索引提取字段，生成项目格式的 dict 列表。

    参数:
        html: HTML 字符串
        name_col: 名称所在列索引（0-based）
        level_col: 保护级别列索引（如 国家级/省级）
        batch_col: 批次列索引
        location_col: 所在地列索引
        skip_header: 是否跳过第一行（表头）

    返回:
        [{ "名称": ..., "保护级别": ..., "批次": ..., "所在地": ... }, ...]

    TODO: 根据各省实际 HTML 结构调整列映射逻辑。
    """
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")

    if not tables:
        print("[WARN] 页面中未找到 <table> 元素", file=sys.stderr)
        return []

    results = []
    for table in tables:
        rows = table.find_all("tr")
        for i, row in enumerate(rows):
            if skip_header and i == 0:
                continue

            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue

            def get_text(idx: int) -> str:
                if idx < len(cells):
                    return cells[idx].get_text(strip=True)
                return ""

            name = get_text(name_col)
            if not name:
                continue

            results.append({
                "名称": name,
                "保护级别": get_text(level_col),
                "批次": get_text(batch_col),
                "所在地": get_text(location_col),
            })

    print(f"[parse_html_table] 共提取 {len(results)} 条记录（{len(tables)} 个表格）")
    return results


def parse_list_page_items(html: str) -> list[dict]:
    """
    解析列表页（非标准表格），常见于 <ul>/<div> + <a> 模式。

    提取所有链接文本作为名称，链接 URL 作为详情页地址。

    TODO: 根据各省实际 DOM 结构实现具体选择器。
    """
    soup = BeautifulSoup(html, "html.parser")
    results = []

    # 示例：尝试从常见列表中提取
    # TODO: 适配各省实际 class/id 选择器
    for link in soup.find_all("a", href=True):
        text = link.get_text(strip=True)
        href = link["href"]
        if not text or len(text) < 2:
            continue
        # 过滤明显的导航链接
        if text in ("首页", "上一页", "下一页", "返回", "更多"):
            continue
        results.append({
            "名称": text,
            "详情链接": href,
        })

    return results


# ═══════════════════════════════════════════════════════════
#  省份爬虫骨架函数
# ═══════════════════════════════════════════════════════════

def crawl_heritage_sites(province_key: str, dry_run: bool = False) -> list[dict]:
    """
    爬取指定省份的文物保护单位数据。

    当前为骨架实现 — 获取页面 HTML 后调用通用表格解析。
    TODO: 根据各省实际情况，替换为定制化的解析逻辑（XPath / CSS 选择器等）。

    返回 heritage.json 格式的 dict 列表。
    """
    config = PROVINCE_CONFIG.get(province_key)
    if not config:
        print(f"[ERROR] 未知省份: {province_key}", file=sys.stderr)
        return []

    print(f"\n[crawl] 省份: {province_key} ({config['name']})")
    print(f"[crawl] 策略: {config['parse_strategy']}  |  备注: {config['notes']}")

    all_items = []

    for url in config["data_urls"]:
        if dry_run:
            print(f"[dry-run] 将请求: {url}")
            continue

        print(f"[crawl] 请求: {url}")
        html = fetch_page(url)
        if not html:
            print(f"[WARN] 无法获取页面: {url}", file=sys.stderr)
            continue

        strategy = config["parse_strategy"]

        if strategy == "html_table":
            # TODO: 根据各省表格结构调整 name_col/level_col 等参数
            raw_items = parse_html_table_to_json(html)
            for item in raw_items:
                # 转换为 heritage.json 格式
                all_items.append({
                    "名称": item.get("名称", ""),
                    "网址": url,
                    "描述": f"{item.get('保护级别', '')}文物保护单位，批次{item.get('批次', '')}，位于{item.get('所在地', '')}。",
                    "来源": f"{config['name']}",
                    "分类": "文物保护单位",
                    "地区": f"国内-{province_key}",
                    "平台类型": "网站",
                })
        elif strategy == "list_page":
            raw_items = parse_list_page_items(html)
            for item in raw_items:
                all_items.append({
                    "名称": item.get("名称", ""),
                    "网址": item.get("详情链接", url),
                    "描述": "",
                    "来源": f"{config['name']}",
                    "分类": "文物保护单位",
                    "地区": f"国内-{province_key}",
                    "平台类型": "网站",
                })
        else:
            print(f"[WARN] 未知解析策略: {strategy}", file=sys.stderr)

    print(f"[crawl] {province_key} 共采集 {len(all_items)} 条")
    return all_items


# ═══════════════════════════════════════════════════════════
#  主入口
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="各省文物局遗产数据采集（框架版本，需按省适配）",
    )
    parser.add_argument(
        "--province",
        type=str,
        default="all",
        help="目标省份: 北京/陕西/河南/江苏/四川 或 all（默认）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只打印请求 URL，不实际爬取",
    )
    args = parser.parse_args()

    root = get_project_root()
    output_dir = root / OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.province == "all":
        targets = list(PROVINCE_CONFIG.keys())
    else:
        if args.province not in PROVINCE_CONFIG:
            print(f"[ERROR] 未知省份 '{args.province}'，可选: {list(PROVINCE_CONFIG.keys())}",
                  file=sys.stderr)
            sys.exit(1)
        targets = [args.province]

    for province_key in targets:
        items = crawl_heritage_sites(province_key, dry_run=args.dry_run)

        if args.dry_run:
            continue

        if items:
            out_path = output_dir / f"provincial_{province_key}_heritage.json"
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
            print(f"[save] 已保存 {len(items)} 条 → {out_path}")
        else:
            print(f"[WARN] {province_key}: 无数据可保存")

    print("\n[crawl_provincial_heritage] 完成。")


if __name__ == "__main__":
    main()
