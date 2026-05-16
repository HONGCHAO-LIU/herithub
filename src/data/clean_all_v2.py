import json

with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def is_valid(item):
    name = item.get('名称', '')
    desc = item.get('描述', '')
    cat = item.get('分类', '')
    
    # 名称和描述相同
    if name == desc:
        return False
    
    # 博物馆11+
    if name.startswith('博物馆') and len(name) > 3:
        try:
            n = int(name[3:])
            if n >= 11:
                return False
        except:
            pass
    
    # 世界遗产16+
    if name.startswith('世界遗产') and len(name) > 4:
        try:
            n = int(name[4:])
            if n >= 16:
                return False
        except:
            pass
    
    # 中国机构7+
    if name.startswith('中国机构') and len(name) > 3:
        try:
            n = int(name[3:])
            if n >= 7:
                return False
        except:
            pass
    
    # 公众号
    if '公众号' in name:
        return False
    
    # 政府机构中也有占位符
    if cat == '政府机构' and name.startswith('中国机构'):
        return False
        
    return True

# 过滤
cleaned = [item for item in data if is_valid(item)]

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
