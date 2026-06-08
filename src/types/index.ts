export interface HeritageItem {
  名称: string;
  网址: string;
  描述: string;
  来源: string;
  分类: string;
  地区: string;
  平台类型?: string;
  sub_category?: string;
  type?: string;
  国家?: string;
  省份?: string;
  实体类型?: string;
  详细分类?: string;
  标签?: string[];
  图片URL?: string;
  完整地区?: string;
  数据创建时间?: string;
  数据更新时间?: string;
  简介?: string;
  验证时间?: string;
  可访问?: boolean;
  主题相关?: boolean;
  链接状态?: string;
}

/** 商业情报 — 招标公告/项目合作/成交公告/报价基准/商业案例/服务商名录 */
export interface BusinessIntelligence {
  id: number;
  title: string;
  category: '文创开发' | '文旅融合' | '文化遗产数字化' | '专业服务' | '教育培训' | '内容与媒体' | '投融资与资产化';
  type: '招标公告' | '项目合作招募' | '成交公告' | '报价基准' | '商业案例' | '服务商名录';
  amount?: string;           // 金额，如 "¥350万" 或 "面议"
  publishDate: string;        // YYYY-MM-DD
  source: string;             // 发布机构/来源平台
  sourceUrl: string;          // 原始链接
  description: string;
  tags: string[];
  verified: boolean;
  crawledAt: string;
  lastChecked: string;
}

/** 学术会议 */
export interface AcademicConference {
  id: number;
  name: string;
  date: string;               // 举办日期，如 "2026-09-15 ~ 2026-09-18"
  location: string;           // 举办地点，如 "北京·清华大学"
  deadline?: string;          // 投稿截止日期，如 "2026-06-30"
  website?: string;           // 会议官网
  organizer: string;          // 主办方
  tags: string[];
  description: string;
  sourceUrl: string;
  verified: boolean;
  crawledAt: string;
}

/** 学术论文 */
export interface AcademicPaper {
  id: number;
  title: string;
  authors: string;            // "张三, 李四"
  journal: string;            // 期刊名
  doi?: string;               // DOI 号
  publishDate: string;        // YYYY-MM-DD
  abstract: string;
  keywords: string[];
  sourceUrl: string;
  verified: boolean;
  crawledAt: string;
}
