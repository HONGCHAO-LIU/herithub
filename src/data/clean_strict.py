import json
import re

with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def is_placeholder(item):
    name = item.get('名称', '')
    desc = item.get('描述', '')
    
    # 名称和描述完全相同
    if name == desc:
        return True
    
    # 博物馆11-100
    if re.match(r'^博物馆([1-9]\d{1,})$', name) and int(name[3:]) >= 11:
        return True
    
    # 世界遗产16-100
    if re.match(r'^世界遗产([1-9]\d{1,})$', name) and int(name[4:]) >= 16:
        return True
    
    # 中国机构7-100
    if re.match(r'^中国机构([1-9]\d{1,})$', name) and int(name[3:]) >= 7:
        return True
    
    # 微信公众号 - 名称类似 "文博公众号10" 格式
    if '公众号' in name and name == desc:
        return True
    
    # 检查描述是否是 "文博类公众号X" 格式（名称类似）
    if '公众号' in name and '文博类公众号' in desc:
        return True
    
    # 检查是否是 "XX机构X" 格式的占位符
    if re.match(r'.机构\d+', name) and name == desc:
        return True
        
    return False

# 过滤
cleaned = [item for item in data if not is_placeholder(item)]

print(f'清理后: {len(cleaned)}条')

# 统计
from collections import Counter
cats = Counter([item['分类'] for item in cleaned])
print('\n分类统计:')
for cat, cnt in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {cnt}')

# 保存
with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned, f, ensure_ascii=False, indent=2)

print('\n已保存!')
