'use client';

import { useState, useMemo } from 'react';
import conferencesData from '@/data/academic_conferences.json';
import papersData from '@/data/academic_papers.json';
import type { AcademicConference, AcademicPaper } from '@/types/index';

const conferences = conferencesData as AcademicConference[];
const papers = papersData as AcademicPaper[];

type TabKey = 'conferences' | 'papers';

export default function AcademicPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('conferences');
  const [search, setSearch] = useState('');

  // Conference filters
  const [confYear, setConfYear] = useState<string>('');
  const [confTag, setConfTag] = useState<string>('');

  // Paper filters
  const [paperJournal, setPaperJournal] = useState<string>('');
  const [paperKeyword, setPaperKeyword] = useState<string>('');
  const [paperYear, setPaperYear] = useState<string>('');

  const filteredConferences = useMemo(() => {
    let result = conferences;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.organizer.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (confYear) {
      result = result.filter((c) => c.date.includes(confYear));
    }
    if (confTag) {
      result = result.filter((c) => c.tags.includes(confTag));
    }
    return result;
  }, [search, confYear, confTag]);

  const filteredPapers = useMemo(() => {
    let result = papers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.journal.toLowerCase().includes(q) ||
          p.abstract.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    if (paperJournal) {
      result = result.filter((p) => p.journal === paperJournal);
    }
    if (paperKeyword) {
      result = result.filter((p) => p.keywords.includes(paperKeyword));
    }
    if (paperYear) {
      result = result.filter((p) => p.publishDate.startsWith(paperYear));
    }
    return result;
  }, [search, paperJournal, paperKeyword, paperYear]);

  // Derived filter options
  const allConfYears = useMemo(() => {
    const years = new Set<string>();
    conferences.forEach((c) => {
      const m = c.date.match(/(\d{4})/);
      if (m) years.add(m[1]);
    });
    return Array.from(years).sort().reverse();
  }, []);

  const allConfTags = useMemo(() => {
    const tags = new Set<string>();
    conferences.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  const allJournals = useMemo(() => {
    const j = new Set<string>();
    papers.forEach((p) => j.add(p.journal));
    return Array.from(j).sort();
  }, []);

  const allPaperKeywords = useMemo(() => {
    const k = new Set<string>();
    papers.forEach((p) => p.keywords.forEach((kw) => k.add(kw)));
    return Array.from(k).sort();
  }, []);

  const allPaperYears = useMemo(() => {
    const y = new Set<string>();
    papers.forEach((p) => y.add(p.publishDate.slice(0, 4)));
    return Array.from(y).sort().reverse();
  }, []);

  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <h2>学术动态</h2>
        <p>
          跟踪文化遗产领域重要学术会议与最新研究成果，涵盖考古学、博物馆学、文物保护科学、数字遗产等方向。
        </p>
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索会议名称、论文标题、作者、关键词..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>清除</button>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="academic-tabs">
        <button
          className={`academic-tab ${activeTab === 'conferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('conferences')}
        >
          学术会议 ({filteredConferences.length})
        </button>
        <button
          className={`academic-tab ${activeTab === 'papers' ? 'active' : ''}`}
          onClick={() => setActiveTab('papers')}
        >
          论文成果 ({filteredPapers.length})
        </button>
      </div>

      {/* Conference Filters */}
      {activeTab === 'conferences' && (
        <div className="academic-filters">
          <select
            className="form-input academic-filter-select"
            value={confYear}
            onChange={(e) => setConfYear(e.target.value)}
          >
            <option value="">全部年份</option>
            {allConfYears.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            className="form-input academic-filter-select"
            value={confTag}
            onChange={(e) => setConfTag(e.target.value)}
          >
            <option value="">全部标签</option>
            {allConfTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {(confYear || confTag) && (
            <button
              className="filter-clear-btn"
              onClick={() => { setConfYear(''); setConfTag(''); }}
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* Paper Filters */}
      {activeTab === 'papers' && (
        <div className="academic-filters">
          <select
            className="form-input academic-filter-select"
            value={paperJournal}
            onChange={(e) => setPaperJournal(e.target.value)}
          >
            <option value="">全部期刊</option>
            {allJournals.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          <select
            className="form-input academic-filter-select"
            value={paperKeyword}
            onChange={(e) => setPaperKeyword(e.target.value)}
          >
            <option value="">全部关键词</option>
            {allPaperKeywords.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            className="form-input academic-filter-select"
            value={paperYear}
            onChange={(e) => setPaperYear(e.target.value)}
          >
            <option value="">全部年份</option>
            {allPaperYears.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          {(paperJournal || paperKeyword || paperYear) && (
            <button
              className="filter-clear-btn"
              onClick={() => { setPaperJournal(''); setPaperKeyword(''); setPaperYear(''); }}
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* Conference Tab Content */}
      {activeTab === 'conferences' && (
        <section className="content-area">
          <div className="items-header">
            <h2>
              学术会议 <span className="count">({filteredConferences.length} 场)</span>
            </h2>
          </div>
          {filteredConferences.length === 0 ? (
            <div className="empty-state">未找到匹配的会议，请调整搜索条件。</div>
          ) : (
            <div className="conference-card-list">
              {filteredConferences.map((conf) => (
                <div key={conf.id} className="conference-card">
                  <div className="conference-card-header">
                    <h3 className="conference-card-title">
                      {conf.website ? (
                        <a href={conf.website} target="_blank" rel="noopener noreferrer">
                          {conf.name}
                        </a>
                      ) : (
                        conf.name
                      )}
                    </h3>
                    <span className={`verify-badge ${conf.verified ? 'verified' : 'unverified'}`}>
                      {conf.verified ? '已验证' : '待核实'}
                    </span>
                  </div>
                  <div className="conference-card-info">
                    <div className="conference-info-row">
                      <span className="conference-label">时间</span>
                      <span>{conf.date}</span>
                    </div>
                    <div className="conference-info-row">
                      <span className="conference-label">地点</span>
                      <span>{conf.location}</span>
                    </div>
                    {conf.deadline && (
                      <div className="conference-info-row">
                        <span className="conference-label">投稿截止</span>
                        <span className="deadline-highlight">{conf.deadline}</span>
                      </div>
                    )}
                    <div className="conference-info-row">
                      <span className="conference-label">主办</span>
                      <span>{conf.organizer}</span>
                    </div>
                    {conf.description && (
                      <p className="conference-card-desc">{conf.description}</p>
                    )}
                  </div>
                  <div className="conference-card-tags">
                    {conf.tags.map((tag) => (
                      <span key={tag} className="keyword-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Papers Tab Content */}
      {activeTab === 'papers' && (
        <section className="content-area">
          <div className="items-header">
            <h2>
              论文成果 <span className="count">({filteredPapers.length} 篇)</span>
            </h2>
          </div>
          {filteredPapers.length === 0 ? (
            <div className="empty-state">未找到匹配的论文，请调整搜索条件。</div>
          ) : (
            <div className="paper-card-list">
              {filteredPapers.map((paper) => (
                <div key={paper.id} className="paper-card">
                  <div className="paper-card-header">
                    <h3 className="paper-card-title">
                      <a href={`/academic/paper/${paper.id}`}>
                        {paper.title}
                      </a>
                    </h3>
                    <span className={`verify-badge ${paper.verified ? 'verified' : 'unverified'}`}>
                      {paper.verified ? '已验证' : '待核实'}
                    </span>
                    {(paper.sourceUrl.indexOf('xxxxx') !== -1 || paper.sourceUrl.startsWith('https://www.wenwu.gov.cn/')) && (
                      <span className="verify-badge link-broken">链接失效</span>
                    )}
                  </div>
                  <div className="paper-card-meta">
                    <span className="paper-authors">{paper.authors}</span>
                    <span className="paper-journal">{paper.journal}</span>
                    {paper.doi && <span className="paper-doi">DOI: {paper.doi}</span>}
                    <span className="paper-date">{paper.publishDate}</span>
                  </div>
                  {paper.abstract && (
                    <p className="paper-card-abstract">{paper.abstract}</p>
                  )}
                  <div className="paper-card-keywords">
                    {paper.keywords.map((kw) => (
                      <span key={kw} className="keyword-tag">{kw}</span>
                    ))}
                  </div>
                  <div className="card-report-link">
                    <a href={`/academic/paper/${paper.id}#feedback`} className="report-issue-link">报告问题</a>
                    <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer" className="card-original-link">原始链接</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
