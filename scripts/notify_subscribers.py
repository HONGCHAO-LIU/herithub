#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
notify_subscribers.py —— 订阅匹配通知脚本

功能：
1. 读取 subscriptions.json，获取所有活跃订阅；
2. 读取最新的 business_intelligence.json / academic_conferences.json / academic_papers.json；
3. 对每条新数据（以 crawledAt 为时间标识）按关键词匹配订阅者；
4. 生成通知报告 notification_queue.json（待发送的通知列表）；
5. 输出匹配统计到控制台。
"""

import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional

# --- 路径配置 ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'src', 'data')
OUTPUT_DIR = DATA_DIR

SUBSCRIPTIONS_FILE = os.path.join(DATA_DIR, 'subscriptions.json')
BUSINESS_FILE = os.path.join(DATA_DIR, 'business_intelligence.json')
CONFERENCES_FILE = os.path.join(DATA_DIR, 'academic_conferences.json')
PAPERS_FILE = os.path.join(DATA_DIR, 'academic_papers.json')
QUEUE_FILE = os.path.join(DATA_DIR, 'notification_queue.json')


def load_json(filepath: str, default: Any = None) -> Any:
    """安全加载 JSON 文件"""
    if not os.path.exists(filepath):
        print(f"[WARN] 文件不存在: {filepath}")
        return default if default is not None else []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as exc:
        print(f"[ERROR] 读取 {filepath} 失败: {exc}")
        return default if default is not None else []


def parse_keywords(keywords_str: str) -> List[str]:
    """解析逗号分隔的关键词，去空格并去重"""
    if not keywords_str:
        return []
    parts = [kw.strip() for kw in keywords_str.split(',')]
    return [p for p in parts if p]


def match_keywords(item_text: str, subscriber_keywords: List[str]) -> List[str]:
    """
    检查条目文本是否匹配订阅关键词。
    返回匹配到的关键词列表。
    """
    if not item_text or not subscriber_keywords:
        return []
    matched = []
    for kw in subscriber_keywords:
        if kw and kw in item_text:
            matched.append(kw)
    return matched


def extract_item_repr(item: Dict, data_type: str) -> Optional[Dict[str, str]]:
    """
    从条目中提取用于匹配和通知的文本表示。
    返回 {'title': str, 'link': str, 'text': str} 或 None。
    """
    title = ''
    link = ''
    text_parts = []

    if data_type == 'business':
        title = item.get('title', '')
        link = item.get('sourceUrl', '')
        text_parts.extend([
            item.get('title', ''),
            item.get('description', ''),
            item.get('category', ''),
            item.get('type', ''),
            item.get('source', ''),
        ] + item.get('tags', []))
    elif data_type == 'conference':
        title = item.get('name', '')
        link = item.get('sourceUrl', '') or item.get('website', '')
        text_parts.extend([
            item.get('name', ''),
            item.get('description', ''),
            item.get('organizer', ''),
            item.get('location', ''),
        ] + item.get('tags', []))
    elif data_type == 'paper':
        title = item.get('title', '')
        link = item.get('sourceUrl', '') or item.get('doi', '')
        if link and not link.startswith('http') and link.startswith('10.'):
            link = f'https://doi.org/{link}'
        text_parts.extend([
            item.get('title', ''),
            item.get('abstract', ''),
            item.get('authors', ''),
            item.get('journal', ''),
        ] + item.get('keywords', []))
    else:
        return None

    if not title:
        return None
    return {
        'title': title,
        'link': link or '',
        'text': ' '.join(t for t in text_parts if isinstance(t, str)),
    }


def main():
    print("=" * 60)
    print("订阅匹配通知脚本")
    print(f"运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # --- 加载订阅 ---
    subscriptions: List[Dict] = load_json(SUBSCRIPTIONS_FILE, [])
    active_subs = [s for s in subscriptions if s.get('active', True)]

    if not active_subs:
        print("[INFO] 暂无活跃订阅，退出。")
        return

    print(f"[INFO] 活跃订阅数: {len(active_subs)}")

    # --- 加载数据 ---
    business_data: List[Dict] = load_json(BUSINESS_FILE, [])
    conference_data: List[Dict] = load_json(CONFERENCES_FILE, [])
    paper_data: List[Dict] = load_json(PAPERS_FILE, [])

    print(f"[INFO] 商业情报条目: {len(business_data)}")
    print(f"[INFO] 学术会议条目: {len(conference_data)}")
    print(f"[INFO] 论文成果条目: {len(paper_data)}")

    # --- 构建条目列表 ---
    all_items: List[Dict] = []

    for item in business_data:
        rep = extract_item_repr(item, 'business')
        if rep:
            all_items.append({
                'type': 'business',
                'id': item.get('id'),
                'title': rep['title'],
                'link': rep['link'],
                'text': rep['text'],
            })

    for item in conference_data:
        rep = extract_item_repr(item, 'conference')
        if rep:
            all_items.append({
                'type': 'conference',
                'id': item.get('id'),
                'title': rep['title'],
                'link': rep['link'],
                'text': rep['text'],
            })

    for item in paper_data:
        rep = extract_item_repr(item, 'paper')
        if rep:
            all_items.append({
                'type': 'paper',
                'id': item.get('id'),
                'title': rep['title'],
                'link': rep['link'],
                'text': rep['text'],
            })

    print(f"[INFO] 可匹配条目总数: {len(all_items)}")

    # --- 匹配 ---
    notifications: List[Dict] = []
    match_stats: Dict[str, int] = {}

    for sub in active_subs:
        sub_email = sub.get('email', '')
        sub_keywords_str = sub.get('keywords', '')
        sub_categories = sub.get('categories', ['business', 'conference', 'paper'])
        sub_keywords = parse_keywords(sub_keywords_str)

        if not sub_keywords:
            continue

        sub_total = 0

        for item in all_items:
            # 类别过滤
            if item['type'] not in sub_categories:
                continue

            # 关键词匹配
            matched_kws = match_keywords(item['text'], sub_keywords)
            if not matched_kws:
                continue

            notifications.append({
                'email': sub_email,
                'matched_keywords': matched_kws,
                'item_title': item['title'],
                'item_link': item['link'],
                'item_type': item['type'],
                'generated_at': datetime.now().isoformat(),
                'sent': False,
            })
            sub_total += 1

        match_stats[sub_email] = sub_total

    # --- 输出通知队列 ---
    os.makedirs(os.path.dirname(QUEUE_FILE), exist_ok=True)
    with open(QUEUE_FILE, 'w', encoding='utf-8') as f:
        json.dump(notifications, f, ensure_ascii=False, indent=2)

    print(f"\n[RESULT] 通知队列已生成: {QUEUE_FILE}")
    print(f"[RESULT] 待发送通知数: {len(notifications)}")

    # --- 匹配统计 ---
    print("\n--- 匹配统计 ---")
    for email, count in match_stats.items():
        print(f"  {email}: {count} 条匹配")

    # 按类型统计
    type_counts: Dict[str, int] = {}
    for n in notifications:
        t = n['item_type']
        type_counts[t] = type_counts.get(t, 0) + 1
    print("\n--- 按类型统计 ---")
    for t, c in type_counts.items():
        print(f"  {t}: {c} 条")

    print("\n[DONE] 订阅匹配完成。")


if __name__ == '__main__':
    main()
