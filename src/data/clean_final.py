import json

with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 只保留名称和描述不同的数据
cleaned = [item for item in data if item.get('名称') != item.get('描述')]

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
