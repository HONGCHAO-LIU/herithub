'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import businessData from '@/data/business_intelligence.json';
import type { BusinessIntelligence } from '@/types/index';

const categoryLabels: Record<string, string> = {
  '文创开发': '文创开发',
  '文旅融合': '文旅融合',
  '文化遗产数字化': '文化遗产数字化',
  '专业服务': '专业服务',
  '教育培训': '教育培训',
  '内容与媒体': '内容与媒体',
  '投融资与资产化': '投融资与资产化',
};

const typeLabels: Record<string, string> = {
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

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const item = data.find((d) => d.id === id);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('链接失效');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!item) {
    return (
      <div className="container">
        <section className="hero">
          <h2>条目不存在</h2>
          <p>未找到 ID 为 {id} 的商业情报条目，该条目可能已被移除或归档。</p>
        </section>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="form-submit-btn" onClick={() => router.push('/business')}>
            返回商业情报列表
          </button>
        </div>
      </div>
    );
  }

  const linkDead = item.sourceUrl.indexOf('xxxxx') !== -1 || item.sourceUrl.endsWith('/');

  const handleSubmitFeedback = () => {
    setFeedbackSubmitted(true);
  };

  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav className="detail-breadcrumb">
        <a href="/" className="detail-breadcrumb-link">首页</a>
        <span className="detail-breadcrumb-sep">/</span>
        <a href="/business" className="detail-breadcrumb-link">商业情报</a>
        <span className="detail-breadcrumb-sep">/</span>
        <span className="detail-breadcrumb-current">{item.title.slice(0, 30)}...</span>
      </nav>

      {/* Detail Header */}
      <section className="detail-header">
        <div className="detail-title-row">
          <h1 className="detail-title">{item.title}</h1>
          <span className={`verify-badge ${item.verified ? 'verified' : 'unverified'}`}>
            {item.verified ? '已验证' : '待核实'}
          </span>
          {linkDead && (
            <span className="verify-badge link-broken">链接失效</span>
          )}
        </div>
        <div className="detail-tags">
          <span className="business-category-tag" style={{ background: categoryColors[item.category] || '#999' }}>
            {item.category}
          </span>
          <span className="business-type-tag">{item.type}</span>
          {item.amount && <span className="business-amount">{item.amount}</span>}
        </div>
      </section>

      {/* Detail Content */}
      <section className="detail-section">
        <h3 className="detail-section-title">基本信息</h3>
        <div className="detail-info-grid">
          <div className="detail-info-row">
            <span className="detail-info-label">类型</span>
            <span>{typeLabels[item.type] || item.type}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">领域</span>
            <span>{categoryLabels[item.category] || item.category}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">金额</span>
            <span className={item.amount ? 'detail-amount' : ''}>{item.amount || '未披露'}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">发布日期</span>
            <span>{item.publishDate}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">来源</span>
            <span>{item.source}</span>
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
          <div className="detail-info-row">
            <span className="detail-info-label">最后核验</span>
            <span>{item.lastChecked}</span>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="detail-section">
        <h3 className="detail-section-title">详细描述</h3>
        <div className="detail-description">
          <p>{item.description}</p>
        </div>
      </section>

      {/* Tags */}
      <section className="detail-section">
        <h3 className="detail-section-title">标签</h3>
        <div className="detail-tags-list">
          {item.tags.map((tag) => (
            <span key={tag} className="keyword-tag">{tag}</span>
          ))}
        </div>
      </section>

      {/* Verification Info */}
      <section className="detail-section detail-section--verify">
        <h3 className="detail-section-title">验证信息</h3>
        <div className="detail-verify-info">
          <div className="detail-verify-row">
            <span className={`verify-badge ${item.verified ? 'verified' : 'unverified'}`}>
              {item.verified ? '已人工核验' : '待人工核验'}
            </span>
          </div>
          <p className="detail-verify-note">
            最后核验日期：{item.lastChecked}。如发现信息有误或链接失效，请通过下方反馈入口提交修正。
          </p>
        </div>
      </section>

      {/* Feedback Form */}
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
                  <div className="form-field">
                    <label className="form-label">问题类型</label>
                    <select
                      className="form-input"
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                    >
                      <option value="链接失效">链接失效</option>
                      <option value="信息过时">信息过时</option>
                      <option value="内容错误">内容错误</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="form-field form-field--wide">
                    <label className="form-label">补充说明</label>
                    <textarea
                      className="form-input form-textarea"
                      rows={3}
                      placeholder="请描述具体问题或提供更新后的信息..."
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="form-submit-btn" onClick={handleSubmitFeedback}>
                      提交反馈
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Back Link */}
      <div className="detail-back">
        <a href="/business" className="detail-back-link">← 返回商业情报列表</a>
      </div>
    </div>
  );
}
