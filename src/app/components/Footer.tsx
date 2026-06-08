'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [updateTime, setUpdateTime] = useState('—');

  useEffect(() => {
    fetch('/last-update.json')
      .then(res => res.json())
      .then(data => { if (data?.formatted) setUpdateTime(data.formatted); })
      .catch(() => {});
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* 左: 版权 */}
        <div className="footer-section footer-section--copyright">
          <p>&copy; {new Date().getFullYear()} 智汇遗藏. 文化遗产领域一站式信息中枢.</p>
        </div>

        {/* 中: 内容标准 & 数据更新时间 */}
        <div className="footer-section footer-section--links">
          <a href="/about" className="footer-link">
            内容标准声明
          </a>
          <span className="footer-divider">|</span>
          <span className="footer-update">
            数据更新于 <time>{updateTime}</time>
          </span>
        </div>

        {/* 右: 报告问题 */}
        <div className="footer-section footer-section--report">
          <a href="mailto:heritage-feedback@example.com" className="footer-link footer-link--report">
            报告问题
          </a>
        </div>
      </div>
    </footer>
  );
}
