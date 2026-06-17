/* =============================================
   智汇遗藏 Service Worker
   策略: 页面 Network First; 静态资源 Cache First
   ============================================= */

const CACHE_NAME = 'herithub-v1';
const RUNTIME_CACHE = 'herithub-runtime-v1';

// 预缓存核心路由
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/heritage',
  '/academic',
  '/business',
  '/search',
  '/api/search'
];

// 静态资源 CDN / _next 匹配
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:js|css)$/,
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
  /\.(?:woff2?|ttf|eot)$/
];

function isStaticAsset(url) {
  return STATIC_PATTERNS.some((re) => re.test(url));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// ---------- 安装: 预缓存核心路由 ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 预缓存 HTML 路由（会由 Next.js 服务端生成）
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { credentials: 'same-origin' })
            .then((resp) => {
              if (resp.ok) {
                return cache.put(url, resp.clone());
              }
            })
            .catch(() => { /* 网络不可用时静默跳过 */ })
        )
      );
    })
  );
  self.skipWaiting();
});

// ---------- 激活: 清理旧缓存 ----------
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (!validCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ---------- 拦截: 路由策略 ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 跳过非 GET 请求
  if (request.method !== 'GET') return;

  // 跳过 chrome-extension / 非同源请求
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 导航请求 (页面): Network First
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源: Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 其余请求: Network First
  event.respondWith(networkFirst(request));
});

// ============== 策略函数 ==============

/** Network First: 优先网络，失败回退缓存 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // 缓存成功响应
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // 导航请求回退到离线页面
    if (isNavigationRequest(request)) {
      const offlinePage = await caches.match('/');
      if (offlinePage) return offlinePage;
    }

    throw err;
  }
}

/** Cache First: 优先缓存，未命中则网络 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    // 图片/字体等可选资源，失败返回空响应
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}
