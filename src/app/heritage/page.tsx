'use client';

import { useState, useMemo } from 'react';
import heritageData from '@/data/heritage.json';
import type { HeritageItem } from '@/types/index';
import Link from 'next/link';

const categoryOrder = [
  '研究机构', '博物馆', '政府机构', '国际组织', '世界遗产', '非物质文化遗产'
] as const;

const categoryConfig: Record<string, { icon: string; color: string; desc: string }> = {
  '研究机构': { icon: '🔬', color: '#6A1B9A', desc: '考古所/研究院/高校' },
  '博物馆': { icon: '🏛️', color: '#8B4513', desc: '各级各类博物馆' },
  '政府机构': { icon: '🏢', color: '#2E7D32', desc: '文物局/文旅厅' },
  '国际组织': { icon: '🌐', color: '#1E3A5F', desc: 'UNESCO/ICOMOS等' },
  '世界遗产': { icon: '🏰', color: '#C41E3A', desc: '世界遗产地' },
  '非物质文化遗产': { icon: '🎭', color: '#E65100', desc: '非遗项目/传承' },
};

const data = heritageData as HeritageItem[];

export default function HeritagePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          (item.名称 || '').toLowerCase().includes(q) ||
          (item.描述 || '').toLowerCase().includes(q) ||
          (item.来源 || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedCategory && item.分类 !== selectedCategory) return false;
      return true;
    });
  }, [search, selectedCategory]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((d) => {
      counts[d.分类] = (counts[d.分类] || 0) + 1;
    });
    return categoryOrder
      .filter((cat) => counts[cat])
      .map((cat) => ({
        key: cat,
        label: (categoryConfig[cat]?.icon || '') + ' ' + cat,
        desc: categoryConfig[cat]?.desc || '',
        count: counts[cat],
      }));
  }, []);

  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <h2>机构名录</h2>
        <p>
          收录国内外文化遗产相关机构的权威名录，涵盖世界遗产地、非物质文化遗产项目、博物馆、考古与文物保护研究机构、各级政府文物主管部门以及UNESCO、ICOMOS等国际组织。
        </p>
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索机构名称、描述或来源..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>清除</button>
          )}
        </div>
      </section>

      {/* Main content: left filter + right list */}
      <div className="main-content business-layout">
        {/* Left Filter Sidebar */}
        <aside className="filter-sidebar">
          <div className="filter-group">
            <h3 className="filter-title">按分类</h3>
            <ul className="filter-list">
              <li>
                <button
                  className={`filter-item ${selectedCategory === '' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('')}
                >
                  <span>全部分类</span>
                  <span className="filter-count">{data.length}</span>
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.key}>
                  <button
                    className={`filter-item ${selectedCategory === c.key ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(selectedCategory === c.key ? '' : c.key)}
                  >
                    <span
                      className="filter-dot"
                      style={{ background: categoryConfig[c.key]?.color || '#999' }}
                    />
                    <span>{c.label}</span>
                    <span className="filter-count">{c.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Content */}
        <section className="main-area">
          <div className="items-header">
            <h2>
              机构列表 <span className="count">({filtered.length} 条)</span>
            </h2>
          </div>

          {search && (
            <p className="result-count">
              搜索「{search}」，找到 {filtered.length} 条结果
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">未找到匹配的机构，请调整筛选条件。</div>
          ) : (
            <div className="business-card-list">
              {filtered.map((item, idx) => {
                const config = categoryConfig[item.分类] || { icon: '📋', color: '#455A64' };
                return (
                  <div key={idx} className="business-card">
                    <div className="business-card-header">
                      <h3 className="business-card-title">
                        <Link href={`/heritage/${encodeURIComponent(item.名称)}`}>
                          {item.名称}
                        </Link>
                      </h3>
                      {item.链接状态 === '失效' && (
                        <span className="verify-badge link-broken">链接失效</span>
                      )}
                    </div>
                    <div className="business-card-tags">
                      <span
                        className="business-category-tag"
                        style={{ background: config.color }}
                      >
                        {config.icon} {item.分类}
                      </span>
                      {item.地区 && (
                        <span className="business-type-tag">{item.地区}</span>
                      )}
                    </div>
                    {item.描述 && (
                      <p className="business-card-desc">{item.描述}</p>
                    )}
                    <div className="business-card-meta">
                      <span>来源：{item.来源 || '—'}</span>
                      {item.数据创建时间 && (
                        <span>创建：{item.数据创建时间}</span>
                      )}
                      {item.验证时间 && (
                        <span>核验：{item.验证时间}</span>
                      )}
                    </div>
                    <div className="business-card-tags-bottom">
                      {item.标签?.map((tag) => (
                        <span key={tag} className="keyword-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="card-report-link">
                      <Link href={`/heritage/${encodeURIComponent(item.名称)}#feedback`} className="report-issue-link">报告问题</Link>
                      {item.网址 && (
                        <a href={item.网址} target="_blank" rel="noopener noreferrer" className="card-original-link">原始链接</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
