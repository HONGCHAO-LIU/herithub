'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import papersData from '@/data/academic_papers.json';
import type { AcademicPaper } from '@/types/index';

const data = papersData as AcademicPaper[];

export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const item = data.find((d) => d.id === id);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!item) {
    return (
      <div className="container">
        <section className="hero">
          <h2>论文不存在</h2>
          <p>未找到 ID 为 {id} 的论文，该条目可能已被移除或归档。</p>
        </section>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="form-submit-btn" onClick={() => router.push('/academic')}>
            返回学术动态列表
          </button>
        </div>
      </div>
    );
  }

  const linkDead = item.sourceUrl.indexOf('xxxxx') !== -1 || item.sourceUrl.startsWith('https://www.wenwu.gov.cn/');

  return (
    <div className="container">
      <nav className="detail-breadcrumb">
        <a href="/" className="detail-breadcrumb-link">首页</a>
        <span className="detail-breadcrumb-sep">/</span>
        <a href="/academic" className="detail-breadcrumb-link">学术动态</a>
        <span className="detail-breadcrumb-sep">/</span>
        <span className="detail-breadcrumb-current">{item.title.slice(0, 30)}...</span>
      </nav>

      <section className="detail-header">
        <div className="detail-title-row">
          <h1 className="detail-title">{item.title}</h1>
          <span className={`verify-badge ${item.verified ? 'verified' : 'unverified'}`}>
            {item.verified ? '已验证' : '待核实'}
          </span>
          {linkDead && <span className="verify-badge link-broken">链接失效</span>}
        </div>
      </section>

      <section className="detail-section">
        <h3 className="detail-section-title">论文信息</h3>
        <div className="detail-info-grid">
          <div className="detail-info-row">
            <span className="detail-info-label">作者</span>
            <span className="detail-authors">{item.authors}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">期刊</span>
            <span className="detail-journal">{item.journal}</span>
          </div>
          {item.doi && (
            <div className="detail-info-row">
              <span className="detail-info-label">DOI</span>
              <span className="detail-doi">
                <a href={`https://doi.org/${item.doi}`} target="_blank" rel="noopener noreferrer" className="detail-link">
                  {item.doi}
                </a>
              </span>
            </div>
          )}
          <div className="detail-info-row">
            <span className="detail-info-label">发布日期</span>
            <span>{item.publishDate}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">原始链接</span>
            <span className={linkDead ? 'link-dead' : ''}>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="detail-link">
                {item.sourceUrl}
              </a>
              {linkDead && <span className="link-dead-tag">（链接可能已失效）</span>}
            </span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">采集时间</span>
            <span>{item.crawledAt}</span>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3 className="detail-section-title">摘要</h3>
        <div className="detail-description">
          <p>{item.abstract}</p>
        </div>
      </section>

      <section className="detail-section">
        <h3 className="detail-section-title">关键词</h3>
        <div className="detail-tags-list">
          {item.keywords.map((kw) => (
            <span key={kw} className="keyword-tag">{kw}</span>
          ))}
        </div>
      </section>

      <section className="detail-section detail-section--verify">
        <h3 className="detail-section-title">验证信息</h3>
        <div className="detail-verify-info">
          <div className="detail-verify-row">
            <span className={`verify-badge ${item.verified ? 'verified' : 'unverified'}`}>
              {item.verified ? '已人工核验' : '待人工核验'}
            </span>
          </div>
          <p className="detail-verify-note">
            采集于 {item.crawledAt}。如发现论文信息有误、链接失效或DOI不可访问，请通过下方反馈入口提交修正。
          </p>
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-feedback">
          <button
            className="detail-feedback-toggle"
            onClick={() => setFeedbackOpen(!feedbackOpen)}
          >
            报告问题 / 更新链接
          </button>
          {feedbackOpen && (
            <div className="detail-feedback-form">
              {feedbackSubmitted ? (
                <div className="notification-banner notification-banner--success">
                  感谢反馈！我们会尽快核实并处理。
                </div>
              ) : (
                <>
                  <div className="form-field form-field--wide">
                    <label className="form-label">补充说明</label>
                    <textarea
                      className="form-input form-textarea"
                      rows={3}
                      placeholder="请描述具体问题或提供更新后的信息..."
                    />
                  </div>
                  <div className="form-actions">
                    <button className="form-submit-btn" onClick={() => setFeedbackSubmitted(true)}>
                      提交反馈
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="detail-back">
        <a href="/academic" className="detail-back-link">← 返回学术动态列表</a>
      </div>
    </div>
  );
}
