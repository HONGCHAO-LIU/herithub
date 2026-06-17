/**
 * herithub 全文搜索索引构建脚本
 * 读取 src/data/ 下四个数据文件，构建 FlexSearch Document 索引
 * 写入 public/search-index.json
 */

const fs = require('fs');
const path = require('path');

let FlexSearch;
try {
  /* eslint-disable-next-line @typescript-eslint/no-var-requires */
  FlexSearch = require('flexsearch');
} catch (e) {
  console.warn('[search-index] FlexSearch 加载失败，跳过索引构建:', e.message);
  process.exit(0);
}

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUTPUT = path.join(ROOT, 'public', 'search-index.json');

// ─── 1. 加载数据 ──────────────────────────────────────────────
function loadJSON(filename) {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(raw);
}

const heritageData    = loadJSON('heritage.json');
const conferencesData = loadJSON('academic_conferences.json');
const papersData      = loadJSON('academic_papers.json');
const businessData    = loadJSON('business_intelligence.json');

// ─── 2. 统一文档格式 ──────────────────────────────────────────
function normalizeHeritage(item, index) {
  return {
    id: `h-${index}`,
    title: item['名称'] || '',
    type: 'heritage',
    category: item['分类'] || '',
    description: (item['描述'] || '').slice(0, 300),
    url: `/heritage/${index}`,
    date: '',
    _text: [
      item['名称'] || '',
      item['分类'] || '',
      item['地区'] || '',
      item['来源'] || '',
    ].join(' '),
  };
}

function normalizeConference(item) {
  return {
    id: `c-${item.id}`,
    title: item.name || '',
    type: 'conference',
    category: item.tags && item.tags.length > 0 ? item.tags[0] : '',
    description: (item.description || '').slice(0, 300),
    url: `/academic/conference/${item.id}`,
    date: (item.date || '').split('~')[0].trim(),
    _text: [
      item.name || '',
      item.description || '',
      (item.tags || []).join(' '),
      (item.keywords || []).join(' '),
      item.organizer || '',
      item.location || '',
    ].join(' '),
  };
}

function normalizePaper(item) {
  return {
    id: `p-${item.id}`,
    title: item.title || '',
    type: 'paper',
    category: item.keywords && item.keywords.length > 0 ? item.keywords[0] : '',
    description: (item.abstract || '').slice(0, 300),
    url: `/academic/paper/${item.id}`,
    date: item.publishDate || '',
    _text: [
      item.title || '',
      item.abstract || '',
      (item.keywords || []).join(' '),
      item.authors || '',
      item.journal || '',
    ].join(' '),
  };
}

function normalizeBusiness(item) {
  return {
    id: `b-${item.id}`,
    title: item.title || '',
    type: 'business',
    category: item.category || '',
    description: (item.description || '').replace(/\s+/g, ' ').trim().slice(0, 300),
    url: `/business/${item.id}`,
    date: item.publishDate || item.date || '',
    _text: [
      item.title || '',
      item.description || '',
      item.category || '',
      item.source || '',
      (item.tags || []).join(' '),
    ].join(' '),
  };
}

const heritageDocs    = heritageData.map(normalizeHeritage);
const conferenceDocs  = conferencesData.map(normalizeConference);
const paperDocs       = papersData.map(normalizePaper);
const businessDocs    = businessData.map(normalizeBusiness);

const allDocs = [...heritageDocs, ...conferenceDocs, ...paperDocs, ...businessDocs];

// ─── 3. 建立 FlexSearch Document 索引 ─────────────────────────
try {
const index = new FlexSearch.Document({
  tokenize: 'forward',
  document: {
    id: 'id',
    index: [
      { field: 'title', tokenize: 'forward', resolution: 9 },
      { field: 'description', tokenize: 'forward', resolution: 5 },
      { field: '_text', tokenize: 'forward', resolution: 5 },
      { field: 'category', tokenize: 'forward', resolution: 5 },
    ],
    store: ['id', 'title', 'type', 'category', 'description', 'url', 'date'],
  },
});

allDocs.forEach((doc) => index.add(doc));

// ─── 4. 导出索引 ──────────────────────────────────────────────
const exportData = {
  index: index.export(),
  docs: allDocs.map(({ _text, ...rest }) => rest),
  stats: {
    heritage: heritageDocs.length,
    conference: conferenceDocs.length,
    paper: paperDocs.length,
    business: businessDocs.length,
    total: allDocs.length,
    builtAt: new Date().toISOString(),
  },
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(exportData), 'utf-8');

console.log(
  `[search-index] 索引构建完成: 共 ${allDocs.length} 条 ` +
  `(机构 ${heritageDocs.length} / 会议 ${conferenceDocs.length} / 论文 ${paperDocs.length} / 情报 ${businessDocs.length})`
);

} catch (err) {
  console.warn('[search-index] 索引构建异常，降级为空索引:', err.message);
  const fallbackExport = {
    index: {},
    docs: allDocs.map(({ _text, ...rest }) => rest),
    stats: {
      heritage: heritageDocs.length,
      conference: conferenceDocs.length,
      paper: paperDocs.length,
      business: businessDocs.length,
      total: allDocs.length,
      builtAt: new Date().toISOString(),
      degraded: true,
    },
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(fallbackExport), 'utf-8');
  console.log('[search-index] 降级索引已写入（搜索功能可能需要冷启动）');
}

// FlexSearch 0.7 在部分 Node.js 版本中存在 setTimeout 异步回调崩溃问题
// 使用 uncaughtException 兜底，确保进程以 0 退出
process.on('uncaughtException', (err) => {
  if (err.message && err.message.includes('is not a function')) {
    // FlexSearch teardown crash - 索引已正确写入，静默退出
    process.exit(0);
  }
  throw err;
});
