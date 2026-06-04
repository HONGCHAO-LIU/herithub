import heritageData from '@/data/heritage.json'
import businessData from '@/data/business_intelligence.json'
import conferenceData from '@/data/academic_conferences.json'
import paperData from '@/data/academic_papers.json'
import { HeritageItem, BusinessIntelligence, AcademicConference, AcademicPaper } from '@/types/index'
import Link from 'next/link'

/* =============================================
   分类配置（保留原有机构名录分类逻辑）
   ============================================= */
const categoryOrder = [
  '研究机构', '博物馆', '政府机构', '国际组织', '世界遗产', '非物质文化遗产'
]

const categoryConfig: Record<string, { icon: string; color: string; desc: string }> = {
  '研究机构': { icon: '🔬', color: '#6A1B9A', desc: '文化遗产保护与研究机构' },
  '博物馆': { icon: '🏛️', color: '#8B4513', desc: '国内外重要博物馆' },
  '政府机构': { icon: '🏢', color: '#2E7D32', desc: '政府文物管理与文化机构' },
  '国际组织': { icon: '🌐', color: '#1E3A5F', desc: '国际文化遗产组织' },
  '世界遗产': { icon: '🏰', color: '#C41E3A', desc: '世界遗产地与名录' },
  '非物质文化遗产': { icon: '🎭', color: '#E65100', desc: '非遗名录与传承基地' },
}

const linkStatusConfig: Record<string, { label: string; color: string }> = {
  '正常': { label: '', color: 'rgb(44,24,16)' },
  '环境限制': { label: '网络限制', color: '#aaa' },
  '可能失效': { label: '待验证', color: '#999' },
  '链接失效': { label: '已失效', color: '#888' },
  '内容不匹配': { label: '内容不匹配', color: '#999' },
}

/* =============================================
   7 大商业情报领域色板
   ============================================= */
const bizCategoryColors: Record<string, string> = {
  '文创开发': '#C41E3A',
  '文旅融合': '#2E7D32',
  '文化遗产数字化': '#1565C0',
  '专业服务': '#6A1B9A',
  '教育培训': '#E65100',
  '内容与媒体': '#00838F',
  '投融资与资产化': '#4E342E',
}

/* =============================================
   辅助函数
   ============================================= */
function getTopBusiness(data: BusinessIntelligence[], n: number): BusinessIntelligence[] {
  return [...data].sort((a, b) => b.publishDate.localeCompare(a.publishDate)).slice(0, n)
}

function getTopConferences(data: AcademicConference[], n: number): AcademicConference[] {
  return [...data].sort((a, b) => {
    const aDate = a.date.split(' ~ ')[0]
    const bDate = b.date.split(' ~ ')[0]
    return bDate.localeCompare(aDate)
  }).slice(0, n)
}

function getTopPapers(data: AcademicPaper[], n: number): AcademicPaper[] {
  return [...data].sort((a, b) => b.publishDate.localeCompare(a.publishDate)).slice(0, n)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length >= 2) return `${parts[0]}年${parts[1]}月`
  return dateStr
}

function getRegionKey(item: HeritageItem): string {
  return (item.地区 || '').startsWith('国内') ? '国内' : '国际'
}

export default function Home({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  const search = searchParams?.search || ''
  const activeCategory = searchParams?.category || ''

  /* --- 三大板块 Top5 --- */
  const topBusiness = getTopBusiness(businessData as BusinessIntelligence[], 5)
  const topConferences = getTopConferences(conferenceData as AcademicConference[], 5)
  const topPapers = getTopPapers(paperData as AcademicPaper[], 5)

  /* --- 机构名录分组（保留原有逻辑） --- */
  const groupedData = (heritageData as HeritageItem[]).reduce((acc, item) => {
    const category = item.分类 || '其他'
    const regionKey = getRegionKey(item)
    const groupKey = `${category}-${regionKey}`
    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(item)
    return acc
  }, {} as Record<string, HeritageItem[]>)

  const filterItems = (items: HeritageItem[]) => {
    if (!search) return items
    const lowerSearch = search.toLowerCase()
    return items.filter(
      (item) =>
        item.名称.toLowerCase().includes(lowerSearch) ||
        item.描述?.toLowerCase().includes(lowerSearch) ||
        item.地区?.toLowerCase().includes(lowerSearch)
    )
  }

  const showInstitutions = !!search || !!activeCategory
  const displayCategory = activeCategory || categoryOrder[0]

  return (
    <main>
      <div className="container">
        {/* ============================================
            Hero 区 — 智汇遗藏 品牌展示
            ============================================ */}
        <section className="hero-section" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">智汇遗藏</h1>
          <p className="hero-subtitle">文化遗产领域一站式信息中枢</p>
          <p className="hero-desc">
            聚合<span className="hero-highlight">商业情报</span>、<span className="hero-highlight">学术会议</span>与<span className="hero-highlight">论文成果</span>，
            辅以全球文化遗产机构名录，为从业者、研究者与决策者提供高效的信息获取入口
          </p>
        </section>

        {/* ============================================
            搜索框 — Hero 下方，跳转机构名录
            ============================================ */}
        <form className="home-search" role="search">
          <input
            type="search"
            name="search"
            placeholder="搜索文化遗产机构名称、描述或地区..."
            defaultValue={search}
            aria-label="搜索机构名录"
          />
          <button type="submit">搜索</button>
        </form>

        {/* ============================================
            三栏聚合展示区
            ============================================ */}
        <section className="aggregate-grid" aria-label="三大板块聚合展示">
          {/* 左栏：最新商业情报 */}
          <div className="feed-column" id="feed-business">
            <header className="feed-column-header">
              <h2>商业情报</h2>
              <Link href="/business" className="feed-more">查看更多 →</Link>
            </header>
            <div className="feed-list">
              {topBusiness.map((item) => (
                <article key={`biz-${item.id}`} className="feed-item feed-item-business">
                  <div className="feed-item-tags">
                    <span
                      className="biz-category-chip"
                      style={{ backgroundColor: bizCategoryColors[item.category] || '#666' }}
                    >
                      {item.category}
                    </span>
                    <span className="biz-type-chip">{item.type}</span>
                  </div>
                  <h3 className="feed-item-title">{item.title}</h3>
                  {item.amount && <span className="biz-amount">{item.amount}</span>}
                  <div className="feed-item-meta">
                    <span className="feed-item-date">{formatDate(item.publishDate)}</span>
                    <span className="feed-item-source">来源：{item.source}</span>
                  </div>
                  <div className="feed-item-footer">
                    <span className="feed-item-crawled">采集：{item.crawledAt}</span>
                    {item.verified && <span className="verify-chip verified">已验证</span>}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 中栏：最新学术会议 */}
          <div className="feed-column" id="feed-conference">
            <header className="feed-column-header">
              <h2>学术会议</h2>
              <Link href="/academic" className="feed-more">查看更多 →</Link>
            </header>
            <div className="feed-list">
              {topConferences.map((item) => (
                <article key={`conf-${item.id}`} className="feed-item feed-item-conference">
                  <h3 className="feed-item-title">{item.name}</h3>
                  <div className="feed-item-meta">
                    <span className="feed-item-date">📅 {item.date}</span>
                  </div>
                  <div className="feed-item-meta">
                    <span className="feed-item-location">📍 {item.location}</span>
                  </div>
                  {item.deadline && (
                    <div className="feed-item-meta">
                      <span className="deadline-tag">截稿：{item.deadline}</span>
                    </div>
                  )}
                  <div className="feed-item-footer">
                    <span className="feed-item-source">主办：{item.organizer}</span>
                    <span className="feed-item-crawled">采集：{item.crawledAt}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 右栏：最新论文成果 */}
          <div className="feed-column" id="feed-paper">
            <header className="feed-column-header">
              <h2>论文成果</h2>
              <Link href="/academic" className="feed-more">查看更多 →</Link>
            </header>
            <div className="feed-list">
              {topPapers.map((item) => (
                <article key={`paper-${item.id}`} className="feed-item feed-item-paper">
                  <h3 className="feed-item-title">{item.title}</h3>
                  <div className="feed-item-meta">
                    <span className="paper-authors">{item.authors}</span>
                  </div>
                  <div className="feed-item-meta">
                    <span className="paper-journal">{item.journal}</span>
                    <span className="feed-item-date">{formatDate(item.publishDate)}</span>
                  </div>
                  <div className="feed-item-footer">
                    <span className="feed-item-crawled">采集：{item.crawledAt}</span>
                    {item.verified && <span className="verify-chip verified">已验证</span>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            机构名录快速入口
            ============================================ */}
        <section className="quick-links" aria-label="机构名录快速入口">
          <h2 className="quick-links-title">机构名录</h2>
          <div className="quick-links-grid">
            {categoryOrder.map((category) => {
              const config = categoryConfig[category]
              const domesticItems = groupedData[`${category}-国内`] || []
              const internationalItems = groupedData[`${category}-国际`] || []
              const total = domesticItems.length + internationalItems.length
              return (
                <Link
                  key={category}
                  href={`?category=${encodeURIComponent(category)}`}
                  className="quick-link-card"
                  style={{ borderTopColor: config.color }}
                >
                  <span className="quick-link-icon" style={{ backgroundColor: config.color }}>
                    {config.icon}
                  </span>
                  <div className="quick-link-info">
                    <strong className="quick-link-name">{category}</strong>
                    <span className="quick-link-desc">{config.desc}</span>
                  </div>
                  <span className="quick-link-count">{total} 个机构</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ============================================
            机构名录搜索结果（搜索/分类筛选时展示）
            ============================================ */}
        {showInstitutions && (
          <div className="institution-results">
            <div className="category-nav" aria-label="分类导航">
              <div className="category-tabs">
                {categoryOrder.map((category) => {
                  const config = categoryConfig[category]
                  const domesticItems = groupedData[`${category}-国内`] || []
                  const internationalItems = groupedData[`${category}-国际`] || []
                  const total = domesticItems.length + internationalItems.length
                  const isActive = displayCategory === category
                  return (
                    <Link
                      key={category}
                      href={`?category=${encodeURIComponent(category)}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                      className={`category-tab ${isActive ? 'active' : ''}`}
                      style={isActive ? { borderBottomColor: config.color } : {}}
                    >
                      <span className="tab-icon" style={{ backgroundColor: config.color }}>{config.icon}</span>
                      <span className="tab-name">{category}</span>
                      <span className="tab-count">{total}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {search && (
              <div className="search-info">
                <span>搜索: <span className="search-keyword">{search}</span></span>
                <a href={activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : '/'} className="clear-search">清除搜索</a>
              </div>
            )}

            <section className="content-area">
              {categoryOrder.map((category) => {
                const config = categoryConfig[category]
                const domesticItems = groupedData[`${category}-国内`] || []
                const internationalItems = groupedData[`${category}-国际`] || []
                const filteredDomestic = filterItems(domesticItems)
                const filteredInternational = filterItems(internationalItems)
                if (category !== displayCategory) return null
                const totalCount = filteredDomestic.length + filteredInternational.length
                if (totalCount === 0) return null
                return (
                  <div key={category} className="items-section">
                    <header className="items-header">
                      <h2>{config.icon} {category} <span className="count">({totalCount})</span></h2>
                    </header>
                    <div className="compact-list">
                      {filteredDomestic.length > 0 && (
                        <div className="region-group">
                          <h3 className="region-label">🇨🇳 国内</h3>
                          <ul className="item-mini-list">
                            {filteredDomestic.map((item, idx) => {
                              const status = item.链接状态 || ''
                              const statusInfo = linkStatusConfig[status]
                              const color = statusInfo ? statusInfo.color : 'rgb(44,24,16)'
                              const label = statusInfo?.label || ''
                              return (
                                <li key={`cn-${idx}`} className="item-mini">
                                  <Link href={item.网址 || '#'} target="_blank" rel="noopener noreferrer" className="item-mini-link">
                                    <span className="item-name" style={{ color }}>{item.名称}</span>
                                    {label && <span className="item-link-status" style={{ color }}>[{label}]</span>}
                                    <span className="item-brief">{item.描述}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                      {filteredInternational.length > 0 && (
                        <div className="region-group">
                          <h3 className="region-label">🌍 国际</h3>
                          <ul className="item-mini-list">
                            {filteredInternational.map((item, idx) => {
                              const status = item.链接状态 || ''
                              const statusInfo = linkStatusConfig[status]
                              const color = statusInfo ? statusInfo.color : 'rgb(44,24,16)'
                              const label = statusInfo?.label || ''
                              return (
                                <li key={`int-${idx}`} className="item-mini">
                                  <Link href={item.网址 || '#'} target="_blank" rel="noopener noreferrer" className="item-mini-link">
                                    <span className="item-name" style={{ color }}>{item.名称}</span>
                                    {label && <span className="item-link-status" style={{ color }}>[{label}]</span>}
                                    <span className="item-brief">{item.描述}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
