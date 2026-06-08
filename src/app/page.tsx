import heritageData from '@/data/heritage.json'
import businessData from '@/data/business_intelligence.json'
import conferenceData from '@/data/academic_conferences.json'
import paperData from '@/data/academic_papers.json'
import { HeritageItem, BusinessIntelligence, AcademicConference, AcademicPaper } from '@/types/index'
import Link from 'next/link'
import HeroCarousel from './components/HeroCarousel'

// ============ 分类颜色/图标配置 ============
const categoryOrder = [
  '研究机构', '博物馆', '政府机构', '国际组织', '世界遗产', '非物质文化遗产'
] as const

const categoryConfig: Record<string, { icon: string; color: string; desc: string }> = {
  '研究机构': { icon: '🔬', color: '#6A1B9A', desc: '考古所/研究院/高校' },
  '博物馆': { icon: '🏛️', color: '#8B4513', desc: '各级各类博物馆' },
  '政府机构': { icon: '🏢', color: '#2E7D32', desc: '文物局/文旅厅' },
  '国际组织': { icon: '🌐', color: '#1E3A5F', desc: 'UNESCO/ICOMOS等' },
  '世界遗产': { icon: '🏰', color: '#C41E3A', desc: '世界遗产地' },
  '非物质文化遗产': { icon: '🎭', color: '#E65100', desc: '非遗项目/传承' },
}

const bizCategoryColors: Record<string, string> = {
  '文创开发': '#C41E3A',
  '文旅融合': '#2E7D32',
  '文化遗产数字化': '#1565C0',
  '专业服务': '#6A1B9A',
  '教育培训': '#E65100',
  '内容与媒体': '#00838F',
  '投融资与资产化': '#F9A825',
}

// ============ 帮助函数 ============
const formatDate = (d: string): string => {
  if (!d) return ''
  // 格式如 "2025-11-15" 或 "2026-07-15 ~ 2026-07-25"
  return d
}

const formatCrawledAt = (crawled: string): string => {
  if (!crawled) return ''
  try {
    const d = new Date(crawled)
    if (isNaN(d.getTime())) return crawled
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch { return crawled }
}

const getTop5 = <T,>(arr: T[]): T[] => arr.slice(0, 5)

// ============ 数据 ============
const latestBusiness = getTop5(businessData as BusinessIntelligence[])
const latestConferences = getTop5(conferenceData as AcademicConference[])
const latestPapers = getTop5(paperData as AcademicPaper[])

// 计算各分类机构数量
const categoryCounts: Record<string, number> = {}
categoryOrder.forEach((cat) => {
  categoryCounts[cat] = (heritageData as HeritageItem[]).filter(
    (item) => item.分类 === cat
  ).length
})

// 分类映射：区分国内和国际
const getCategoryRegion = (item: HeritageItem): string => {
  const region = item.地区 || ''
  return region.startsWith('国内') ? '国内' : '国际'
}

export default function Home({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  const search = searchParams?.search || ''
  const activeCategory = searchParams?.category || ''

  // 过滤机构名录数据
  const filterItems = (items: HeritageItem[]) => {
    let result = items
    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.名称.toLowerCase().includes(lowerSearch) ||
          item.描述?.toLowerCase().includes(lowerSearch) ||
          item.地区?.toLowerCase().includes(lowerSearch)
      )
    }
    if (activeCategory) {
      result = result.filter((item) => item.分类 === activeCategory)
    }
    return result
  }

  const filteredHeritage = filterItems(heritageData as HeritageItem[])

  // 按分类+地区分组
  const groupedData = filteredHeritage.reduce((acc, item) => {
    const cat = item.分类 || '其他'
    const region = getCategoryRegion(item)
    const key = `${cat}-${region}`
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, HeritageItem[]>)

  const showHeritageResults = !!(search || activeCategory)
  const displayCategories = activeCategory
    ? [activeCategory]
    : categoryOrder.filter((c) => {
        const domestic = groupedData[`${c}-国内`] || []
        const international = groupedData[`${c}-国际`] || []
        return domestic.length + international.length > 0
      })

  return (
    <main>
      <div className="container">
        {/* ========== Hero 区 ========== */}
        <section className="hero-section" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">智汇遗藏 | herithub</h1>
          <p className="hero-subtitle">文化遗产领域一站式信息中枢</p>
          <p className="hero-desc">
            <span className="hero-highlight">商业情报</span> — 追踪招标/项目/案例等产业动态 ·&nbsp;
            <span className="hero-highlight">学术动态</span> — 汇集国际会议与前沿论文 ·&nbsp;
            <span className="hero-highlight">机构名录</span> — 收录6大类文化遗产机构与遗产地
          </p>
        </section>

        {/* ========== 首页大图轮播 ========== */}
        <HeroCarousel />

        {/* ========== 搜索框（跳转机构名录） ========== */}
        <form className="home-search" role="search" action="/">
          <input
            type="search"
            name="search"
            placeholder="搜索文化遗产机构、描述或地区..."
            defaultValue={search}
            aria-label="搜索机构名录"
          />
          <button type="submit">搜索</button>
        </form>

        {/* ========== 三栏聚合展示区 ========== */}
        <section className="aggregate-grid" aria-label="三大板块聚合">
          {/* 左栏：最新商业情报 */}
          <div className="feed-column">
            <div className="feed-column-header">
              <h2>最新商业情报</h2>
              <Link href="/business" className="feed-more">查看更多 →</Link>
            </div>
            <div className="feed-list">
              {latestBusiness.map((item) => (
                <article key={item.id} className="feed-item feed-item-business">
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <h3 className="feed-item-title">{item.title}</h3>
                    <div className="feed-item-tags">
                      <span
                        className="biz-category-chip"
                        style={{ backgroundColor: bizCategoryColors[item.category] || '#8B4513' }}
                      >
                        {item.category}
                      </span>
                      <span className="biz-type-chip">{item.type}</span>
                      {item.amount && <span className="biz-amount">{item.amount}</span>}
                    </div>
                    <div className="feed-item-meta">
                      <span className="feed-item-date">{item.publishDate}</span>
                      <span className="feed-item-source" title={item.source}>{item.source}</span>
                    </div>
                  </a>
                  <div className="feed-item-footer">
                    <span className="feed-item-crawled">采集于 {formatCrawledAt(item.crawledAt)}</span>
                    {item.verified && <span className="verify-chip verified">已验证</span>}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 中栏：最新学术会议 */}
          <div className="feed-column">
            <div className="feed-column-header">
              <h2>最新学术会议</h2>
              <Link href="/academic" className="feed-more">查看更多 →</Link>
            </div>
            <div className="feed-list">
              {latestConferences.map((item) => (
                <article key={item.id} className="feed-item feed-item-conference">
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <h3 className="feed-item-title">{item.name}</h3>
                    <div className="feed-item-meta">
                      <span className="feed-item-date">{item.date}</span>
                      <span className="feed-item-location">{item.location}</span>
                    </div>
                    <div className="feed-item-meta">
                      <span className="feed-item-source" title={item.organizer}>{item.organizer}</span>
                      {item.deadline && (
                        <span className="deadline-tag">截稿: {item.deadline}</span>
                      )}
                    </div>
                    <div className="feed-item-tags">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="biz-type-chip">{tag}</span>
                      ))}
                    </div>
                  </a>
                  <div className="feed-item-footer">
                    <span className="feed-item-crawled">采集于 {formatCrawledAt(item.crawledAt)}</span>
                    {item.verified && <span className="verify-chip verified">已验证</span>}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 右栏：最新论文成果 */}
          <div className="feed-column">
            <div className="feed-column-header">
              <h2>最新论文成果</h2>
              <Link href="/academic" className="feed-more">查看更多 →</Link>
            </div>
            <div className="feed-list">
              {latestPapers.map((item) => (
                <article key={item.id} className="feed-item feed-item-paper">
                  <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <h3 className="feed-item-title">{item.title}</h3>
                    <div className="feed-item-meta">
                      <span className="paper-authors">{item.authors}</span>
                    </div>
                    <div className="feed-item-meta">
                      <span className="paper-journal">{item.journal}</span>
                      {item.doi && <span className="paper-journal">DOI: {item.doi}</span>}
                    </div>
                    <div className="feed-item-meta">
                      <span className="feed-item-date">{item.publishDate}</span>
                    </div>
                  </a>
                  <div className="feed-item-footer">
                    <span className="feed-item-crawled">采集于 {formatCrawledAt(item.crawledAt)}</span>
                    {item.verified && <span className="verify-chip verified">已验证</span>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ========== 机构名录快速入口 ========== */}
        <section className="quick-links" aria-label="机构名录快速入口">
          <h2 className="quick-links-title">机构名录</h2>
          <div className="quick-links-grid">
            {categoryOrder.map((cat) => {
              const config = categoryConfig[cat] || { icon: '📁', color: '#666', desc: '' }
              return (
                <Link
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}`}
                  className="quick-link-card"
                  style={{ borderTopColor: config.color }}
                >
                  <span
                    className="quick-link-icon"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.icon}
                  </span>
                  <span className="quick-link-info">
                    <span className="quick-link-name">{cat}</span>
                    <span className="quick-link-desc">{config.desc}</span>
                  </span>
                  <span className="quick-link-count">{categoryCounts[cat] || 0} 条</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ========== 机构名录搜索结果 ========== */}
        {showHeritageResults && (
          <section className="institution-results" aria-label="机构名录搜索结果">
            {(search || activeCategory) && (
              <div className="search-info">
                <span>
                  {search && <>搜索: <span className="search-keyword">{search}</span></>}
                  {search && activeCategory && ' · '}
                  {activeCategory && <>分类: <span className="search-keyword">{activeCategory}</span></>}
                </span>
                <span>
                  共 {filteredHeritage.length} 条结果 ·{' '}
                  <a href="/" className="clear-search">清除筛选</a>
                </span>
              </div>
            )}

            {filteredHeritage.length === 0 ? (
              <div className="empty-state">未找到匹配的机构条目，请尝试其他关键词或分类。</div>
            ) : (
              <div className="content-area">
                {displayCategories.map((cat) => {
                  const config = categoryConfig[cat] || { icon: '📁', color: '#666', desc: '' }
                  const domesticItems = groupedData[`${cat}-国内`] || []
                  const internationalItems = groupedData[`${cat}-国际`] || []
                  if (domesticItems.length === 0 && internationalItems.length === 0) return null

                  return (
                    <div key={cat} className="items-section">
                      <header className="items-header">
                        <h2>
                          {config.icon} {cat}
                          <span className="count">({domesticItems.length + internationalItems.length})</span>
                        </h2>
                      </header>

                      <div className="compact-list">
                        {domesticItems.length > 0 && (
                          <div className="region-group">
                            <h3 className="region-label">国内</h3>
                            <ul className="item-mini-list">
                              {domesticItems.map((item, idx) => (
                                <li key={`cn-${idx}`} className="item-mini">
                                  <Link
                                    href={item.网址 || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="item-mini-link"
                                  >
                                    <span className="item-name">{item.名称}</span>
                                    <span className="item-brief">{item.描述}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {internationalItems.length > 0 && (
                          <div className="region-group">
                            <h3 className="region-label">国际</h3>
                            <ul className="item-mini-list">
                              {internationalItems.map((item, idx) => (
                                <li key={`int-${idx}`} className="item-mini">
                                  <Link
                                    href={item.网址 || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="item-mini-link"
                                  >
                                    <span className="item-name">{item.名称}</span>
                                    <span className="item-brief">{item.描述}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
