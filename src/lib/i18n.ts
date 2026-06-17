/**
 * 轻量国际化工具 (i18n.ts)
 *
 * 不引入 next-intl / react-i18next 等重型方案，
 * 基于字典的简单翻译 + URL/cookie 语言检测。
 */

export type Locale = 'zh' | 'en';

export const locales: Locale[] = ['zh', 'en'];

const COOKIE_KEY = 'herithub_lang';

/**
 * 从 URL path 或 cookie 获取当前语言
 * URL 优先，无 URL 语言段时回退到 cookie，再回退到 'zh'
 */
export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';

  // 1. URL path: /en/xxx 或 /en
  const pathMatch = window.location.pathname.match(/^\/(en|zh)(\/|$)/);
  if (pathMatch && pathMatch[1] === 'en') return 'en';

  // 2. Cookie
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
  if (match && match[1] === 'en') return 'en';

  return 'zh';
}

/**
 * 设置语言并持久化到 cookie
 */
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365; // 1 年
  document.cookie = `${COOKIE_KEY}=${locale};path=/;max-age=${maxAge};SameSite=Lax`;
}

/**
 * 简单的字典翻译函数
 * 从 dict 字典中查找 key 对应的翻译
 */
export function t(key: string, locale: Locale, dict: Record<string, Record<Locale, string>>): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[locale] ?? entry['zh'] ?? key;
}
