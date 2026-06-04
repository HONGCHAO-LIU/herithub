'use client';

import { useMemo } from 'react';
import businessData from '@/data/business_intelligence.json';
import type { BusinessIntelligence } from '@/types/index';

const categoryColors: Record<string, string> = {
  '文创开发': '#C41E3A',
  '文旅融合': '#2E7D32',
  '文化遗产数字化': '#1565C0',
  '专业服务': '#6A1B9A',
  '教育培训': '#E65100',
  '内容与媒体': '#558B2F',
  '投融资与资产化': '#BF360C',
};

const data = businessData as BusinessIntelligence[];

export default function BusinessArchivePage() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const cutoff = threeMonthsAgo.toISOString().slice(0, 7); // 2026-03

  const archived = useMemo(() => {
    return data.filter((item) => {
      const itemMonth = item.publishDate.slice(0, 7);
      return itemMonth < cutoff;
    });
  }, []);

  const active = useMemo(() => {
    return data.filter((item) => {
      const itemMonth = item.publishDate.slice(0, 7);
      return itemMonth >= cutoff;
    });
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, BusinessIntelligence[]> = {};
    archived.forEach((item) => {
      const month = item.publishDate.slice(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(item);
    });
    const sorted = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    return sorted;
  }, [archived]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return `${y}年${parseInt(m)}月`;
  };

  return (
    <div className="container">
      <section className="hero">
        <h2>商业情报 · 历史归档</h2>
        <p>
          默认仅展示近三个月（{cutoff} 至今）的情报条目。更早数据按月归档于此页面，便于追溯查询。
        </p>
      </section>

      <div className="archive-summary">
        <div className="archive-summary-card">
          <span className="archive-summary-num">{active.length}</span>
          <span className="archive-summary-label">活跃条目（近三个月）</span>
        </div>
        <div className="archive-summary-card">
          <span className="archive-summary-num">{archived.length}</span>
          <span className="archive-summary-label">已归档条目</span>
        </div>
        <div className="archive-summary-card">
          <span className="archive-summary-num">{grouped.length}</span>
          <span className="archive-summary-label">归档月份</span>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="empty-state">暂无归档数据。所有情报均在近三个月内发布。</div>
      ) : (
        grouped.map(([month, items]) => (
          <section key={month} className="archive-month-section">
            <h3 className="archive-month-heading">{monthLabel(month)} ({items.length} 条)</h3>
            <div className="business-card-list">
              {items.map((item) => (
                <div key={item.id} className="business-card">
                  <div className="business-card-header">
                    <h3 className="business-card-title">
                      <a href={`/business/${item.id}`}>
                        {item.title}
                      </a>
                    </h3>
                    <span className={`verify-badge ${item.verified ? 'verified' : 'unverified'}`}>
                      {item.verified ? '已验证' : '待核实'}
                    </span>
                  </div>
                  <div className="business-card-tags">
                    <span
                      className="business-category-tag"
                      style={{ background: categoryColors[item.category] || '#999' }}
                    >
                      {item.category}
                    </span>
                    <span className="business-type-tag">{item.type}</span>
                    {item.amount && <span className="business-amount">{item.amount}</span>}
                  </div>
                  {item.description && (
                    <p className="business-card-desc">{item.description}</p>
                  )}
                  <div className="business-card-meta">
                    <span>来源：{item.source}</span>
                    <span>发布日期：{item.publishDate}</span>
                    <span>最后核验：{item.lastChecked}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      )}

      <div className="detail-back" style={{ marginTop: '2rem' }}>
        <a href="/business" className="detail-back-link">← 返回商业情报页面</a>
      </div>
    </div>
  );
}
