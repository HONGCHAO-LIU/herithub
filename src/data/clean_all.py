import json

with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f'原始数据: {len(data)}条')

# 过滤函数 - 只保留真实数据
def is_valid(item):
    name = item.get('名称', '')
    desc = item.get('描述', '')
    cat = item.get('分类', '')
    
    # 名称和描述相同的是占位符
    if name == desc:
        return False
    
    # 博物馆11+ 是占位符
    if name.startswith('博物馆') and name[3:].isdigit() and int(name[3:]) >= 11:
        return False
    
    # 世界遗产16+ 是占位符
    if name.startswith('世界遗产') and name[4:].isdigit() and int(name[4:]) >= 16:
        return False
    
    # 中国机构7+ 是占位符
    if name.startswith('中国机构') and name[3:].isdigit() and int(name[3:]) >= 7:
        return False
    
    # 微信公众号是占位符
    if '公众号' in name and name == desc:
        return False
        
    return True

# 过滤
filtered = [item for item in data if is_valid(item)]

# 去重
seen = set()
deduped = []
for item in filtered:
    name = item.get('名称', '')
    if name not in seen:
        seen.add(name)
        deduped.append(item)

print(f'清理后数据: {len(deduped)}条')

# 统计
from collections import Counter
cats = Counter([item['分类'] for item in deduped])
print('\n分类统计:')
for cat, cnt in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {cnt}')

# 保存
with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'w', encoding='utf-8') as f:
    json.dump(deduped, f, ensure_ascii=False, indent=2)

print('\n已保存!')
