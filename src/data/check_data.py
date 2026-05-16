import json

with open('C:/Users/Administrator/.openclaw/workspace-work/versions/v1.1.0/src/data/heritage.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 检查微信公众号内容
wechat = [i for i in data if i['分类'] == '微信公众号']
print('微信公众号前10:')
for i in wechat[:10]:
    print(f'  {i["名称"]} | {i["描述"]}')

# 检查非遗内容
feiyi = [i for i in data if i['分类'] == '非物质文化遗产']
print('\n非遗前10:')
for i in feiyi[:10]:
    print(f'  {i["名称"]} | {i["描述"]}')
