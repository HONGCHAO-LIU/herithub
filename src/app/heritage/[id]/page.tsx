import { Metadata } from 'next'
import heritageData from '@/data/heritage.json'
import { HeritageItem } from '@/types/index'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export async function generateStaticParams() {
  return heritageData.map((item: HeritageItem) => ({
    id: encodeURIComponent(item.名称),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = decodeURIComponent(params.id)
  const items = heritageData as unknown as Array<Record<string, unknown>>
  const item = items.find((i) => i['名称'] === id) as { 名称: string; 描述?: string; 分类?: string; 地区?: string; 网址?: string } | undefined

  if (!item) {
    return {
      title: '未找到 | 文化遗产目录',
    }
  }

  const name = String(item.名称 || '')
  const desc = item.描述 ? String(item.描述) : `了解${name}的详细信息`
  const category = item.分类 ? String(item.分类) : ''
  const region = item.地区 ? String(item.地区) : ''

  return {
    title: name,
    description: desc,
    keywords: [name, category, region, '文化遗产'],
    openGraph: {
      title: `${name} | 文化遗产目录`,
      description: desc,
      type: 'article',
      url: `https://heritage.example.com/heritage/${encodeURIComponent(name)}/`,
      siteName: '文化遗产目录',
    },
    alternates: {
      canonical: `https://heritage.example.com/heritage/${encodeURIComponent(name)}/`,
    },
  }
}

const categoryConfig: Record<string, { icon: string; color: string }> = {
  '国际组织': { icon: '🏛️', color: '#1E3A5F' },
  '博物馆': { icon: '🏛️', color: '#8B4513' },
  '政府机构': { icon: '🏢', color: '#2E7D32' },
  '研究机构': { icon: '🔬', color: '#6A1B9A' },
  '机构': { icon: '📋', color: '#455A64' },
  '世界遗产': { icon: '🏰', color: '#C41E3A' },
  '非物质文化遗产': { icon: '🎭', color: '#E65100' },
  '微信公众号': { icon: '📱', color: '#07C160' },
  '抖音': { icon: '🎵', color: '#000000' },
}

const imageMap: Record<string, string> = {
  '国际组织': 'https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=800&h=400&fit=crop',
  '博物馆': 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=400&fit=crop',
  '政府机构': 'https://images.unsplash.com/photo-1555449380-09c6919b5478?w=800&h=400&fit=crop',
  '研究机构': 'https://images.unsplash.com/photo-1568679936913-77c1e4c8e92b?w=800&h=400&fit=crop',
  '机构': 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&h=400&fit=crop',
  '世界遗产': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=400&fit=crop',
  '非物质文化遗产': 'https://images.unsplash.com/photo-1589543821019-6c7a8c18a13a?w=800&h=400&fit=crop',
  '微信公众号': '',
  '抖音': '',
}

export default function HeritageDetail({ params }: Props) {
  const id = decodeURIComponent(params.id)
  const item = heritageData.find((i: HeritageItem) => i.名称 === id) as HeritageItem | undefined

  if (!item) {
    return (
      <main>
        <div className="container">
          <div className="error">
            <h2>未找到该文化遗产</h2>
            <p>抱歉，您访问的内容不存在。</p>
            <Link href="/" className="back-link">← 返回首页</Link>
          </div>
        </div>
      </main>
    )
  }

  const config = categoryConfig[item.分类] || { icon: '📁', color: '#666' }
  const imageUrl = imageMap[item.分类] || imageMap['世界遗产']
  const isWeChatOrDouyin = item.分类 === '微信公众号' || item.分类 === '抖音'
  const hasValidUrl = item.网址 && (item.网址.startsWith('http') || item.网址.startsWith('gh_') || item.网址.startsWith('douyin_'))

  return (
    <main>
      <article>
        {/* Header with image */}
        <header className="detail-header">
          {!isWeChatOrDouyin && imageUrl && (
            <img src={imageUrl} alt={item.名称} />
          )}
          {isWeChatOrDouyin && (
            <div className="detail-header-content">
              <span style={{ fontSize: '4rem' }}>{config.icon}</span>
            </div>
          )}
          <div className="detail-title-container">
            <h1 className="detail-title">{item.名称}</h1>
            <span className="detail-category" style={{ backgroundColor: config.color }}>
              {config.icon} {item.分类}
            </span>
          </div>
        </header>

        <nav className="detail-nav">
          <Link href="/" className="back-link">← 返回首页</Link>
        </nav>

        <div className="detail-content">
          {/* Description */}
          <section className="detail-section">
            <h2>简介</h2>
            <p>{item.描述 || item.简介 || '暂无描述信息'}</p>
          </section>

          {/* Info Grid */}
          <section className="detail-section">
            <h2>详细信息</h2>
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">分类</span>
                <span className="info-value">{item.分类}</span>
              </div>
              <div className="info-item">
                <span className="info-label">地区</span>
                <span className="info-value">{item.地区 || '未知'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">来源</span>
                <span className="info-value">{item.来源 || '未知'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">平台类型</span>
                <span className="info-value">{item.平台类型 || item.分类}</span>
              </div>
            </div>
          </section>

          {/* Platform specific info */}
          {item.分类 === '微信公众号' && (
            <section className="detail-section">
              <h2>微信公众号说明</h2>
              <div className="platform-info">
                <p>这是微信公众号，无法通过网页直接访问。</p>
                <p className="platform-tip">📱 请在微信中搜索公众号名称"{item.名称}"进行关注</p>
                {item.网址 && !item.网址.startsWith('http') && (
                  <p className="platform-id">公众号ID: {item.网址}</p>
                )}
              </div>
            </section>
          )}

          {item.分类 === '抖音' && (
            <section className="detail-section">
              <h2>抖音账号说明</h2>
              <div className="platform-info">
                <p>这是抖音账号，无法通过网页直接访问。</p>
                <p className="platform-tip">🎵 请在抖音APP中搜索账号名称"{item.名称}"进行关注</p>
                {item.网址 && !item.网址.startsWith('http') && (
                  <p className="platform-id">抖音ID: {item.网址}</p>
                )}
              </div>
            </section>
          )}

          {/* Link */}
          {hasValidUrl && item.网址.startsWith('http') && (
            <section className="detail-section">
              <h2>官方链接</h2>
              <a 
                href={item.网址} 
                target="_blank" 
                rel="noopener noreferrer"
                className="detail-link"
              >
                🔗 访问官方网站 →
              </a>
            </section>
          )}
        </div>
      </article>
    </main>
  )
}