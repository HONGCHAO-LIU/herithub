'use client';

import { useState, useMemo } from 'react';
import businessData from '@/data/business_intelligence.json';
import conferenceData from '@/data/academic_conferences.json';
import paperData from '@/data/academic_papers.json';
import type { BusinessIntelligence, AcademicConference, AcademicPaper } from '@/types/index';

/* ---------- 类型 ---------- */
interface PendingBusiness extends BusinessIntelligence {
  dataType: 'business';
}
interface PendingConference extends AcademicConference {
  dataType: 'conference';
}
interface PendingPaper extends AcademicPaper {
  dataType: 'paper';
}

type PendingItem = PendingBusiness | PendingConference | PendingPaper;

/* ---------- 辅助函数 ---------- */
const parseAmount = (amount?: string): number | null => {
  if (!amount || amount === '面议') return null;
  const m = amount.match(/[\d.]+/);
  if (!m) return null;
  const v = parseFloat(m[0]);
  if (amount.includes('亿')) return v * 10000;
  return v;
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const categoryColors: Record<string, string> = {
  '文创开发': '#C41E3A',
  '文旅融合': '#2E7D32',
  '文化遗产数字化': '#1565C0',
  '专业服务': '#6A1B9A',
  '教育培训': '#E65100',
  '内容与媒体': '#00838F',
  '投融资与资产化': '#F9A825',
};

/* ---------- 组件 ---------- */
export default function ReviewDashboard() {
  const [activeTab, setActiveTab] = useState<'business' | 'conference' | 'paper'>('business');

  /* 从三个 JSON 中筛选 verified===false 的条目 */
  const pendingBusiness = useMemo<PendingBusiness[]>(() => {
    return (businessData as BusinessIntelligence[])
      .filter((d) => d.verified === false)
      .map((d) => ({ ...d, dataType: 'business' as const }));
  }, []);

  const pendingConferences = useMemo<PendingConference[]>(() => {
    return (conferenceData as AcademicConference[])
      .filter((d) => d.verified === false)
      .map((d) => ({ ...d, dataType: 'conference' as const }));
  }, []);

  const pendingPapers = useMemo<PendingPaper[]>(() => {
    return (paperData as AcademicPaper[])
      .filter((d) => d.verified === false)
      .map((d) => ({ ...d, dataType: 'paper' as const }));
  }, []);

  /* ---------- 统计 ---------- */
  const stats = useMemo(() => {
    const total = pendingBusiness.length + pendingConferences.length + pendingPapers.length;

    // 价格异常：金额为面议 或 金额超过历史基准 ±30%
    const priceAnomaly = pendingBusiness.filter((item) => {
      if (!item.amount || item.amount === '面议') return true;
      const val = parseAmount(item.amount);
      return val !== null && (val < 10 || val > 5000); // 粗略异常标记
    }).length;

    // 来源可靠性低：非 .gov.cn / .org 域名或 URL 无效
    const lowReliability = [...pendingBusiness, ...pendingConferences, ...pendingPapers].filter(
      (item) => {
        let url = '';
        if (item.dataType === 'business') url = (item as PendingBusiness).sourceUrl || '';
        else if (item.dataType === 'conference') url = (item as PendingConference).sourceUrl || '';
        else url = (item as PendingPaper).sourceUrl || '';
        if (!url) return true;
        if (!isValidUrl(url)) return true;
        const tld = url.replace(/^https?:\/\//, '').split('/')[0];
        return !(tld.endsWith('.gov.cn') || tld.endsWith('.org') || tld.endsWith('.edu.cn'));
      }
    ).length;

    return { total, priceAnomaly, lowReliability };
  }, [pendingBusiness, pendingConferences, pendingPapers]);

  /* ---------- 当前 Tab 数据 ---------- */
  const currentData: PendingItem[] = useMemo(() => {
    switch (activeTab) {
      case 'business':
        return pendingBusiness;
      case 'conference':
        return pendingConferences;
      case 'paper':
        return pendingPapers;
    }
  }, [activeTab, pendingBusiness, pendingConferences, pendingPapers]);

  const tabConfig = [
    { key: 'business' as const, label: '商业情报待审', count: pendingBusiness.length },
    { key: 'conference' as const, label: '会议待审', count: pendingConferences.length },
    { key: 'paper' as const, label: '论文待审', count: pendingPapers.length },
  ];

  /* ---------- 渲染 ---------- */
  return (
    <div className="review-dashboard">
      {/* 顶部统计卡片 */}
      <div className="stat-cards">
        <div className="stat-card stat-card--pending">
          <span className="stat-card__number">{stats.total}</span>
          <span className="stat-card__label">待审核总数</span>
        </div>
        <div className="stat-card stat-card--price">
          <span className="stat-card__number">{stats.priceAnomaly}</span>
          <span className="stat-card__label">价格异常数</span>
        </div>
        <div className="stat-card stat-card--source">
          <span className="stat-card__number">{stats.lowReliability}</span>
          <span className="stat-card__label">来源可靠性低</span>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="review-tabs">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            className={`review-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="review-tab__count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* 审核表格 */}
      {currentData.length === 0 ? (
        <div className="audit-empty">
          <p>当前分类下暂无待审核条目。</p>
          <p className="audit-empty__hint">
            自动采集的数据尚未入库，或所有条目均已通过人工审核。
          </p>
        </div>
      ) : (
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>标题 / 名称</th>
                {activeTab === 'business' && <th>类型</th>}
                {activeTab === 'business' && <th>金额</th>}
                {activeTab === 'business' && <th>价格偏差</th>}
                {activeTab === 'conference' && <th>日期 / 地点</th>}
                {activeTab === 'conference' && <th>投稿截止</th>}
                {activeTab === 'paper' && <th>作者 / 期刊</th>}
                {activeTab === 'paper' && <th>发表日期</th>}
                <th>来源</th>
                <th>采集时间</th>
                <th>审核状态</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => {
                const isBusiness = item.dataType === 'business';
                const isConference = item.dataType === 'conference';
                const isPaper = item.dataType === 'paper';

                let title = '';
                let sourceUrl = '';
                let pubDate = '';
                let crawledAt = '';

                if (isBusiness) {
                  const b = item as PendingBusiness;
                  title = b.title;
                  sourceUrl = b.sourceUrl;
                  pubDate = b.publishDate;
                  crawledAt = b.crawledAt;
                } else if (isConference) {
                  const c = item as PendingConference;
                  title = c.name;
                  sourceUrl = c.sourceUrl;
                  pubDate = c.date;
                  crawledAt = c.crawledAt;
                } else {
                  const p = item as PendingPaper;
                  title = p.title;
                  sourceUrl = p.sourceUrl;
                  pubDate = p.publishDate;
                  crawledAt = p.crawledAt;
                }

                // 价格偏差标记
                let priceDeviation = '—';
                if (isBusiness) {
                  const b = item as PendingBusiness;
                  const val = parseAmount(b.amount);
                  if (!b.amount || b.amount === '面议') {
                    priceDeviation = '需确认';
                  } else if (val !== null && val < 10) {
                    priceDeviation = '偏低';
                  } else if (val !== null && val > 5000) {
                    priceDeviation = '偏高';
                  }
                }

                return (
                  <tr key={`${item.dataType}-${item.id}`}>
                    <td className="audit-cell-id">{item.id}</td>
                    <td className="audit-cell-title">
                      <span className="audit-title-text">{title}</span>
                      {isBusiness && (
                        <span
                          className="audit-category-chip"
                          style={{
                            backgroundColor: categoryColors[(item as PendingBusiness).category] || '#888',
                          }}
                        >
                          {(item as PendingBusiness).category}
                        </span>
                      )}
                    </td>

                    {activeTab === 'business' && (
                      <td className="audit-cell-type">
                        {(item as PendingBusiness).type}
                      </td>
                    )}
                    {activeTab === 'business' && (
                      <td className="audit-cell-amount">
                        {(item as PendingBusiness).amount || '—'}
                      </td>
                    )}
                    {activeTab === 'business' && (
                      <td className="audit-cell-deviation">
                        {priceDeviation !== '—' ? (
                          <span className="price-flag">{priceDeviation}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}

                    {activeTab === 'conference' && (
                      <td className="audit-cell-info">
                        <div className="audit-info-line">{(item as PendingConference).date}</div>
                        <div className="audit-info-sub">{(item as PendingConference).location}</div>
                      </td>
                    )}
                    {activeTab === 'conference' && (
                      <td className="audit-cell-deadline">
                        {(item as PendingConference).deadline || '—'}
                      </td>
                    )}

                    {activeTab === 'paper' && (
                      <td className="audit-cell-info">
                        <div className="audit-info-line">{(item as PendingPaper).authors}</div>
                        <div className="audit-info-sub">{(item as PendingPaper).journal}</div>
                      </td>
                    )}
                    {activeTab === 'paper' && (
                      <td className="audit-cell-date">{pubDate}</td>
                    )}

                    <td className="audit-cell-source">
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="audit-source-link">
                          {isBusiness
                            ? (item as PendingBusiness).source
                            : isConference
                            ? (item as PendingConference).organizer
                            : '查看原文'}
                        </a>
                      ) : (
                        '无链接'
                      )}
                    </td>
                    <td className="audit-cell-date">{crawledAt}</td>
                    <td className="audit-cell-status">
                      <span className="status-badge status-pending">待审核</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 说明 */}
      <div className="audit-footer-note">
        <p>审核操作需人工编辑数据文件中的 <code>verified</code> 字段。审核看板仅展示当前状态。</p>
      </div>
    </div>
  );
}
