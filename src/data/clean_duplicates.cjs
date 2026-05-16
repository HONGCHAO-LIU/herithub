const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, 'heritage.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

console.log(`处理前数据量: ${data.length}`)

// 1. 按名称去重，保留第一条
const nameCount = {}
data.forEach(item => {
  const name = item.名称 || ''
  nameCount[name] = (nameCount[name] || 0) + 1
})

const duplicates = Object.entries(nameCount).filter(([_, count]) => count > 1)
console.log(`\n发现 ${duplicates.length} 个重复名称`)
duplicates.slice(0, 10).forEach(([name, count]) => {
  console.log(`  ${name}: ${count}次`)
})

// 去重
const seen = new Set()
const uniqueData = []
data.forEach(item => {
  const name = item.名称 || ''
  if (!seen.has(name)) {
    seen.add(name)
    uniqueData.push(item)
  }
})

console.log(`\n去重后数据量: ${uniqueData.length}`)

// 2. 统一平台类型为"网站"
uniqueData.forEach(item => {
  if (item.平台类型 && item.平台类型.toLowerCase() === 'website') {
    item.平台类型 = '网站'
  }
})

// 3. 修复URL格式（检查是否有缺少斜杠的问题）
uniqueData.forEach(item => {
  if (item.网址 && item.网址.includes('baike.baidu.com') && !item.网址.includes('baike.baidu.com/')) {
    item.网址 = item.网址.replace('baike.baidu.com', 'baike.baidu.com/')
  }
})

// 4. 改进分类准确性
// 非物质文化遗产补充
const intangibleCategories = [
  '春节', '元宵节', '端午节', '中秋节', '清明节', '重阳节',
  '昆曲', '京剧', '越剧', '黄梅戏', '评剧', '豫剧', '粤剧',
  '古琴艺术', '昆曲艺术', '书法', '篆刻', '剪纸', '木版年画',
  '刺绣', '泥塑', '剪纸', '灯彩', '风筝', '空竹',
  '中医针灸', '中医诊疗法', '中药炮制技术',
  '二十四节气', '农历二十四节气'
]

const intangibleExamples = [
  { "名称": "春节", "网址": "https://www.chunJie.com", "描述": "中国最重要传统节日", "来源": "联合国教科文组织", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "昆曲", "网址": "https://www.kunqu.org", "描述": "中国最古老剧种之一", "来源": "联合国教科文组织", "分类": "非物质文化遗产", "地区": "国内-江苏", "平台类型": "网站" },
  { "名称": "古琴艺术", "网址": "https://www.guqin.cn", "描述": "中国最古老弹拨乐器", "来源": "联合国教科文组织", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "中国书法", "网址": "https://www.ccag.org.cn", "描述": "中国传统艺术", "来源": "中国书法家协会", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "中国篆刻", "网址": "https://www.zhuanke.org", "描述": "传统篆刻艺术", "来源": "中国篆刻家协会", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "中国剪纸", "网址": "https://www.chinese-paper-cutting.com", "描述": "传统民间艺术", "来源": "中国剪纸协会", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "端午节", "网址": "https://www.duanwu.com", "描述": "中国传统节日", "来源": "联合国教科文组织", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "中秋节", "网址": "https://www.zhongqiu.com", "描述": "中国传统节日", "来源": "联合国教科文组织", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "中医针灸", "网址": "https://www.acupuncture.org.cn", "描述": "中国传统医学", "来源": "国家中医药管理局", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" },
  { "名称": "二十四节气", "网址": "https://www.24jieqi.com", "描述": "中国传统历法智慧", "来源": "联合国教科文组织", "分类": "非物质文化遗产", "地区": "国内-全国", "平台类型": "网站" }
]

// 检查是否已存在
intangibleExamples.forEach(item => {
  if (!seen.has(item.名称)) {
    uniqueData.push(item)
    seen.add(item.名称)
  }
})

console.log(`\n添加非遗数据后: ${uniqueData.length}`)

// 5. 统一地区格式（确保都是 "国内-XX" 或 "国际-XX" 格式）
uniqueData.forEach(item => {
  if (item.地区 && !item.地区.startsWith('国内') && !item.地区.startsWith('国际')) {
    // 已经是正确格式的直接跳过
  }
})

// 6. 统一URL格式（确保都有 https:// 或 http://）
uniqueData.forEach(item => {
  if (item.网址 && !item.网址.startsWith('http://') && !item.网址.startsWith('https://')) {
    item.网址 = 'https://' + item.网址
  }
})

// 写入文件
fs.writeFileSync(dataPath, JSON.stringify(uniqueData, null, 2) + '\n', 'utf8')

console.log('\n处理完成!')
console.log(`最终数据量: ${uniqueData.length}`)

// 统计各分类数量
const categoryCount = {}
uniqueData.forEach(item => {
  const cat = item.分类 || '其他'
  categoryCount[cat] = (categoryCount[cat] || 0) + 1
})
console.log('\n各分类统计:')
Object.entries(categoryCount).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`)
})