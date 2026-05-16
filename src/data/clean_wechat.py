import json

with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 找出所有需要删除的条目的索引
indices_to_remove = []

for i, item in enumerate(data):
    name = item.get('名称', '')
    desc = item.get('描述', '')
    cat = item.get('分类', '')
    
    # 微信公众号 - 名称和描述相似（差异只是最后一个字）
    if cat == '微信公众号':
        # 检查名称是否是 "文博公众号X" 格式
        if name.startswith('文博公众号') and len(name) <= 6:
            indices_to_remove.append(i)
        # 检查描述是否也是类似格式
        if '文博公众号' in desc and name != desc:
            # 但描述里没有"文博"两字的情况
            pass
    
    # 名称和描述完全相同的
    if name == desc:
        indices_to_remove.append(i)

print(f'找到 {len(indices_to_remove)} 条需要删除的数据')

# 删除
cleaned = [item for i, item in enumerate(data) if i not in indices_to_remove]

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
