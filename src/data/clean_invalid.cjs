const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, 'heritage.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

console.log(`处理前数据量: ${data.length}`)

// 需要删除的失效域名
const invalidDomains = [
  'sach.gov.cn',      // 国家文物局已失效
  'cach.org.cn',      // 中国文化遗产研究院
  'wenwujiaoliu.org', // 中国文物交流中心
  'whb.tj.gov.cn',    // 天津文物局
  'hebeww.gov.cn',    // 河北文物局
  'sxwt.gov.cn',      // 山西文物局
  'jlswh.gov.cn',     // 吉林文物局
  'hljswht.gov.cn',   // 黑龙江文旅厅
  'zjww.gov.cn',      // 浙江文物局
  'ahwh.gov.cn',      // 安徽文旅厅
  'fjwh.gov.cn',      // 福建文旅厅
  'jxwh.gov.cn',      // 江西文旅厅
  'sdwh.gov.cn',      // 山东文旅厅
  'haws.gov.cn',      // 河南文物局
  'hbwh.gov.cn',      // 湖北文旅厅
  'hnww.gov.cn',      // 湖南文物局
  'gdwh.gov.cn',      // 广东文旅厅
  'gzwh.gov.cn',      // 贵州文旅厅
  'ynwh.gov.cn',      // 云南文旅厅
  'shxww.gov.cn',     // 陕西文物局
  'gswh.gov.cn',      // 甘肃文旅厅
  'qhwh.gov.cn',      // 青海文旅厅
  'nmgww.gov.cn',     // 内蒙古文物局
  'gxwh.gov.cn',      // 广西文旅厅
  'nxwh.gov.cn',      // 宁夏文旅厅
  'xjwh.gov.cn',      // 新疆文旅厅
  'wgml.sh.gov.cn',   // 上海文旅局
  'whly.gd.gov.cn',   // 广东文旅
  'wwj.zj.gov.cn',    // 浙江文物局
  'wlkt.jiangsu.gov.cn', // 江苏文旅
  'wlt.sc.gov.cn',    // 四川文旅
  'wwj.shaanxi.gov.cn', // 陕西文物局
  'wwj.henan.gov.cn',   // 河南文物局
  'whly.shandong.gov.cn', // 山东文旅
  'whly.hunan.gov.cn',   // 湖南文旅
  'wwj.hebei.gov.cn',    // 河北文物局
  'whly.yn.gov.cn',      // 云南文旅
]

// 过滤数据
const cleanedData = data.filter(item => {
  const url = item.网址 || ''
  const name = item.名称 || ''
  
  // 1. 删除空URL或 #
  if (!url || url === '#') return false
  
  // 2. 删除失效域名
  for (const domain of invalidDomains) {
    if (url.includes(domain)) return false
  }
  
  // 3. 删除描述过短或无意义的数据
  if (!item.描述 || item.描述.length < 4) return false
  
  // 4. 删除名称可疑的数据
  if (name.match(/^(test|fake|\d+|china\d|museum\d|世界遗产\d+|非遗\d+)/)) return false
  
  return true
})

console.log(`删除无效数据后: ${cleanedData.length}`)

// 4. 修复百度百科URL（添加缺少的斜杠）
let baikeFixed = 0
cleanedData.forEach(item => {
  if (item.网址 && item.网址.includes('baike.baidu.com') && !item.网址.includes('baike.baidu.com/')) {
    item.网址 = item.网址.replace('baike.baidu.com', 'baike.baidu.com/')
    baikeFixed++
  }
})
console.log(`修复百度百科URL: ${baikeFixed} 条`)

// 5. 统一平台类型
cleanedData.forEach(item => {
  if (item.平台类型 === 'website') {
    item.平台类型 = '网站'
  }
})

// 6. 统一URL格式
cleanedData.forEach(item => {
  if (item.网址 && !item.网址.startsWith('http://') && !item.网址.startsWith('https://')) {
    item.网址 = 'https://' + item.网址
  }
})

// 统计各分类
const categoryCount = {}
cleanedData.forEach(item => {
  const cat = item.分类 || '其他'
  categoryCount[cat] = (categoryCount[cat] || 0) + 1
})
console.log('\n各分类统计:')
Object.entries(categoryCount).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`)
})

// 写入文件
fs.writeFileSync(dataPath, JSON.stringify(cleanedData, null, 2) + '\n', 'utf8')

console.log(`\n最终数据量: ${cleanedData.length}`)