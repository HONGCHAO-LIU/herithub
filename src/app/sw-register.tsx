'use client';

import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // 监听 SW 更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              !refreshing
            ) {
              refreshing = true;
              // 提示用户刷新以获取新版本
              const confirmed = window.confirm(
                '网站已更新，是否刷新页面获取最新版本？'
              );
              if (confirmed) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(() => {
        // 注册失败静默处理
      });

    // 页面可见时检查 SW 更新
    let visibilityTimer: ReturnType<typeof setInterval> | null = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        visibilityTimer = setInterval(() => {
          navigator.serviceWorker.getRegistration().then((reg) => {
            reg?.update().catch(() => {});
          });
        }, 60 * 60 * 1000); // 每小时检查一次
      } else if (visibilityTimer) {
        clearInterval(visibilityTimer);
        visibilityTimer = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimer) clearInterval(visibilityTimer);
    };
  }, []);

  // 不渲染任何 DOM
  return null;
}
