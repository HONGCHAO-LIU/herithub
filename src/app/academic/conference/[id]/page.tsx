'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import conferencesData from '@/data/academic_conferences.json';
import type { AcademicConference } from '@/types/index';

const data = conferencesData as AcademicConference[];

export default function ConferenceDetailPage() {
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
          <h2>会议不存在</h2>
          <p>未找到 ID 为 {id} 的学术会议，该条目可能已被移除或归档。</p>
        </section>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="form-submit-btn" onClick={() => router.push('/academic')}>
            返回学术动态列表
          </button>
        </div>
      </div>
    );
  }

  const linkDead = item.sourceUrl.indexOf('xxxxx') !== -1 || item.sourceUrl.endsWith('/');

  return (
    <div className="container">
      <nav className="detail-breadcrumb">
        <a href="/" className="detail-breadcrumb-link">首页</a>
        <span className="detail-breadcrumb-sep">/</span>
        <a href="/academic" className="detail-breadcrumb-link">学术动态</a>
        <span className="detail-breadcrumb-sep">/</span>
        <span className="detail-breadcrumb-current">{item.name.slice(0, 30)}...</span>
      </nav>

      <section className="detail-header">
        <div className="detail-title-row">
          <h1 className="detail-title">{item.name}</h1>
          <span className={`verify-badge ${item.verified ? 'verified' : 'unverified'}`}>
            {item.verified ? '已验证' : '待核实'}
          </span>
          {linkDead && <span className="verify-badge link-broken">链接失效</span>}
        </div>
      </section>

      <section className="detail-section">
        <h3 className="detail-section-title">会议信息</h3>
        <div className="detail-info-grid">
          <div className="detail-info-row">
            <span className="detail-info-label">日期</span>
            <span>{item.date}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">地点</span>
            <span>{item.location}</span>
          </div>
          {item.deadline && (
            <div className="detail-info-row">
              <span className="detail-info-label">投稿截止</span>
              <span className="deadline-highlight">{item.deadline}</span>
            </div>
          )}
          <div className="detail-info-row">
            <span className="detail-info-label">主办方</span>
            <span>{item.organizer}</span>
          </div>
          {item.website && (
            <div className="detail-info-row">
              <span className="detail-info-label">官方网站</span>
              <span className={linkDead ? 'link-dead' : ''}>
                <a href={item.website} target="_blank" rel="noopener noreferrer" className="detail-link">
                  {item.website}
                </a>
                {linkDead && <span className="link-dead-tag">（链接可能已失效）</span>}
              </span>
            </div>
          )}
          <div className="detail-info-row">
            <span className="detail-info-label">原始链接</span>
            <span className={linkDead ? 'link-dead' : ''}>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="detail-link">
                {item.sourceUrl}
              </a>
            </span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">采集时间</span>
            <span>{item.crawledAt}</span>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3 className="detail-section-title">会议简介</h3>
        <div className="detail-description">
          <p>{item.description}</p>
        </div>
      </section>

      <section className="detail-section">
        <h3 className="detail-section-title">标签</h3>
        <div className="detail-tags-list">
          {item.tags.map((tag) => (
            <span key={tag} className="keyword-tag">{tag}</span>
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
            采集于 {item.crawledAt}。如发现会议信息有误或链接失效，请通过下方反馈入口提交修正。
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
