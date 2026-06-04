'use client';

import { useState, useMemo } from 'react';
import businessData from '@/data/business_intelligence.json';
import type { BusinessIntelligence } from '@/types/index';

const categoryLabels: Record<BusinessIntelligence['category'], string> = {
  '文创开发': '文创开发',
  '文旅融合': '文旅融合',
  '文化遗产数字化': '文化遗产数字化',
  '专业服务': '专业服务',
  '教育培训': '教育培训',
  '内容与媒体': '内容与媒体',
  '投融资与资产化': '投融资与资产化',
};

const typeLabels: Record<BusinessIntelligence['type'], string> = {
  '招标公告': '招标公告',
  '项目合作招募': '项目合作招募',
  '成交公告': '成交公告',
  '报价基准': '报价基准',
  '商业案例': '商业案例',
  '服务商名录': '服务商名录',
};

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

export default function BusinessPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.source.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (selectedType && item.type !== selectedType) return false;
      return true;
    });
  }, [search, selectedCategory, selectedType]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((d) => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return Object.entries(categoryLabels).map(([key, label]) => ({
      key,
      label,
      count: counts[key] || 0,
    }));
  }, []);

  const types = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((d) => {
      counts[d.type] = (counts[d.type] || 0) + 1;
    });
    return Object.entries(typeLabels).map(([key, label]) => ({
      key,
      label,
      count: counts[key] || 0,
    }));
  }, []);

  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <h2>商业情报</h2>
        <p>
          覆盖文创开发、文旅融合、文化遗产数字化、专业服务、教育培训、内容与媒体、投融资与资产化七大领域，汇集招标公告、项目合作招募、成交公告、报价基准、商业案例与服务商名录。
        </p>
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索标题、描述、标签或来源..."
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
            <h3 className="filter-title">按领域</h3>
            <ul className="filter-list">
              <li>
                <button
                  className={`filter-item ${selectedCategory === '' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('')}
                >
                  <span>全部领域</span>
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
                      style={{ background: categoryColors[c.key] || '#999' }}
                    />
                    <span>{c.label}</span>
                    <span className="filter-count">{c.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="filter-group">
            <h3 className="filter-title">按类型</h3>
            <ul className="filter-list">
              <li>
                <button
                  className={`filter-item ${selectedType === '' ? 'active' : ''}`}
                  onClick={() => setSelectedType('')}
                >
                  <span>全部类型</span>
                  <span className="filter-count">{data.length}</span>
                </button>
              </li>
              {types.map((t) => (
                <li key={t.key}>
                  <button
                    className={`filter-item ${selectedType === t.key ? 'active' : ''}`}
                    onClick={() => setSelectedType(selectedType === t.key ? '' : t.key)}
                  >
                    <span>{t.label}</span>
                    <span className="filter-count">{t.count}</span>
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
              情报列表 <span className="count">({filtered.length} 条)</span>
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">未找到匹配的商业情报，请调整筛选条件。</div>
          ) : (
            <div className="business-card-list">
              {filtered.map((item) => (
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
                    {(item.sourceUrl.indexOf('xxxxx') !== -1 || item.sourceUrl.endsWith('/')) && (
                      <span className="verify-badge link-broken">链接失效</span>
                    )}
                  </div>
                  <div className="business-card-tags">
                    <span
                      className="business-category-tag"
                      style={{ background: categoryColors[item.category] || '#999' }}
                    >
                      {item.category}
                    </span>
                    <span className="business-type-tag">{item.type}</span>
                    {item.amount && (
                      <span className="business-amount">{item.amount}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="business-card-desc">{item.description}</p>
                  )}
                  <div className="business-card-meta">
                    <span>来源：{item.source}</span>
                    <span>发布日期：{item.publishDate}</span>
                    <span>最后核验：{item.lastChecked}</span>
                  </div>
                  <div className="business-card-tags-bottom">
                    {item.tags.map((tag) => (
                      <span key={tag} className="keyword-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="card-report-link">
                    <a href={`/business/${item.id}#feedback`} className="report-issue-link">报告问题</a>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="card-original-link">原始链接</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
