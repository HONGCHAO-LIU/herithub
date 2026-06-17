/**
 * 翻译字典 (dict.ts)
 *
 * 包含导航栏、搜索框、看板、分类标签等 UI 文本的中英文映射。
 * 键名统一使用中文作为 key，英文作为翻译值。
 */

import type { Locale } from './i18n';

export type DictMap = Record<string, Record<Locale, string>>;

export const uiDict: DictMap = {
  // 导航栏
  '首页': { zh: '首页', en: 'Home' },
  '机构名录': { zh: '机构名录', en: 'Directory' },
  '商业情报': { zh: '商业情报', en: 'Business' },
  '学术动态': { zh: '学术动态', en: 'Academic' },
  '情报归档': { zh: '情报归档', en: 'Archive' },
  '学术归档': { zh: '学术归档', en: 'Academic Archive' },
  '创作者': { zh: '创作者', en: 'Creators' },
  '论坛': { zh: '论坛', en: 'Forum' },
  '数据看板': { zh: '数据看板', en: 'Dashboard' },
  '关于': { zh: '关于', en: 'About' },

  // 搜索框
  '搜索': { zh: '搜索', en: 'Search' },
  '全文搜索': { zh: '全文搜索', en: 'Full-Text Search' },
  '搜索机构、会议、论文、情报...': { zh: '搜索机构、会议、论文、情报...', en: 'Search organizations, conferences, papers...' },
  '搜索中...': { zh: '搜索中...', en: 'Searching...' },
  '未找到相关结果': { zh: '未找到相关结果', en: 'No results found' },

  // Tab & 筛选
  '学术会议': { zh: '学术会议', en: 'Conferences' },
  '论文成果': { zh: '论文成果', en: 'Papers' },
  '全部年份': { zh: '全部年份', en: 'All Years' },
  '全部标签': { zh: '全部标签', en: 'All Tags' },
  '全部期刊': { zh: '全部期刊', en: 'All Journals' },
  '全部关键词': { zh: '全部关键词', en: 'All Keywords' },
  '清除筛选': { zh: '清除筛选', en: 'Clear Filters' },

  // 学术动态页
  '年': { zh: '年', en: '' },

  // 详情页
  '论文信息': { zh: '论文信息', en: 'Paper Info' },
  '作者': { zh: '作者', en: 'Authors' },
  '期刊': { zh: '期刊', en: 'Journal' },
  '发布日期': { zh: '发布日期', en: 'Published' },
  '原始链接': { zh: '原始链接', en: 'Source Link' },
  '采集时间': { zh: '采集时间', en: 'Crawled At' },
  '摘要': { zh: '摘要', en: 'Abstract' },
  '关键词': { zh: '关键词', en: 'Keywords' },
  '验证信息': { zh: '验证信息', en: 'Verification' },
  '已验证': { zh: '已验证', en: 'Verified' },
  '待核实': { zh: '待核实', en: 'Unverified' },
  '链接失效': { zh: '链接失效', en: 'Link Broken' },
  '已人工核验': { zh: '已人工核验', en: 'Human Verified' },
  '待人工核验': { zh: '待人工核验', en: 'Pending Review' },
  '报告问题 / 更新链接': { zh: '报告问题 / 更新链接', en: 'Report Issue / Update Link' },
  '返回学术动态列表': { zh: '返回学术动态列表', en: 'Back to Academic' },

  // 中文摘要 / English Abstract 切换
  '中文摘要': { zh: '中文摘要', en: 'Chinese Abstract' },
  'English Abstract': { zh: '英文摘要', en: 'English Abstract' },

  // 语言切换
  '中': { zh: '中', en: '中' },
  'EN': { zh: 'EN', en: 'EN' },

  // 通用
  '返回': { zh: '返回', en: 'Back' },
  '返回学术动态页面': { zh: '返回学术动态页面', en: 'Back to Academic' },
  '未找到匹配的会议，请调整搜索条件。': { zh: '未找到匹配的会议，请调整搜索条件。', en: 'No matching conferences found. Please adjust your search.' },
  '未找到匹配的论文，请调整搜索条件。': { zh: '未找到匹配的论文，请调整搜索条件。', en: 'No matching papers found. Please adjust your search.' },
  '未找到匹配的机构，请调整筛选条件。': { zh: '未找到匹配的机构，请调整筛选条件。', en: 'No matching organizations found. Please adjust filters.' },
  '未找到匹配的商业情报，请调整筛选条件。': { zh: '未找到匹配的商业情报，请调整筛选条件。', en: 'No matching business intelligence found. Please adjust filters.' },

  // 机构名录 (Heritage)
  '机构列表': { zh: '机构列表', en: 'Directory' },
  '按分类': { zh: '按分类', en: 'By Category' },
  '全部分类': { zh: '全部分类', en: 'All Categories' },
  '来源：': { zh: '来源：', en: 'Source: ' },
  '创建：': { zh: '创建：', en: 'Created: ' },
  '核验：': { zh: '核验：', en: 'Verified: ' },

  // 商业情报 (Business)
  '情报列表': { zh: '情报列表', en: 'Intel List' },
  '按领域': { zh: '按领域', en: 'By Field' },
  '全部领域': { zh: '全部领域', en: 'All Fields' },
  '按类型': { zh: '按类型', en: 'By Type' },
  '全部类型': { zh: '全部类型', en: 'All Types' },
  '发布日期：': { zh: '发布日期：', en: 'Published: ' },
  '最后核验：': { zh: '最后核验：', en: 'Last Checked: ' },

  // 商业情报分类标签
  '文创开发': { zh: '文创开发', en: 'Cultural Creative' },
  '文旅融合': { zh: '文旅融合', en: 'Cultural Tourism' },
  '文化遗产数字化': { zh: '文化遗产数字化', en: 'Digital Heritage' },
  '专业服务': { zh: '专业服务', en: 'Professional Services' },
  '教育培训': { zh: '教育培训', en: 'Education & Training' },
  '内容与媒体': { zh: '内容与媒体', en: 'Content & Media' },
  '投融资与资产化': { zh: '投融资与资产化', en: 'Investment & Assetization' },

  // 商业情报类型标签
  '招标公告': { zh: '招标公告', en: 'Tender Notice' },
  '项目合作招募': { zh: '项目合作招募', en: 'Call for Partners' },
  '成交公告': { zh: '成交公告', en: 'Award Notice' },
  '报价基准': { zh: '报价基准', en: 'Price Benchmark' },
  '商业案例': { zh: '商业案例', en: 'Case Study' },
  '服务商名录': { zh: '服务商名录', en: 'Vendor Directory' },

  // 机构名录分类标签
  '研究机构': { zh: '研究机构', en: 'Research Institute' },
  '博物馆': { zh: '博物馆', en: 'Museum' },
  '政府机构': { zh: '政府机构', en: 'Government' },
  '国际组织': { zh: '国际组织', en: 'International Org' },
  '世界遗产': { zh: '世界遗产', en: 'World Heritage' },
  '非物质文化遗产': { zh: '非物质文化遗产', en: 'Intangible Heritage' },

  // 看板
  '数据可视化看板': { zh: '数据可视化看板', en: 'Data Dashboard' },
  '共收录': { zh: '共收录', en: 'Total: ' },
  '条数据': { zh: '条数据', en: ' entries' },
  '生成时间：': { zh: '生成时间：', en: 'Generated: ' },
  '数据类型分布': { zh: '数据类型分布', en: 'Data Type Distribution' },
  '标签分布 Top 15': { zh: '标签分布 Top 15', en: 'Top 15 Tags' },
  '来源分布 Top 10': { zh: '来源分布 Top 10', en: 'Top 10 Sources' },
  '月度新增趋势（近 12 个月）': { zh: '月度新增趋势（近 12 个月）', en: 'Monthly Trend (Last 12 Months)' },

  // 归档页
  '学术动态 · 历史归档': { zh: '学术动态 · 历史归档', en: 'Academic · Archive' },
  '已归档会议': { zh: '已归档会议', en: 'Archived Conferences' },
  '已归档论文': { zh: '已归档论文', en: 'Archived Papers' },
  '归档月份': { zh: '归档月份', en: 'Archive Months' },
  '会议归档': { zh: '会议归档', en: 'Conf. Archive' },
  '论文归档': { zh: '论文归档', en: 'Paper Archive' },
  '暂无会议归档数据。': { zh: '暂无会议归档数据。', en: 'No archived conference data.' },
  '暂无论文归档数据。': { zh: '暂无论文归档数据。', en: 'No archived paper data.' },
  '场': { zh: '场', en: '' },
  '篇': { zh: '篇', en: '' },
  '时间': { zh: '时间', en: 'Date' },
  '地点': { zh: '地点', en: 'Location' },
  '主办': { zh: '主办', en: 'Organizer' },

  // 其他通用
  '搜索机构名称、描述或来源...': { zh: '搜索机构名称、描述或来源...', en: 'Search organization name, description...' },
  '搜索标题、描述、标签或来源...': { zh: '搜索标题、描述、标签或来源...', en: 'Search title, description, tags...' },
  '搜索会议名称、论文标题、作者、关键词...': { zh: '搜索会议名称、论文标题、作者、关键词...', en: 'Search conference, paper title, author, keyword...' },

  '条': { zh: '条', en: '' },

  // 报告问题
  '报告问题': { zh: '报告问题', en: 'Report Issue' },
  '← 返回学术动态页面': { zh: '← 返回学术动态页面', en: '← Back to Academic' },

  // 清除
  '清除': { zh: '清除', en: 'Clear' },
};
