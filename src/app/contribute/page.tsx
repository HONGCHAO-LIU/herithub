'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

/* ---------- Tab 类型 ---------- */
type TabKey = 'institution' | 'conference' | 'paper';

/* ---------- 表单初始值 ---------- */
const INIT_INSTITUTION = {
  name: '',
  category: '',
  website: '',
  description: '',
  source: '',
  region: '',
  contact: '',
  email: '',
  infoLink: '',
};

const INIT_CONFERENCE = {
  name: '',
  date: '',
  location: '',
  deadline: '',
  website: '',
  organizer: '',
  tags: '',
  email: '',
  infoLink: '',
};

const INIT_PAPER = {
  title: '',
  authors: '',
  journal: '',
  doi: '',
  publishDate: '',
  abstract: '',
  keywords: '',
  email: '',
  infoLink: '',
};

/* ---------- 组件 ---------- */
export default function ContributePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('institution');
  const [institution, setInstitution] = useState(INIT_INSTITUTION);
  const [conference, setConference] = useState(INIT_CONFERENCE);
  const [paper, setPaper] = useState(INIT_PAPER);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  /* 通用字段变更 */
  const updateField = <T extends Record<string, string>>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    field: keyof T,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [field]: value }));
  };

  /* 提交处理 */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const current = activeTab === 'institution' ? institution : activeTab === 'conference' ? conference : paper;
    const email = activeTab === 'institution' ? institution.email : activeTab === 'conference' ? conference.email : paper.email;
    const infoLink = activeTab === 'institution' ? institution.infoLink : activeTab === 'conference' ? conference.infoLink : paper.infoLink;

    if (!email) {
      setError('请填写提交者邮箱');
      return;
    }
    if (!infoLink) {
      setError('请填写信息来源链接');
      return;
    }

    // 必填项检查
    if (activeTab === 'institution' && !institution.name) {
      setError('请填写机构名称');
      return;
    }
    if (activeTab === 'conference' && !conference.name) {
      setError('请填写会议名称');
      return;
    }
    if (activeTab === 'paper' && !paper.title) {
      setError('请填写论文标题');
      return;
    }

    const submission = {
      type: activeTab,
      submittedAt: new Date().toISOString(),
      reviewerEmail: email,
      infoSourceLink: infoLink,
      status: 'pending',
      data: current,
    };

    try {
      const res = await fetch('/api/user-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      if (!res.ok) throw new Error('提交失败');

      setSubmitted(true);
      if (activeTab === 'institution') setInstitution(INIT_INSTITUTION);
      else if (activeTab === 'conference') setConference(INIT_CONFERENCE);
      else setPaper(INIT_PAPER);
    } catch (err) {
      setError('提交时发生错误，请稍后重试');
    }
  };

  const tabConfig: { key: TabKey; label: string }[] = [
    { key: 'institution', label: '提交机构' },
    { key: 'conference', label: '提交会议' },
    { key: 'paper', label: '提交论文' },
  ];

  return (
    <div className="contribute-page">
      {/* 顶部说明 */}
      <div className="contribute-header">
        <h1 className="page-title">用户贡献</h1>
        <div className="contribute-workflow">
          <div className="workflow-step">
            <span className="workflow-num">1</span>
            <span className="workflow-label">提交信息</span>
          </div>
          <span className="workflow-arrow">&rarr;</span>
          <div className="workflow-step">
            <span className="workflow-num">2</span>
            <span className="workflow-label">人工审核</span>
          </div>
          <span className="workflow-arrow">&rarr;</span>
          <div className="workflow-step">
            <span className="workflow-num">3</span>
            <span className="workflow-label">补充入库</span>
          </div>
        </div>
        <p className="contribute-intro">
          感谢您为「智汇遗藏」贡献信息。提交后将由审核人员核实并补充至数据库。请您确保信息准确、来源可查。
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="tab-form-tabs">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            className={`tab-form-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => { setActiveTab(tab.key); setSubmitted(false); setError(''); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 表单区域 */}
      <div className="contribute-form">
        {submitted && (
          <div className="notification-banner notification-banner--success">
            提交成功！感谢您的贡献，审核人员将在 3-5 个工作日内处理。
          </div>
        )}

        {error && (
          <div className="notification-banner notification-banner--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ========== 机构表单 ========== */}
          {activeTab === 'institution' && (
            <div className="form-section">
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">机构名称 <span className="required">*</span></label>
                  <input className="form-input" type="text" value={institution.name}
                    onChange={(e) => updateField(setInstitution, 'name', e.target.value)}
                    placeholder="请输入机构全称" />
                </div>
                <div className="form-field">
                  <label className="form-label">类别</label>
                  <select className="form-input" value={institution.category}
                    onChange={(e) => updateField(setInstitution, 'category', e.target.value)}>
                    <option value="">请选择类别</option>
                    <option value="世界遗产">世界遗产</option>
                    <option value="非物质文化遗产">非物质文化遗产</option>
                    <option value="博物馆">博物馆</option>
                    <option value="文保单位">文物保护单位</option>
                    <option value="研究机构">研究机构</option>
                    <option value="商业机构">商业机构</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">网址</label>
                  <input className="form-input" type="url" value={institution.website}
                    onChange={(e) => updateField(setInstitution, 'website', e.target.value)}
                    placeholder="https://" />
                </div>
                <div className="form-field">
                  <label className="form-label">地区</label>
                  <input className="form-input" type="text" value={institution.region}
                    onChange={(e) => updateField(setInstitution, 'region', e.target.value)}
                    placeholder="如：北京 / 陕西·西安" />
                </div>
                <div className="form-field">
                  <label className="form-label">来源</label>
                  <input className="form-input" type="text" value={institution.source}
                    onChange={(e) => updateField(setInstitution, 'source', e.target.value)}
                    placeholder="如：国家文物局官网" />
                </div>
                <div className="form-field">
                  <label className="form-label">联系方式</label>
                  <input className="form-input" type="text" value={institution.contact}
                    onChange={(e) => updateField(setInstitution, 'contact', e.target.value)}
                    placeholder="电话 / 邮箱 / 地址" />
                </div>
                <div className="form-field form-field--wide">
                  <label className="form-label">描述</label>
                  <textarea className="form-input form-textarea" value={institution.description}
                    onChange={(e) => updateField(setInstitution, 'description', e.target.value)}
                    placeholder="请简要描述该机构的基本情况、业务范围或研究方向"
                    rows={3} />
                </div>
              </div>
            </div>
          )}

          {/* ========== 会议表单 ========== */}
          {activeTab === 'conference' && (
            <div className="form-section">
              <div className="form-grid">
                <div className="form-field form-field--wide">
                  <label className="form-label">会议名称 <span className="required">*</span></label>
                  <input className="form-input" type="text" value={conference.name}
                    onChange={(e) => updateField(setConference, 'name', e.target.value)}
                    placeholder="请输入会议全称" />
                </div>
                <div className="form-field">
                  <label className="form-label">时间</label>
                  <input className="form-input" type="text" value={conference.date}
                    onChange={(e) => updateField(setConference, 'date', e.target.value)}
                    placeholder="如：2026-09-15 ~ 2026-09-18" />
                </div>
                <div className="form-field">
                  <label className="form-label">地点</label>
                  <input className="form-input" type="text" value={conference.location}
                    onChange={(e) => updateField(setConference, 'location', e.target.value)}
                    placeholder="如：北京·清华大学" />
                </div>
                <div className="form-field">
                  <label className="form-label">投稿截止日期</label>
                  <input className="form-input" type="text" value={conference.deadline}
                    onChange={(e) => updateField(setConference, 'deadline', e.target.value)}
                    placeholder="如：2026-06-30" />
                </div>
                <div className="form-field">
                  <label className="form-label">官网链接</label>
                  <input className="form-input" type="url" value={conference.website}
                    onChange={(e) => updateField(setConference, 'website', e.target.value)}
                    placeholder="https://" />
                </div>
                <div className="form-field">
                  <label className="form-label">主办方</label>
                  <input className="form-input" type="text" value={conference.organizer}
                    onChange={(e) => updateField(setConference, 'organizer', e.target.value)}
                    placeholder="请输入主办方全称" />
                </div>
                <div className="form-field form-field--wide">
                  <label className="form-label">标签</label>
                  <input className="form-input" type="text" value={conference.tags}
                    onChange={(e) => updateField(setConference, 'tags', e.target.value)}
                    placeholder="多个标签用逗号分隔，如：文化遗产, 数字化, 国际会议" />
                </div>
              </div>
            </div>
          )}

          {/* ========== 论文表单 ========== */}
          {activeTab === 'paper' && (
            <div className="form-section">
              <div className="form-grid">
                <div className="form-field form-field--wide">
                  <label className="form-label">标题 <span className="required">*</span></label>
                  <input className="form-input" type="text" value={paper.title}
                    onChange={(e) => updateField(setPaper, 'title', e.target.value)}
                    placeholder="请输入论文完整标题" />
                </div>
                <div className="form-field">
                  <label className="form-label">作者</label>
                  <input className="form-input" type="text" value={paper.authors}
                    onChange={(e) => updateField(setPaper, 'authors', e.target.value)}
                    placeholder="多个作者用逗号分隔" />
                </div>
                <div className="form-field">
                  <label className="form-label">期刊</label>
                  <input className="form-input" type="text" value={paper.journal}
                    onChange={(e) => updateField(setPaper, 'journal', e.target.value)}
                    placeholder="如：Journal of Cultural Heritage" />
                </div>
                <div className="form-field">
                  <label className="form-label">DOI</label>
                  <input className="form-input" type="text" value={paper.doi}
                    onChange={(e) => updateField(setPaper, 'doi', e.target.value)}
                    placeholder="如：10.1016/j.culher.2025.12.003" />
                </div>
                <div className="form-field">
                  <label className="form-label">发布日期</label>
                  <input className="form-input" type="text" value={paper.publishDate}
                    onChange={(e) => updateField(setPaper, 'publishDate', e.target.value)}
                    placeholder="YYYY-MM-DD" />
                </div>
                <div className="form-field form-field--wide">
                  <label className="form-label">关键词</label>
                  <input className="form-input" type="text" value={paper.keywords}
                    onChange={(e) => updateField(setPaper, 'keywords', e.target.value)}
                    placeholder="多个关键词用逗号分隔" />
                </div>
                <div className="form-field form-field--wide">
                  <label className="form-label">摘要</label>
                  <textarea className="form-input form-textarea" value={paper.abstract}
                    onChange={(e) => updateField(setPaper, 'abstract', e.target.value)}
                    placeholder="请输入论文摘要"
                    rows={4} />
                </div>
              </div>
            </div>
          )}

          {/* ========== 公共必填：邮箱 + 信息来源 ========== */}
          <div className="form-divider">
            <span>提交者信息</span>
          </div>

          <div className="form-grid form-grid--meta">
            <div className="form-field">
              <label className="form-label">提交者邮箱 <span className="required">*</span></label>
              <input className="form-input" type="email"
                value={
                  activeTab === 'institution' ? institution.email :
                  activeTab === 'conference' ? conference.email :
                  paper.email
                }
                onChange={(e) => {
                  if (activeTab === 'institution') updateField(setInstitution, 'email', e.target.value);
                  else if (activeTab === 'conference') updateField(setConference, 'email', e.target.value);
                  else updateField(setPaper, 'email', e.target.value);
                }}
                placeholder="your@email.com" />
            </div>
            <div className="form-field">
              <label className="form-label">信息来源链接 <span className="required">*</span></label>
              <input className="form-input" type="url"
                value={
                  activeTab === 'institution' ? institution.infoLink :
                  activeTab === 'conference' ? conference.infoLink :
                  paper.infoLink
                }
                onChange={(e) => {
                  if (activeTab === 'institution') updateField(setInstitution, 'infoLink', e.target.value);
                  else if (activeTab === 'conference') updateField(setConference, 'infoLink', e.target.value);
                  else updateField(setPaper, 'infoLink', e.target.value);
                }}
                placeholder="https://" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="form-submit-btn">提交</button>
          </div>
        </form>
      </div>
    </div>
  );
}
