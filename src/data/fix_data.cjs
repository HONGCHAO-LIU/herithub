const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, 'heritage.json')
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

console.log(`处理前数据量: ${data.length}`)

// 1. 修复博物馆网址格式错误
let fixed = 0
data.forEach(item => {
  if (item.名称 === '河南博物院' && item.网址 === 'https://www.ha Museum.com') {
    item.网址 = 'https://www.hnmuseum.com'
    fixed++
    console.log('修复: 河南博物院')
  }
  if (item.名称 === '深圳博物馆' && item.网址 === 'https://www. Shenzhenmuseum.org') {
    item.网址 = 'https://www.shenzhenmuseum.org'
    fixed++
    console.log('修复: 深圳博物馆')
  }
})

console.log(`修复网址: ${fixed} 条`)

// 2. 删除无网址的政府机构
const beforeGov = data.filter(item => item.分类 === '政府机构').length
const noUrlGov = data.filter(item => item.分类 === '政府机构' && (!item.网址 || item.网址 === '' || item.网址 === '#'))
console.log(`无网址政府机构: ${noUrlGov.length} 条`)

// 删除无网址的政府机构
const cleanedData = data.filter(item => {
  if (item.分类 === '政府机构') {
    return item.网址 && item.网址 !== '' && item.网址 !== '#'
  }
  return true
})

const afterGov = cleanedData.filter(item => item.分类 === '政府机构').length
console.log(`删除政府机构: ${beforeGov - afterGov} 条`)
console.log(`剩余政府机构: ${afterGov} 条`)

// 写入文件
fs.writeFileSync(dataPath, JSON.stringify(cleanedData, null, 2) + '\n', 'utf8')

console.log('\n处理完成!')
console.log(`最终数据量: ${cleanedData.length}`)

// 统计剩余政府机构
const govCount = cleanedData.filter(item => item.分类 === '政府机构').length
console.log(`政府机构总计: ${govCount} 条`)