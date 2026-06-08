'use client';

import { useEffect, useRef } from 'react';

export default function ForumPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'HONGCHAO-LIU/herithub');
    script.setAttribute('data-repo-id', 'R_kgDOSfLlZw');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOSfLlZ84C-j5Y');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current && script.parentNode) {
        containerRef.current.removeChild(script);
      }
    };
  }, []);

  return (
    <main>
      <div className="container">
        <div className="forum-container">
          <div className="forum-header">
            <h1>交流论坛</h1>
            <p>欢迎交流讨论文化遗产相关话题</p>
          </div>
          <div ref={containerRef} className="giscus" />
        </div>
      </div>
    </main>
  );
}
