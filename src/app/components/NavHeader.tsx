'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentLocale, setLocale, t, type Locale } from '@/lib/i18n';
import { uiDict } from '@/lib/dict';

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/heritage', label: '机构名录' },
  { href: '/business', label: '商业情报' },
  { href: '/academic', label: '学术动态' },
  { href: '/business/archive', label: '情报归档' },
  { href: '/academic/archive', label: '学术归档' },
  { href: '/creators', label: '创作者' },
  { href: '/forum', label: '论坛' },
  { href: '/dashboard', label: '数据看板' },
  { href: '/about', label: '关于' },
];

interface SearchResult {
  id: string;
  title: string;
  type: string;
  url: string;
  description: string;
  date: string;
}

const TYPE_LABELS: Record<string, string> = {
  heritage: '机构名录',
  conference: '学术会议',
  paper: '学术论文',
  business: '商业情报',
};

export default function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [locale, setLocaleState] = useState<Locale>('zh');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocaleState(getCurrentLocale());
  }, []);

  const toggleLang = () => {
    const next: Locale = locale === 'zh' ? 'en' : 'zh';
    setLocale(next);
    setLocaleState(next);
    window.location.reload();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // 实时搜索 (300ms debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        setResults(data.results || []);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // 键盘操作
  useEffect(() => {
    if (!searchOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSearch();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        router.push(results[activeIndex].url);
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen, results, activeIndex, closeSearch, router]);

  // 分组
  const grouped = results.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  const groupOrder = ['heritage', 'conference', 'paper', 'business'];

  return (
    <>
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

          <div className="header-actions">
            <button
              className="lang-switch-btn"
              onClick={toggleLang}
              aria-label="语言切换"
              title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
            >
              {locale === 'zh' ? '中/EN' : 'EN/中'}
            </button>

            <button
              className="search-btn"
              onClick={openSearch}
              aria-label="搜索"
              title="全文搜索"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

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

      {/* 搜索模态框 */}
      {searchOpen && (
        <div className="search-overlay" onClick={closeSearch}>
          <div className="search-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="search-input-wrapper">
              <svg
                className="search-input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="搜索机构、会议、论文、情报..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button className="search-close-btn" onClick={closeSearch} aria-label="关闭">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="search-results">
              {loading && <div className="search-loading">搜索中...</div>}

              {!loading && query.trim() && results.length === 0 && (
                <div className="search-empty">未找到相关结果</div>
              )}

              {!loading &&
                groupOrder
                  .filter((type) => grouped[type] && grouped[type].length > 0)
                  .map((type) => (
                    <div key={type} className="search-group">
                      <div className="search-group-header">{TYPE_LABELS[type] || type}</div>
                      {grouped[type].slice(0, 5).map((item, idx) => {
                        const globalIdx = results.indexOf(item);
                        return (
                          <div
                            key={item.id}
                            className={`search-result-item ${globalIdx === activeIndex ? 'active' : ''}`}
                            onClick={() => {
                              router.push(item.url);
                              closeSearch();
                            }}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                          >
                            <div className="search-result-title">{item.title}</div>
                            <div className="search-result-meta">
                              {item.description.slice(0, 80)}
                              {item.description.length > 80 ? '...' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
            </div>

            <div className="search-footer">
              <kbd>&uarr; &darr;</kbd> 选择 &nbsp; <kbd>Enter</kbd> 跳转 &nbsp; <kbd>Esc</kbd> 关闭
            </div>
          </div>
        </div>
      )}
    </>
  );
}
