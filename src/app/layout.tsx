import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://heritage.example.com'),
  title: {
    default: '文化遗产目录 | 探索中华文明瑰宝',
    template: '%s | 文化遗产目录',
  },
  description: '收录世界遗产、非物质文化遗产、博物馆等文化遗产资源的目录网站。探索中华文明瑰宝，了解历史文化。',
  keywords: ['文化遗产', '世界遗产', '非物质文化遗产', '博物馆', '文物保护', '历史文化', '中华文明'],
  authors: [{ name: '文化遗产目录' }],
  creator: '文化遗产目录',
  publisher: '文化遗产目录',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://heritage.example.com',
    siteName: '文化遗产目录',
    title: '文化遗产目录 | 探索中华文明瑰宝',
    description: '收录世界遗产、非物质文化遗产、博物馆等文化遗产资源的目录网站。探索中华文明瑰宝，了解历史文化。',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '文化遗产目录',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '文化遗产目录 | 探索中华文明瑰宝',
    description: '收录世界遗产、非物质文化遗产、博物馆等文化遗产资源的目录网站。',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://heritage.example.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: '文化遗产目录',
              url: 'https://heritage.example.com',
              logo: 'https://heritage.example.com/logo.png',
              description: '收录世界遗产、非物质文化遗产、博物馆等文化遗产资源的目录网站',
              sameAs: [],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '文化遗产目录',
              url: 'https://heritage.example.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://heritage.example.com/?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}