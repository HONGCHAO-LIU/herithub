'use client';

import { useMemo, useState } from 'react';
import conferencesData from '@/data/academic_conferences.json';
import papersData from '@/data/academic_papers.json';
import type { AcademicConference, AcademicPaper } from '@/types/index';
import { getCurrentLocale, t } from '@/lib/i18n';
import { uiDict } from '@/lib/dict';

const conferences = conferencesData as AcademicConference[];
const papers = papersData as AcademicPaper[];

type ArchiveTab = 'conferences' | 'papers';

export default function AcademicArchivePage() {
  const locale = getCurrentLocale();
  const [activeTab, setActiveTab] = useState<ArchiveTab>('conferences');

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const cutoff = threeMonthsAgo.toISOString().slice(0, 7);

  const archivedConferences = useMemo(() => {
    return conferences.filter((c) => {
      if (!c.crawledAt) return false;
      const itemMonth = c.crawledAt.slice(0, 7);
      return itemMonth < cutoff;
    });
  }, []);

  const archivedPapers = useMemo(() => {
    return papers.filter((p) => {
      if (!p.crawledAt) return false;
      const itemMonth = p.crawledAt.slice(0, 7);
      return itemMonth < cutoff;
    });
  }, []);

  const confGroups = useMemo(() => {
    const groups: Record<string, AcademicConference[]> = {};
    archivedConferences.forEach((c) => {
      const month = c.crawledAt.slice(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(c);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [archivedConferences]);

  const paperGroups = useMemo(() => {
    const groups: Record<string, AcademicPaper[]> = {};
    archivedPapers.forEach((p) => {
      const month = p.crawledAt.slice(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(p);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [archivedPapers]);

  const monthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return `${y}年${parseInt(m)}月`;
  };

  return (
    <div className="container">
      <section className="hero">
        <h2>{t('学术动态 · 历史归档', locale, uiDict)}</h2>
        <p>
          {locale === 'en'
            ? `Default display only includes entries collected within last 3 months (since ${cutoff}). Older data is archived here by month for historical lookup.`
            : `默认仅展示近三个月（${cutoff} 至今）采集的学术条目。更早数据按月归档于此页面，便于历史查询。`}
        </p>
      </section>

      <div className="archive-summary">
        <div className="archive-summary-card">
          <span className="archive-summary-num">{archivedConferences.length}</span>
          <span className="archive-summary-label">{t('已归档会议', locale, uiDict)}</span>
        </div>
        <div className="archive-summary-card">
          <span className="archive-summary-num">{archivedPapers.length}</span>
          <span className="archive-summary-label">{t('已归档论文', locale, uiDict)}</span>
        </div>
        <div className="archive-summary-card">
          <span className="archive-summary-num">{confGroups.length + paperGroups.length}</span>
          <span className="archive-summary-label">{t('归档月份', locale, uiDict)}</span>
        </div>
      </div>

      <div className="academic-tabs">
        <button
          className={`academic-tab ${activeTab === 'conferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('conferences')}
        >
          {t('会议归档', locale, uiDict)} ({archivedConferences.length})
        </button>
        <button
          className={`academic-tab ${activeTab === 'papers' ? 'active' : ''}`}
          onClick={() => setActiveTab('papers')}
        >
          {t('论文归档', locale, uiDict)} ({archivedPapers.length})
        </button>
      </div>

      {activeTab === 'conferences' && (
        confGroups.length === 0 ? (
          <div className="empty-state">{t('暂无会议归档数据。', locale, uiDict)}</div>
        ) : (
          confGroups.map(([month, items]) => (
            <section key={month} className="archive-month-section">
              <h3 className="archive-month-heading">{monthLabel(month)} ({items.length} {t('场', locale, uiDict)})</h3>
              <div className="conference-card-list">
                {items.map((conf) => (
                  <div key={conf.id} className="conference-card">
                    <div className="conference-card-header">
                      <h3 className="conference-card-title">
                        <a href={`/academic/conference/${conf.id}`}>{conf.name}</a>
                      </h3>
                    </div>
                    <div className="conference-card-info">
                      <div className="conference-info-row">
                        <span className="conference-label">{t('时间', locale, uiDict)}</span>
                        <span>{conf.date}</span>
                      </div>
                      <div className="conference-info-row">
                        <span className="conference-label">{t('地点', locale, uiDict)}</span>
                        <span>{conf.location}</span>
                      </div>
                      <div className="conference-info-row">
                        <span className="conference-label">{t('主办', locale, uiDict)}</span>
                        <span>{conf.organizer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )
      )}

      {activeTab === 'papers' && (
        paperGroups.length === 0 ? (
          <div className="empty-state">{t('暂无论文归档数据。', locale, uiDict)}</div>
        ) : (
          paperGroups.map(([month, items]) => (
            <section key={month} className="archive-month-section">
              <h3 className="archive-month-heading">{monthLabel(month)} ({items.length} {t('篇', locale, uiDict)})</h3>
              <div className="paper-card-list">
                {items.map((paper) => (
                  <div key={paper.id} className="paper-card">
                    <div className="paper-card-header">
                      <h3 className="paper-card-title">
                        <a href={`/academic/paper/${paper.id}`}>{paper.title}</a>
                      </h3>
                    </div>
                    <div className="paper-card-meta">
                      <span className="paper-authors">{paper.authors}</span>
                      <span className="paper-journal">{paper.journal}</span>
                      <span className="paper-date">{paper.publishDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )
      )}

      <div className="detail-back" style={{ marginTop: '2rem' }}>
        <a href="/academic" className="detail-back-link">{t('← 返回学术动态页面', locale, uiDict)}</a>
      </div>
    </div>
  );
}
