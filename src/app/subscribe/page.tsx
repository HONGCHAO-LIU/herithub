'use client';

import { useState, useEffect, useCallback } from 'react';

/* ---------- 类型 ---------- */
interface Subscription {
  id: number;
  email: string;
  keywords: string;
  categories: string[];
  notifyMethod: string;
  createdAt: string;
  active: boolean;
}

/* ---------- 组件 ---------- */
export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [keywords, setKeywords] = useState('');
  const [categories, setCategories] = useState<string[]>(['all']);
  const [notifyMethod, setNotifyMethod] = useState('email');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  /* 订阅管理 */
  const [queryEmail, setQueryEmail] = useState('');
  const [mySubscriptions, setMySubscriptions] = useState<Subscription[]>([]);
  const [manageMsg, setManageMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const categoryOptions = [
    { value: 'business', label: '商业情报' },
    { value: 'conference', label: '学术会议' },
    { value: 'paper', label: '论文成果' },
    { value: 'all', label: '全部' },
  ];

  const toggleCategory = (cat: string) => {
    if (cat === 'all') {
      setCategories(['all']);
      return;
    }
    let next = categories.filter((c) => c !== 'all');
    if (next.includes(cat)) {
      next = next.filter((c) => c !== cat);
    } else {
      next = [...next, cat];
    }
    if (next.length === 0) next = ['all'];
    setCategories(next);
  };

  /* 提交订阅 */
  const handleSubscribe = async () => {
    setError('');
    if (!email) { setError('请填写邮箱地址'); return; }
    if (!keywords) { setError('请填写订阅关键词'); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) { setError('请填写有效的邮箱地址'); return; }

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          keywords,
          categories: categories.includes('all') ? ['business', 'conference', 'paper'] : categories,
          notifyMethod,
        }),
      });
      if (!res.ok) throw new Error('提交失败');
      setSubmitted(true);
    } catch {
      setError('提交时发生错误，请稍后重试');
    }
  };

  /* 查询我的订阅 */
  const handleQuery = useCallback(async () => {
    setManageMsg('');
    if (!queryEmail) { setManageMsg('请填写邮箱地址'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions?email=${encodeURIComponent(queryEmail)}`);
      if (!res.ok) throw new Error('');
      const data: Subscription[] = await res.json();
      setMySubscriptions(data);
      if (data.length === 0) setManageMsg('未找到该邮箱的订阅记录');
    } catch {
      setManageMsg('查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [queryEmail]);

  /* 取消订阅 */
  const handleCancel = async (subId: number) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/cancel`, { method: 'PUT' });
      if (!res.ok) throw new Error('');
      handleQuery();
    } catch {
      setManageMsg('取消订阅失败，请稍后重试');
    }
  };

  return (
    <div className="subscribe-page">
      <div className="subscribe-header">
        <h1 className="page-title">订阅提醒</h1>
        <p className="subscribe-intro">
          设定您关注的关键词和类别，系统将在抓取到相关内容后自动发送邮件通知，让您第一时间掌握文化遗产领域最新动态。
        </p>
        <div className="subscribe-process">
          <span>设置关键词</span> &rarr; <span>系统自动匹配</span> &rarr; <span>邮件通知送达</span>
        </div>
      </div>

      {/* 订阅表单 */}
      <div className="subscribe-form">
        <h2 className="form-section-title">新建订阅</h2>

        {submitted && (
          <div className="notification-banner notification-banner--success">
            订阅成功！当系统抓取到匹配「{keywords}」的内容时，将发送通知至 {email}。
          </div>
        )}

        {error && (
          <div className="notification-banner notification-banner--error">{error}</div>
        )}

        <div className="form-section">
          <div className="form-field">
            <label className="form-label">邮箱地址 <span className="required">*</span></label>
            <input className="form-input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" />
          </div>

          <div className="form-field">
            <label className="form-label">订阅关键词 <span className="required">*</span></label>
            <input className="form-input" type="text" value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="如：长城、非遗数字化、莫高窟等多个关键词用逗号分隔" />
            <span className="form-hint">多个关键词用逗号分隔，系统将匹配标题中包含任一关键词的条目</span>
          </div>

          <div className="form-field">
            <label className="form-label">订阅类别</label>
            <div className="category-chips">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`category-chip${categories.includes(opt.value) ? ' active' : ''}`}
                  onClick={() => toggleCategory(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">通知方式</label>
            <div className="notify-options">
              <label className="notify-option">
                <input type="radio" name="notifyMethod" value="email"
                  checked={notifyMethod === 'email'}
                  onChange={() => setNotifyMethod('email')} />
                <span>邮件通知</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button className="form-submit-btn" onClick={handleSubscribe}>订阅</button>
          </div>
        </div>
      </div>

      {/* 订阅管理 */}
      <div className="subscribe-form subscribe-manage">
        <h2 className="form-section-title">订阅管理</h2>
        <p className="subscribe-intro" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          输入您的邮箱地址，查看或取消已有的订阅。
        </p>

        <div className="form-field" style={{ marginBottom: '0.5rem' }}>
          <input className="form-input" type="email" value={queryEmail}
            onChange={(e) => setQueryEmail(e.target.value)}
            placeholder="请输入您的邮箱地址"
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()} />
        </div>
        <div className="form-actions" style={{ marginBottom: '1rem' }}>
          <button className="form-submit-btn" onClick={handleQuery} disabled={loading}>
            {loading ? '查询中...' : '查询'}
          </button>
        </div>

        {manageMsg && (
          <div className="notification-banner notification-banner--info">{manageMsg}</div>
        )}

        {mySubscriptions.length > 0 && (
          <div className="sub-list">
            {mySubscriptions.map((sub) => (
              <div key={sub.id} className={`sub-item${!sub.active ? ' sub-item--inactive' : ''}`}>
                <div className="sub-item-body">
                  <div className="sub-item-keywords">
                    <strong>{sub.keywords}</strong>
                    {!sub.active && <span className="sub-status">已取消</span>}
                  </div>
                  <div className="sub-item-meta">
                    <span>类别：{sub.categories.join(' / ')}</span>
                    <span>创建时间：{sub.createdAt?.slice(0, 10)}</span>
                  </div>
                </div>
                {sub.active && (
                  <button className="sub-cancel-btn" onClick={() => handleCancel(sub.id)}>
                    取消订阅
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
