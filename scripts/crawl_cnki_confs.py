#!/usr/bin/env python3
"""
会议采集脚本 - CNKI & allconfs 扩展
覆盖中国知网会议征稿 (au.cnki.net) 和学术会议云 (allconfs.org)
输出: src/data/raw_conferences_ext.json
"""
import requests
from bs4 import BeautifulSoup
import json
import re
import hashlib
from datetime import datetime, timedelta
import os
import sys
import time
import logging
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
LOGS_DIR = SCRIPT_DIR / "logs"
OUTPUT_FILE = DATA_DIR / "raw_conferences_ext.json"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

LOG_FILE = LOGS_DIR / f"crawl_cnki_confs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
}

def hash_id(text):
    return hashlib.md5(text.encode()).hexdigest()[:12]

def clean_text(s):
    return re.sub(r'\s+', ' ', s.strip()) if s else ""

def parse_date(text):
    patterns = [
        r'(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})',
        r'(\d{4})(\d{2})(\d{2})',
        r'(\d{4})[-/](\d{1,2})',
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            try:
                y = int(m.group(1))
                mo = int(m.group(2))
                d = int(m.group(3)) if m.lastindex >= 3 else 1
                if 2020 <= y <= 2030 and 1 <= mo <= 12 and 1 <= d <= 31:
                    return datetime(y, mo, d)
            except ValueError:
                pass
    return None

KEYWORDS = ["遗产", "文物", "考古", "博物馆", "历史", "文化", "艺术", "非遗", "古迹",
            "heritage", "museum", "archaeology", "culture", "conservation"]

# ========== 信源 1: CNKI 会议征稿 ==========
def crawl_cnki_cfp():
    results = []
    logger.info("--- 开始采集: 中国知网会议征稿 ---")
    url = "https://au.cnki.net/author/server/CFP"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code == 200:
            try:
                data = resp.json()
                confs = data if isinstance(data, list) else data.get("data", [])
                for conf in confs:
                    title = clean_text(conf.get("conferenceName", ""))
                    if not title:
                        continue
                    text = title + str(conf.get("keywords", ""))
                    if not any(kw in text.lower() for kw in KEYWORDS):
                        continue
                    date_text = clean_text(conf.get("conferenceDate", ""))
                    conf_date = parse_date(date_text)
                    deadline_text = clean_text(conf.get("deadline", ""))
                    
                    results.append({
                        "id": f"cnki-{hash_id(title)}",
                        "name": title,
                        "date": date_text or "待定",
                        "location": clean_text(conf.get("location", "")),
                        "submission_deadline": deadline_text,
                        "url": clean_text(conf.get("website", "")),
                        "organizer": clean_text(conf.get("organizer", "")),
                        "tags": conf.get("keywords", ""),
                        "source": "中国知网",
                        "crawled_at": datetime.now().isoformat(),
                        "_sort_date": conf_date.isoformat() if conf_date else "9999",
                    })
            except (json.JSONDecodeError, KeyError):
                pass
        
        if not results:
            # JSON 解析失败，回退 HTML 爬取
            resp2 = requests.get(url, headers=HEADERS, timeout=15)
            resp2.encoding = 'utf-8'
            soup = BeautifulSoup(resp2.text, 'html.parser')
            for item_div in soup.select(".cfp-item, .conference-item, tr"):
                a = item_div.find("a")
                if not a:
                    continue
                title = clean_text(a.get_text())
                if len(title) < 8:
                    continue
                if not any(kw in title for kw in KEYWORDS):
                    continue
                href = a.get("href", "")
                results.append({
                    "id": f"cnki-html-{hash_id(title)}",
                    "name": title,
                    "date": "待定",
                    "location": "",
                    "submission_deadline": "",
                    "url": href if href.startswith("http") else f"https://au.cnki.net{href}",
                    "organizer": "",
                    "source": "中国知网",
                    "crawled_at": datetime.now().isoformat(),
                    "_sort_date": "9999",
                })
    except Exception as e:
        logger.error(f"  CNKI CFP 异常: {e}")
    
    logger.info(f"  CNKI CFP: {len(results)} 条")
    return results

# ========== 信源 2: allconfs.org ==========
def crawl_allconfs():
    results = []
    logger.info("--- 开始采集: 学术会议云 ---")
    kw_list = ["heritage", "cultural+heritage", "archaeology", "museum", "history"]
    seen = set()
    
    for kw in kw_list:
        url = f"https://www.allconfs.org/meeting_list.asp?kw={kw}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            encoding = 'gb2312' if 'gb' in (resp.apparent_encoding or '').lower() else 'utf-8'
            resp.encoding = encoding
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # allconfs.org 使用 HTML 表格展示
            started = False
            for row in soup.select("table tr, .meeting-item"):
                cells = row.find_all("td")
                if len(cells) < 3:
                    continue
                a = row.find("a")
                if not a:
                    continue
                title = clean_text(a.get_text())
                if len(title) < 10 or title in seen:
                    continue
                seen.add(title)
                
                # 判断是否进入了有效的列表区域（跳过表头）
                if not started:
                    start_keywords = ["Meeting", "Name", "Date", "Location", "会议", "日期", "地点"]
                    if any(sk in title for sk in start_keywords):
                        started = True
                        continue
                    if not any(cell.get_text(strip=True) for cell in cells if len(cell.get_text(strip=True)) > 3):
                        continue
                    started = True
                
                date_text = clean_text(cells[1].get_text() if len(cells) > 1 else "")
                location = clean_text(cells[2].get_text() if len(cells) > 2 else "")
                conf_date = parse_date(date_text)
                
                href = a.get("href", "")
                if href and not href.startswith("http"):
                    href = f"https://www.allconfs.org/{href}"
                
                results.append({
                    "id": f"ac-{hash_id(title)}",
                    "name": title,
                    "date": date_text or "待定",
                    "location": location,
                    "submission_deadline": "",
                    "url": href,
                    "organizer": "",
                    "source": "学术会议云",
                    "crawled_at": datetime.now().isoformat(),
                    "_sort_date": conf_date.isoformat() if conf_date else "9999",
                })
                if len(results) >= 40:
                    break
            if len(results) >= 40:
                break
        except Exception as e:
            logger.error(f"  AllConfs {kw} 异常: {e}")
        time.sleep(1)
    
    logger.info(f"  AllConfs: {len(results)} 条")
    return results

# ========== 主流程 ==========
def main():
    logger.info("=" * 60)
    logger.info(f"CNKI & AllConfs 会议采集 — {datetime.now().isoformat()}")
    logger.info("=" * 60)
    
    all_results = []
    
    try:
        all_results.extend(crawl_cnki_cfp())
    except Exception as e:
        logger.error(f"CNKI 采集失败: {e}")
    
    try:
        all_results.extend(crawl_allconfs())
    except Exception as e:
        logger.error(f"AllConfs 采集失败: {e}")
    
    # 去重
    seen = set()
    unique = []
    for item in all_results:
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)
    
    # 排序
    unique.sort(key=lambda x: x.pop("_sort_date", "9999"))
    
    # 统计
    source_count = {}
    for r in unique:
        s = r["source"]
        source_count[s] = source_count.get(s, 0) + 1
    
    output = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_items": len(unique),
            "sources": source_count,
        },
        "items": unique,
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    logger.info(f"输出: {OUTPUT_FILE} ({len(unique)} 条)")
    print(f"\n{'='*60}")
    print(f"  CNKI & AllConfs 会议采集摘要")
    print(f"  总计: {len(unique)} 条")
    for src, cnt in source_count.items():
        print(f"    {src}: {cnt} 条")
    print(f"{'='*60}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
