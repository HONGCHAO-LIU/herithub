import json

# 读取数据
with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f'原始数据: {len(data)}条')

def is_placeholder(item):
    name = item.get('名称', '')
    desc = item.get('描述', '')
    
    # 名称和描述相同的（除了一些特殊情况）
    if name == desc and name not in ['UNESCO世界遗产中心', 'ICOMOS', 'ICCROM', 'ICOM']:
        return True
    
    # 博物馆11-100
    if name.startswith('博物馆') and name[3:].isdigit():
        if int(name[3:]) >= 11:
            return True
    
    # 世界遗产16-100
    if name.startswith('世界遗产') and name[4:].isdigit():
        if int(name[4:]) >= 16:
            return True
    
    # 中国机构7-100
    if name.startswith('中国机构') and name[3:].isdigit():
        if int(name[3:]) >= 7:
            return True
    
    # 微信公众号占位符
    if '公众号' in name and desc == name:
        return True
    
    return False

# 过滤
filtered = [item for item in data if not is_placeholder(item)]

# 去重
seen = set()
deduped = []
for item in filtered:
    name = item.get('名称', '')
    if name not in seen:
        seen.add(name)
        deduped.append(item)

print(f'清理后数据: {len(deduped)}条')

# 统计分类
from collections import Counter
cats = Counter([item['分类'] for item in deduped])
print('\n分类统计:')
for cat, cnt in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {cnt}')

# 保存
output_path = 'C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage_cleaned.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(deduped, f, ensure_ascii=False, indent=2)

print(f'\n已保存到: {output_path}')
