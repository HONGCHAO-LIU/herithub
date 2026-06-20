#!/usr/bin/env python3
"""
论文采集脚本 - CNKI RSS & arXiv 扩展
信源：
1. 中国知网期刊 RSS (rss.cnki.net) — 考古/文博/文化遗产相关期刊
2. arXiv 中科院镜像 (arxivsi.las.ac.cn) — cs.DL / physics 分类
3. 保留原有定向爬虫输出兼容
输出: src/data/raw_papers_ext.json
"""
import requests
from bs4 import BeautifulSoup
import feedparser
import json
import re
import hashlib
from datetime import datetime, timedelta
import os
import sys
import time
import logging
import socket
from pathlib import Path

# 全局网络超时，防止 GitHub Actions runner 上长时间挂起
socket.setdefaulttimeout(30)

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
LOGS_DIR = SCRIPT_DIR / "logs"
OUTPUT_FILE = DATA_DIR / "raw_papers_ext.json"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

LOG_FILE = LOGS_DIR / f"crawl_papers_ext_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def hash_id(text):
    return hashlib.md5(text.encode()).hexdigest()[:12]

def clean_text(s):
    return re.sub(r'\s+', ' ', s.strip()) if s else ""

def extract_year(text):
    m = re.search(r'(20\d{2})', text)
    return int(m.group(1)) if m else None

# ========== 信源 1: 知网期刊 RSS ==========
CNKI_RSS_FEEDS = [
    # 考古/文博核心期刊
    ("考古", "http://rss.cnki.net/kns/rss.aspx?Journal=KAGU&Virtual=knavi"),
    ("文物", "http://rss.cnki.net/kns/rss.aspx?Journal=WENW&Virtual=knavi"),
    ("考古学报", "http://rss.cnki.net/kns/rss.aspx?Journal=KGXB&Virtual=knavi"),
    ("文物保护与考古科学", "http://rss.cnki.net/kns/rss.aspx?Journal=WWBF&Virtual=knavi"),
    ("中国文化遗产", "http://rss.cnki.net/kns/rss.aspx?Journal=ZGYC&Virtual=knavi"),
    ("博物馆管理", "http://rss.cnki.net/kns/rss.aspx?Journal=BOWG&Virtual=knavi"),
    ("中国博物馆", "http://rss.cnki.net/kns/rss.aspx?Journal=GBWG&Virtual=knavi"),
    ("东南文化", "http://rss.cnki.net/kns/rss.aspx?Journal=DNWH&Virtual=knavi"),
    ("敦煌研究", "http://rss.cnki.net/kns/rss.aspx?Journal=DHYJ&Virtual=knavi"),
    ("故宫博物院院刊", "http://rss.cnki.net/kns/rss.aspx?Journal=GGBW&Virtual=knavi"),
    ("考古与文物", "http://rss.cnki.net/kns/rss.aspx?Journal=KGYW&Virtual=knavi"),
    ("文博", "http://rss.cnki.net/kns/rss.aspx?Journal=WEBO&Virtual=knavi"),
    ("华夏考古", "http://rss.cnki.net/kns/rss.aspx?Journal=HXKG&Virtual=knavi"),
    ("故宫学刊", "http://rss.cnki.net/kns/rss.aspx?Journal=GONG&Virtual=knavi"),
    ("自然与文化遗产研究", "http://rss.cnki.net/kns/rss.aspx?Journal=ZRYW&Virtual=knavi"),
]

def crawl_cnki_rss():
    results = []
    logger.info("--- 开始采集: 知网期刊 RSS ---")
    
    for journal_name, feed_url in CNKI_RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            if not feed.entries:
                logger.info(f"  {journal_name}: 0 条")
                continue
            
            for entry in feed.entries[:10]:
                title = clean_text(entry.get("title", ""))
                if len(title) < 6:
                    continue
                
                link = entry.get("link", "")
                summary = clean_text(entry.get("summary", ""))[:500]
                published = entry.get("published", "")
                year = extract_year(published)
                
                authors = []
                if hasattr(entry, "author_detail") and entry.author_detail:
                    authors.append(entry.author_detail.get("name", ""))
                elif hasattr(entry, "author"):
                    authors.append(entry.author)
                
                results.append({
                    "id": f"cnki-p-{hash_id(title+journal_name)}",
                    "title": title,
                    "authors": authors,
                    "journal": journal_name,
                    "abstract": summary,
                    "doi": entry.get("id", ""),
                    "publishDate": published,
                    "url": link,
                    "keywords": [],
                    "source": "中国知网",
                    "year": year,
                    "crawledAt": datetime.now().isoformat(),
                })
            
            logger.info(f"  {journal_name}: {min(len(feed.entries), 10)} 条")
        except Exception as e:
            logger.warning(f"  {journal_name}: {e}")
        time.sleep(0.5)
    
    logger.info(f"  CNKI RSS 总计: {len(results)} 条")
    return results

# ========== 信源 2: arXiv 官方 RSS（中科院镜像已不可用）==========
ARXIV_FEEDS = [
    ("cs.DL", "https://rss.arxiv.org/rss/cs.DL"),           # 数字图书馆
    ("cs.CY", "https://rss.arxiv.org/rss/cs.CY"),           # 计算与社会
    ("physics.soc-ph", "https://rss.arxiv.org/rss/physics.soc-ph"),  # 物理与社会
]

HERITAGE_KEYWORDS = [
    "heritage", "museum", "archaeology", "cultural", "conservation",
    "digitization", "digital humanities", "3d reconstruction",
    "cultural relic", "preservation", "restoration", "historic",
    "intangible cultural", "world heritage", "unesco",
    "遗产", "文物", "考古", "博物馆", "数字化保护", "文化遗产",
]

def crawl_arxiv_rss():
    results = []
    logger.info("--- 开始采集: arXiv (中科院镜像) ---")
    
    for category, feed_url in ARXIV_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            if not feed.entries:
                logger.info(f"  {category}: 0 条")
                continue
            
            for entry in feed.entries:
                title = clean_text(entry.get("title", ""))
                summary = clean_text(entry.get("summary", ""))[:500]
                text = (title + " " + summary).lower()
                
                if not any(kw in text for kw in HERITAGE_KEYWORDS):
                    continue
                
                link = entry.get("link", "")
                arxiv_id = entry.get("id", "").split("/abs/")[-1] if "/abs/" in entry.get("id", "") else ""
                published = entry.get("published", "")
                year = extract_year(published)
                
                authors = []
                if hasattr(entry, "authors"):
                    for a in entry.authors:
                        authors.append(a.get("name", ""))
                
                results.append({
                    "id": f"arxiv-{hash_id(title)}",
                    "title": title,
                    "authors": authors[:10],
                    "journal": f"arXiv {category}",
                    "abstract": summary,
                    "doi": f"https://arxiv.org/abs/{arxiv_id}",
                    "publishDate": published,
                    "url": link,
                    "keywords": [],
                    "source": "arXiv",
                    "year": year,
                    "crawledAt": datetime.now().isoformat(),
                })
            
            logger.info(f"  {category}: 匹配 {len([r for r in results if r['source']=='arXiv' and r['journal']==f'arXiv {category}'])} 条")
        except Exception as e:
            logger.warning(f"  {category}: {e}")
        time.sleep(1)
    
    logger.info(f"  arXiv 总计: {len(results)} 条")
    return results

# ========== 主流程 ==========
def main():
    logger.info("=" * 60)
    logger.info(f"论文采集扩展 — {datetime.now().isoformat()}")
    logger.info("=" * 60)
    
    all_results = []
    
    try:
        all_results.extend(crawl_cnki_rss())
    except Exception as e:
        logger.error(f"CNKI RSS 采集失败: {e}")
    
    try:
        all_results.extend(crawl_arxiv_rss())
    except Exception as e:
        logger.error(f"arXiv 采集失败: {e}")
    
    # 去重
    seen = set()
    unique = []
    for item in all_results:
        if item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)
    
    # 去重：语义相似度（简单hash去重）
    title_set = set()
    final = []
    for item in unique:
        t = item["title"].lower()[:30]
        if t not in title_set:
            title_set.add(t)
            final.append(item)
    
    source_count = {}
    for r in final:
        s = r["source"]
        source_count[s] = source_count.get(s, 0) + 1
    
    output = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "total_items": len(final),
            "sources": source_count,
        },
        "items": final,
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    logger.info(f"输出: {OUTPUT_FILE} ({len(final)} 条)")
    print(f"\n{'='*60}")
    print(f"  论文采集扩展摘要")
    print(f"  总计: {len(final)} 条")
    for src, cnt in source_count.items():
        print(f"    {src}: {cnt} 条")
    print(f"{'='*60}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
