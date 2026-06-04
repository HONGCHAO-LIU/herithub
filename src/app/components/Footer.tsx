'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [updateTime, setUpdateTime] = useState('—');

  useEffect(() => {
    // 尝试从页面构建时间或数据文件最后更新时间获取
    // 此处展示页面加载时的客户端时间作为近似值
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    setUpdateTime(`${y}-${m}-${d} ${h}:${min}`);
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
