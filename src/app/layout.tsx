import type { Metadata } from 'next'
import './globals.css'
import NavHeader from './components/NavHeader'
import Footer from './components/Footer'
import SwRegister from './sw-register'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  metadataBase: new URL('https://herithub.org'),
  title: {
    default: '智汇遗藏 | herithub',
    template: '%s | 智汇遗藏',
  },
  themeColor: '#8B6914',
  description: '智汇遗藏——文化遗产领域一站式信息中枢。收录世界遗产、非物质文化遗产、博物馆等机构名录，汇集商业情报、学术会议与论文成果。',
  keywords: ['文化遗产', '世界遗产', '非物质文化遗产', '博物馆', '文物保护', '历史文化', '中华文明', '商业情报', '学术动态', '智汇遗藏'],
  authors: [{ name: '智汇遗藏' }],
  creator: '智汇遗藏',
  publisher: '智汇遗藏',
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
    siteName: '智汇遗藏',
    title: '智汇遗藏 | 文化遗产领域一站式信息中枢',
    description: '智汇遗藏——文化遗产领域一站式信息中枢。收录世界遗产、非物质文化遗产、博物馆等机构名录，汇集商业情报、学术会议与论文成果。',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '智汇遗藏',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '智汇遗藏 | 文化遗产领域一站式信息中枢',
    description: '智汇遗藏——文化遗产领域一站式信息中枢。',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B6914" />
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
      <body>
        <NavHeader />
        {children}
        <Footer />
        <SwRegister />
      </body>
    </html>
  )
}