import json

with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 直接删除微信公众号分类
cleaned = [item for item in data if item.get('分类') != '微信公众号']

# 再删除名称描述相同的
cleaned = [item for item in cleaned if item.get('名称') != item.get('描述')]

# 删除博物馆11+ 
cleaned = [item for item in cleaned if not (item.get('名称', '').startswith('博物馆') and len(item.get('名称', '')) > 3 and item.get('名称', '')[3:].isdigit() and int(item.get('名称', '')[3:]) >= 11)]

# 删除世界遗产16+
cleaned = [item for item in cleaned if not (item.get('名称', '').startswith('世界遗产') and len(item.get('名称', '')) > 4 and item.get('名称', '')[4:].isdigit() and int(item.get('名称', '')[4:]) >= 16)]

# 删除中国机构7+
cleaned = [item for item in cleaned if not (item.get('名称', '').startswith('中国机构') and len(item.get('名称', '')) > 3 and item.get('名称', '')[3:].isdigit() and int(item.get('名称', '')[3:]) >= 7)]

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
