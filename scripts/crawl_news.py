"""
文化遗产资讯聚合爬虫
信源：
1. 国家文物局 - "一周各地文物动态摘编" (ncha.gov.cn)
2. 中国社会科学网 - 考古现场传真 (cssn.cn)
3. UNESCO HIST 新闻 (unesco-hist.org)
4. 中国文物报 (zhongguowenwubao.com)
"""
import requests
from bs4 import BeautifulSoup
import json
import re
import time
from datetime import datetime, timedelta
import os
import hashlib

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

all_items = []

def hash_id(text):
    return hashlib.md5(text.encode()).hexdigest()[:12]

def clean_text(s):
    if not s:
        return ""
    return re.sub(r'\s+', ' ', s.strip())

def parse_date(text):
    """解析各种日期格式"""
    patterns = [
        r'(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})',
        r'(\d{4})(\d{2})(\d{2})',
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if 2020 <= y <= 2030 and 1 <= mo <= 12 and 1 <= d <= 31:
                return f"{y}-{mo:02d}-{d:02d}"
    return datetime.now().strftime("%Y-%m-%d")

# ========== 信源 1: 国家文物局 ==========
def crawl_ncha():
    """爬取国家文物局一周各地文物动态摘编"""
    items = []
    base = "http://www.ncha.gov.cn"
    
    # 列表页
    for page in range(1, 4):
        url = f"{base}/col/col722/index.html"
        if page > 1:
            url = f"{base}/col/col722/index_{page}.html"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            for li in soup.select("ul.list li, .list-content li, ul.news-list li"):
                a = li.find("a")
                if not a or not a.get("href"):
                    continue
                title = clean_text(a.get_text())
                if "文物动态" not in title and "文物" not in title and "考古" not in title and "遗产" not in title and "博物馆" not in title:
                    # 可能不是我们需要的
                    link_text = li.get_text(strip=True)
                    if not any(kw in link_text for kw in ["文物", "考古", "遗产", "博物馆", "申遗", "非遗"]):
                        continue
                
                href = a["href"]
                if not href.startswith("http"):
                    href = base + href
                
                # 提取日期
                date_text = li.get_text()
                date = parse_date(date_text)
                
                item = {
                    "id": f"ncha-{hash_id(title+href)}",
                    "title": title,
                    "url": href,
                    "source": "国家文物局",
                    "category": "文物动态",
                    "date": date,
                    "crawledAt": datetime.now().isoformat()
                }
                
                # 获取详情页摘要
                try:
                    dr = requests.get(href, headers=HEADERS, timeout=10)
                    dr.encoding = 'utf-8'
                    ds = BeautifulSoup(dr.text, 'html.parser')
                    content_div = ds.select_one(".article-content, .TRS_Editor, .content, article")
                    if content_div:
                        item["description"] = clean_text(content_div.get_text())[:300]
                except:
                    pass
                
                items.append(item)
                if len(items) >= 30:
                    break
            if len(items) >= 30:
                break
        except Exception as e:
            print(f"  NCHA page {page} error: {e}")
        time.sleep(1)
    
    print(f"  NCHA: {len(items)} items")
    return items

# ========== 信源 2: 中国社会科学网 ==========
def crawl_cssn():
    """爬取中国社会科学网考古频道"""
    items = []
    urls = [
        "https://cssn.cn/kgxc/kgxc_xccz/",
        "https://cssn.cn/kgxc/kgxc_xccz/index_1.shtml",
        "https://cssn.cn/kgxc/kgxc_xccz/index_2.shtml",
    ]
    
    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            for item_div in soup.select(".list-item, .news-item, .xwzx_list li, ul li"):
                a = item_div.find("a")
                if not a or not a.get("href"):
                    continue
                title = clean_text(a.get_text())
                if len(title) < 6:
                    continue
                
                href = a["href"]
                if not href.startswith("http"):
                    href = "https://cssn.cn" + href
                
                date_span = item_div.select_one(".time, .date, span.fr")
                date = parse_date(date_span.get_text() if date_span else title)
                
                item = {
                    "id": f"cssn-{hash_id(title+href)}",
                    "title": title,
                    "url": href,
                    "source": "中国社会科学网",
                    "category": "考古资讯",
                    "date": date,
                    "crawledAt": datetime.now().isoformat()
                }
                items.append(item)
            if len(items) >= 20:
                break
        except Exception as e:
            print(f"  CSSN {url} error: {e}")
        time.sleep(1)
    
    print(f"  CSSN: {len(items)} items")
    return items

# ========== 信源 3: UNESCO HIST ==========
def crawl_unesco_hist():
    """UNESCO 国际自然与文化遗产空间技术中心（国内可访问）"""
    items = []
    url = "https://www.unesco-hist.org/index.php?cid=149&r=en/article/index"
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.encoding = 'utf-8'
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        for item_div in soup.select(".news-item, .article-item, .list-item"):
            a_tag = item_div.find("a")
            if not a_tag:
                continue
            title = clean_text(a_tag.get_text())
            if len(title) < 8:
                continue
            
            href = a_tag.get("href", "")
            if not href.startswith("http"):
                href = "https://www.unesco-hist.org" + href
            
            date_span = item_div.select_one(".date, .time")
            date = parse_date(date_span.get_text() if date_span else "")
            
            item = {
                "id": f"hist-{hash_id(title+href)}",
                "title": title,
                "url": href,
                "source": "UNESCO HIST",
                "category": "国际遗产动态",
                "date": date,
                "crawledAt": datetime.now().isoformat()
            }
            
            # 尝试获取摘要
            desc_div = item_div.select_one(".desc, .abstract, .summary")
            if desc_div:
                item["description"] = clean_text(desc_div.get_text())[:300]
            
            items.append(item)
    except Exception as e:
        print(f"  UNESCO HIST error: {e}")
    
    print(f"  UNESCO HIST: {len(items)} items")
    return items

# ========== 信源 4: 中国文物报 ==========
def crawl_zwb():
    """中国文物报数字版"""
    items = []
    base = "http://www.zhongguowenwubao.com"
    
    for offset in range(0, 21, 7):
        date_str = (datetime.now() - timedelta(days=offset)).strftime("%Y-%m-%d")
        url = f"{base}/DigitPager/paper/publishdate/{date_str}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            for a in soup.select(".paper-list a, .article-list a, ul li a"):
                title = clean_text(a.get_text())
                if len(title) < 8:
                    continue
                if not any(kw in title for kw in ["文物", "考古", "遗产", "博物馆", "申遗", "非遗", "遗址", "石窟", "古建"]):
                    continue
                
                href = a.get("href", "")
                if not href.startswith("http"):
                    href = base + href
                
                item = {
                    "id": f"zwb-{hash_id(title+href)}",
                    "title": title,
                    "url": href,
                    "source": "中国文物报",
                    "category": "文物新闻",
                    "date": date_str,
                    "crawledAt": datetime.now().isoformat()
                }
                items.append(item)
            if len(items) >= 15:
                break
        except Exception as e:
            print(f"  ZWB {date_str} error: {e}")
        time.sleep(1)
    
    print(f"  ZWB: {len(items)} items")
    return items

# ========== 主流程 ==========
if __name__ == "__main__":
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 开始聚合文化遗产资讯...")
    
    all_items.extend(crawl_ncha())
    all_items.extend(crawl_cssn())
    all_items.extend(crawl_unesco_hist())
    all_items.extend(crawl_zwb())
    
    # 按日期去重（保留最新）
    seen = set()
    unique = []
    for item in sorted(all_items, key=lambda x: x.get("date", ""), reverse=True):
        key = item["id"]
        if key not in seen:
            seen.add(key)
            unique.append(item)
    
    # 只保留最近 30 天的
    cutoff = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    recent = [item for item in unique if item.get("date", "") >= cutoff]
    
    # 写入
    output_path = os.path.join(OUTPUT_DIR, "raw_news.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(recent, f, ensure_ascii=False, indent=2)
    
    print(f"\n总计: {len(recent)} 条资讯写入 {output_path}")
