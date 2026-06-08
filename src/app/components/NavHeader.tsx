'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/heritage', label: '机构名录' },
  { href: '/business', label: '商业情报' },
  { href: '/academic', label: '学术动态' },
  { href: '/business/archive', label: '情报归档' },
  { href: '/academic/archive', label: '学术归档' },
  { href: '/creators', label: '创作者' },
  { href: '/forum', label: '论坛' },
  { href: '/about', label: '关于' },
];

export default function NavHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="brand-name">智汇遗藏</span>
          <span className="brand-subtitle">herithub · 文化遗产领域一站式信息中枢</span>
        </div>

        <nav className="header-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile nav overlay */}
      <div
        className={`mobile-nav-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        <nav className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
