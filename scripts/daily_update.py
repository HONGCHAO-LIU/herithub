#!/usr/bin/env python3
"""
每日自动更新脚本 (daily_update.py)
1. 运行爬虫采集新数据
2. 合并到正式数据文件（补充 publishDate）
3. 生成 last-update.json
4. Git 提交并推送
5. Vercel 生产部署
"""

import json
import hashlib
import subprocess
import sys
import os
from datetime import datetime
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / 'src' / 'data'
VERCEL_TOKEN = os.environ.get('VERCEL_TOKEN', '')
if not VERCEL_TOKEN:
    # 从本地非版本控制文件读取
    token_file = PROJECT_DIR / '.vercel' / '.token'
    if token_file.exists():
        VERCEL_TOKEN = token_file.read_text().strip()
if not VERCEL_TOKEN:
    print("[FATAL] 未找到 Vercel Token，请设置 VERCEL_TOKEN 环境变量或写入 .vercel/.token")
    sys.exit(1)
os.environ['VERCEL_TOKEN'] = VERCEL_TOKEN

def run_cmd(cmd, cwd=None):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd or PROJECT_DIR)
    if result.returncode != 0:
        print(f"[ERROR] {cmd[:60]}... 返回码: {result.returncode}")
    else:
        print(f"[OK] {cmd[:60]}...")
    return result

def step1_crawl():
    """运行爬虫采集新数据"""
    print("=" * 50)
    print("Step 1: 运行爬虫...")
    for script in ['crawl_business.py', 'crawl_conferences.py', 'crawl_papers.py']:
        result = run_cmd(f'python scripts/{script}', cwd=PROJECT_DIR)
        if result.returncode != 0:
            print(f"[WARN] 爬虫 {script} 失败，继续合并现有数据")
    return True

def step2_merge():
    """合并新数据到正式数据文件"""
    print("=" * 50)
    print("Step 2: 合并数据...")

    raw_path = DATA_DIR / 'raw_business.json'
    if not raw_path.exists():
        print("[INFO] 无 raw_business.json，跳过合并")
        return True

    with open(raw_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    raw_items = raw.get('items', [])
    print(f"  原始采集: {len(raw_items)} 条")

    if not raw_items:
        print("[INFO] 无新数据，跳过合并")
        return True

    business_path = DATA_DIR / 'business_intelligence.json'
    with open(business_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    def make_key(item):
        return hashlib.md5(item.get('title', '').strip().encode('utf-8')).hexdigest()

    existing_keys = {make_key(i) for i in existing}
    new_added = 0
    next_id = max([i.get('id', 0) for i in existing if isinstance(i.get('id', 0), int)]) + 1

    for item in raw_items:
        if make_key(item) in existing_keys:
            continue
        new_item = {
            "id": next_id,
            "title": item.get('title', ''),
            "category": item.get('sector', item.get('category', '专业服务')),
            "type": item.get('type', '招标公告'),
            "date": item.get('date', ''),
            "source": item.get('source', ''),
            "sourceUrl": item.get('url', item.get('source_url', '')),
            "description": item.get('description', ''),
            "crawledAt": item.get('crawled_at', ''),
            "tags": item.get('tags', []),
            "amount": item.get('amount', item.get('budget', '')),
            "region": item.get('region', ''),
            "agency": item.get('agency', ''),
        }
        # 补充 publishDate
        crawled = new_item.get('crawledAt', '')
        if crawled:
            new_item['publishDate'] = crawled[:10]
        else:
            new_item['publishDate'] = datetime.now().strftime('%Y-%m-%d')
        existing.append(new_item)
        existing_keys.add(make_key(item))
        new_added += 1
        next_id += 1

    print(f"  新加入: {new_added} 条")

    existing.sort(key=lambda x: x.get('crawledAt', x.get('date', '')), reverse=True)
    with open(business_path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    print(f"  合并后总数: {len(existing)} 条")

    # 合并学术会议
    merge_simple(DATA_DIR / 'raw_conferences.json', DATA_DIR / 'academic_conferences.json', 'conferences')
    # 合并学术论文
    merge_simple(DATA_DIR / 'raw_papers.json', DATA_DIR / 'academic_papers.json', 'papers')
    return True


def merge_simple(raw_path: Path, target_path: Path, label: str):
    """通用合并：raw JSON → target JSON，按 title 去重"""
    if not raw_path.exists():
        print(f"  [{label}] 无 raw 文件，跳过")
        return
    with open(raw_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    raw_items = raw.get('items', raw if isinstance(raw, list) else [])
    print(f"  [{label}] 原始采集: {len(raw_items)} 条")

    if not raw_items:
        print(f"  [{label}] 无新数据，跳过")
        return

    existing = []
    if target_path.exists():
        with open(target_path, 'r', encoding='utf-8') as f:
            existing = json.load(f)
        if isinstance(existing, dict):
            existing = existing.get('items', [])

    def make_key(item):
        return hashlib.md5(item.get('title', item.get('name', '')).strip().encode('utf-8')).hexdigest()

    existing_keys = {make_key(i) for i in existing}
    new_added = 0
    for item in raw_items:
        if make_key(item) in existing_keys:
            continue
        item['crawledAt'] = item.get('crawled_at', item.get('crawledAt', ''))
        item.setdefault('tags', [])
        item.setdefault('keywords', [])
        existing.append(item)
        existing_keys.add(make_key(item))
        new_added += 1
    print(f"  [{label}] 新加入: {new_added} 条, 合并后: {len(existing)} 条")
    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)


def step3_timestamp():
    """生成 last-update.json"""
    print("=" * 50)
    print("Step 3: 更新时间戳...")
    return run_cmd('node scripts/generate_last_update.cjs', cwd=PROJECT_DIR)

def step4_git():
    """Git 提交并推送"""
    print("=" * 50)
    print("Step 4: Git 提交推送...")
    status = subprocess.run('git status --short', shell=True, capture_output=True, text=True, cwd=PROJECT_DIR)
    if not status.stdout.strip():
        print("[INFO] 无变更，跳过提交")
        return True

    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
    run_cmd(f'git add src/data/ scripts/logs/ public/last-update.json', cwd=PROJECT_DIR)
    run_cmd(f'git commit -m "data: 每日自动更新 {timestamp}"', cwd=PROJECT_DIR)
    result = run_cmd('git push origin master', cwd=PROJECT_DIR)
    return result.returncode == 0

def step5_deploy():
    """Vercel 生产部署"""
    print("=" * 50)
    print("Step 5: Vercel 部署...")
    result = run_cmd('vercel --prod --yes', cwd=PROJECT_DIR)
    return result.returncode == 0

def main():
    print(f"每日自动更新 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    steps = [
        ('爬虫采集', step1_crawl),
        ('数据合并', step2_merge),
        ('时间戳更新', step3_timestamp),
        ('Git 提交', step4_git),
        ('Vercel 部署', step5_deploy),
    ]
    for name, func in steps:
        try:
            ok = func()
            status = '✓' if ok else '✗'
            print(f"[{status}] {name}")
        except Exception as e:
            print(f"[✗] {name}: {e}")
    print("完成.")

if __name__ == '__main__':
    main()
