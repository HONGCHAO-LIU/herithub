/**
 * 数据统计脚本 - 为数据可视化看板生成 stats.json
 * 读取 src/data/ 下四个数据文件，输出统计结果到 public/stats.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'stats.json');

function loadJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[stats] 警告: 文件不存在 - ${filePath}`);
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[stats] 解析失败: ${filename}`, err.message);
    return [];
  }
}

function parseDate(value) {
  if (!value) return null;
  // 尝试多种日期格式
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  } catch (_) {}
  // 尝试 ISO 8601 截取
  if (typeof value === 'string' && value.length >= 10) {
    const d = new Date(value.slice(0, 10));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// 加载数据
console.log('[stats] 读取数据文件...');
const heritage = loadJSON('heritage.json');
const conferences = loadJSON('academic_conferences.json');
const papers = loadJSON('academic_papers.json');
const business = loadJSON('business_intelligence.json');

console.log(`[stats] heritage: ${heritage.length}, conferences: ${conferences.length}, papers: ${papers.length}, business: ${business.length}`);

// ========== 1. 类型数量 ==========
const typeCounts = {
  heritage: heritage.length,
  conference: conferences.length,
  paper: papers.length,
  business: business.length,
};

// ========== 2. 标签分布 Top 15 ==========
const tagMap = new Map();

function addTags(tags, weight = 1) {
  if (!Array.isArray(tags)) return;
  tags.forEach(t => {
    if (t && typeof t === 'string' && t.trim()) {
      const key = t.trim();
      tagMap.set(key, (tagMap.get(key) || 0) + weight);
    }
  });
}

// heritage: 分类 作为标签
heritage.forEach(item => {
  if (item['分类']) {
    addTags([item['分类']]);
  }
});

// conferences: tags + keywords
conferences.forEach(item => {
  addTags(item.tags);
  addTags(item.keywords);
});

// papers: keywords
papers.forEach(item => {
  addTags(item.keywords);
});

// business: tags
business.forEach(item => {
  addTags(item.tags);
});

const topTags = [...tagMap.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([name, count]) => ({ name, count }));

// ========== 3. 来源分布 Top 10 ==========
const sourceMap = new Map();

function addSource(source) {
  if (source && typeof source === 'string' && source.trim()) {
    const key = source.trim();
    sourceMap.set(key, (sourceMap.get(key) || 0) + 1);
  }
}

heritage.forEach(item => addSource(item['来源']));
conferences.forEach(item => addSource(item.organizer));
papers.forEach(item => addSource(item.journal));
business.forEach(item => addSource(item.source));

const topSources = [...sourceMap.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([name, count]) => ({ name, count }));

// ========== 4. 月度新增趋势（最近 12 个月） ==========
const now = new Date();
const monthCounts = new Map();

// 初始化最近 12 个月
for (let i = 11; i >= 0; i--) {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  monthCounts.set(getMonthKey(d), { heritage: 0, conference: 0, paper: 0, business: 0 });
}

function countMonth(item, type) {
  let d = null;
  if (item.crawledAt) {
    d = parseDate(item.crawledAt);
  } else if (item.date) {
    d = parseDate(item.date);
  } else if (item.publishDate) {
    d = parseDate(item.publishDate);
  }
  // heritage 无 crawledAt，使用当前时间
  if (!d) {
    d = now;
  }
  const key = getMonthKey(d);
  if (monthCounts.has(key)) {
    monthCounts.get(key)[type] += 1;
  }
}

heritage.forEach(item => countMonth(item, 'heritage'));
conferences.forEach(item => countMonth(item, 'conference'));
papers.forEach(item => countMonth(item, 'paper'));
business.forEach(item => countMonth(item, 'business'));

const monthlyTrend = [...monthCounts.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([month, counts]) => ({ month, ...counts }));

// ========== 输出 ==========
const stats = {
  generatedAt: now.toISOString(),
  typeCounts,
  topTags,
  topSources,
  monthlyTrend,
};

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2), 'utf-8');
console.log(`[stats] 统计完成 -> ${OUTPUT_FILE}`);
console.log(`[stats] 类型: ${JSON.stringify(typeCounts)}`);
console.log(`[stats] 标签 Top 5: ${topTags.slice(0, 5).map(t => `${t.name}(${t.count})`).join(', ')}`);
console.log(`[stats] 来源 Top 5: ${topSources.slice(0, 5).map(s => `${s.name}(${s.count})`).join(', ')}`);
console.log(`[stats] 月度趋势: ${monthlyTrend.length} 个月`);
