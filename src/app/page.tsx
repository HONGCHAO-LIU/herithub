import heritageData from '@/data/heritage.json'
import { HeritageItem } from '@/types/index'
import Link from 'next/link'

// 分类配置（顺序：研究机构→博物馆→政府机构/国际组织→世界遗产/非遗）
const categoryOrder = [
  '研究机构', '博物馆', '政府机构', '国际组织', '世界遗产', '非物质文化遗产'
]

const categoryConfig: Record<string, { icon: string; color: string }> = {
  '国际组织': { icon: '🏛️', color: '#1E3A5F' },
  '博物馆': { icon: '🏛️', color: '#8B4513' },
  '政府机构': { icon: '🏢', color: '#2E7D32' },
  '研究机构': { icon: '🔬', color: '#6A1B9A' },
  '世界遗产': { icon: '🏰', color: '#C41E3A' },
  '非物质文化遗产': { icon: '🎭', color: '#E65100' },
}

// 遗产新闻 - 带真实URL
const newsData = [
  {
    id: 1,
    title: '敦煌研究院举行2026年清明节祭扫活动',
    source: '敦煌研究院',
    date: '2026-04-02',
    category: '院内动态',
    url: 'https://www.dha.ac.cn/info/1019/7509.htm'
  },
  {
    id: 2,
    title: '2026年石窟寺保护技术高级研修班在敦煌开班',
    source: '敦煌研究院',
    date: '2026-03-31',
    category: '培训交流',
    url: 'https://www.dha.ac.cn/info/1019/7505.htm'
  },
  {
    id: 3,
    title: '2026年莫高窟旅游开放公告',
    source: '敦煌研究院',
    date: '2026-03-30',
    category: '开放公告',
    url: 'https://www.dha.ac.cn/info/1020/7498.htm'
  },
  {
    id: 4,
    title: '故宫博物院：除法定节假日全年周一闭馆',
    source: '故宫博物院',
    date: '2026-03-28',
    category: '开放通知',
    url: 'https://www.dpm.org.cn'
  },
  {
    id: 5,
    title: '中国非物质文化遗产数字博物馆上线',
    source: '文化和旅游部',
    date: '2026-03-20',
    category: '非遗动态',
    url: 'https://www.ihchina.cn'
  }
]

// 最新研究成果 - 带真实URL
const researchData = [
  {
    id: 1,
    title: '北京大学考古文博学院参与埃及考古获重要突破',
    author: '北京大学考古文博学院',
    journal: '学院动态',
    date: '2026-02',
    keywords: ['考古', '埃及', '国际合作'],
    url: 'https://archaeology.pku.edu.cn'
  },
  {
    id: 2,
    title: '中国非物质文化遗产保护工作取得新进展',
    author: '中国非遗保护中心',
    journal: '非遗传承',
    date: '2026-03',
    keywords: ['非遗', '保护', '传承'],
    url: 'https://www.ihchina.cn'
  },
  {
    id: 3,
    title: '敦煌研究院石窟保护技术新成果',
    author: '敦煌研究院',
    journal: '文物保护与考古科学',
    date: '2026-02',
    keywords: ['石窟', '保护', '数字化'],
    url: 'https://www.dha.ac.cn'
  },
  {
    id: 4,
    title: 'ICOMOS推动全球文化遗产保护标准建设',
    author: 'ICOMOS',
    journal: '国际遗产保护',
    date: '2026-01',
    keywords: ['ICOMOS', '保护标准', '国际合作'],
    url: 'https://www.icomos.org'
  },
  {
    id: 5,
    title: 'UNESCO推动文化遗产保护与可持续发展',
    author: '联合国教科文组织',
    journal: 'UNESCO简报',
    date: '2026-03',
    keywords: ['UNESCO', '文化遗产', '可持续发展'],
    url: 'https://www.unesco.org/zh'
  }
]

// 学术会议 - 带真实URL
const conferenceData = [
  {
    id: 1,
    title: 'UNESCO国际文化遗产保护会议',
    host: '联合国教科文组织',
    date: '2026-05',
    location: '巴黎/线上',
    url: 'https://www.unesco.org/zh'
  },
  {
    id: 2,
    title: 'ICOMOS世界遗产保护研讨会',
    host: 'ICOMOS',
    date: '2026-06',
    location: '东京',
    url: 'https://www.icomos.org'
  },
  {
    id: 3,
    title: '中国非物质文化遗产传承与创新论坛',
    host: '中国非遗保护中心',
    date: '2026-05',
    location: '杭州',
    url: 'https://www.ihchina.cn'
  },
  {
    id: 4,
    title: '敦煌研究院石窟保护技术研修班',
    host: '敦煌研究院',
    date: '2026-03-31',
    location: '敦煌',
    url: 'https://www.dha.ac.cn/info/1019/7505.htm'
  },
  {
    id: 5,
    title: '故宫博物院学术讲座与展览',
    host: '故宫博物院',
    date: '2026-04',
    location: '北京',
    url: 'https://www.dpm.org.cn'
  }
]

// 分类映射：区分国内和国际
const getCategoryRegion = (item: HeritageItem): { isDomestic: boolean } => {
  const region = item.地区 || ''
  const isDomestic = region.startsWith('国内')
  return { isDomestic }
}

export default function Home({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  const search = searchParams?.search || ''
  const activeCategory = searchParams?.category || ''

  // 按分类和国内/国际分组
  const groupedData = heritageData.reduce((acc, item: HeritageItem) => {
    const category = item.分类 || '其他'
    const { isDomestic } = getCategoryRegion(item)
    const regionKey = isDomestic ? '国内' : '国际'
    const groupKey = `${category}-${regionKey}`
    
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(item)
    return acc
  }, {} as Record<string, HeritageItem[]>)

  // 过滤函数
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

  const totalItems = heritageData.length
  const sortedCategories = categoryOrder
  const defaultCategory = sortedCategories[0] || ''
  const displayCategory = activeCategory || defaultCategory

  return (
    <main>
      <div className="container">
        <section className="hero" aria-labelledby="hero-title">
          <header>
            <h2 id="hero-title">🌐 文化遗产导航</h2>
            <p>汇集全球世界遗产、博物馆、研究机构、政府部门与非物质文化遗产，一站式获取文化遗产资讯与资源链接</p>
          </header>
          
          <form className="search-box" role="search">
            <input
              type="search"
              name="search"
              placeholder="搜索文化遗产名称、描述或地区..."
              defaultValue={search}
              aria-label="搜索"
            />
            <button type="submit">🔍</button>
          </form>
        </section>

        <nav className="category-nav" aria-label="分类导航">
          <div className="category-tabs">
            {sortedCategories.map((category) => {
              const config = categoryConfig[category] || { icon: '📁', color: '#666' }
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
        </nav>

        <div className="main-content">
          <aside className="sidebar">
            {/* 遗产新闻 - 可点击 */}
            <section className="extra-section news-section">
              <header className="extra-header">
                <h2>📰 遗产新闻</h2>
                <a href="#" className="more-link">更多 →</a>
              </header>
              <div className="news-list">
                {newsData.map((news) => (
                  <article key={news.id} className="news-item">
                    <a href={news.url} target="_blank" rel="noopener noreferrer" className="clickable-item">
                      <span className="news-category">{news.category}</span>
                      <h3 className="news-title">{news.title}</h3>
                      <div className="news-meta">
                        <span className="news-source">{news.source}</span>
                        <span className="news-date">{news.date}</span>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </section>

            {/* 研究成果 - 可点击 */}
            <section className="extra-section research-section">
              <header className="extra-header">
                <h2>📚 最新研究成果</h2>
                <a href="#" className="more-link">更多 →</a>
              </header>
              <div className="research-list">
                {researchData.map((research) => (
                  <article key={research.id} className="research-item">
                    <a href={research.url} target="_blank" rel="noopener noreferrer" className="clickable-item">
                      <h3 className="research-title">{research.title}</h3>
                      <div className="research-meta">
                        <span className="research-author">{research.author}</span>
                        <span className="research-journal">{research.journal}</span>
                        <span className="research-date">{research.date}</span>
                      </div>
                      <div className="research-keywords">
                        {research.keywords.map((kw, idx) => (
                          <span key={idx} className="keyword-tag">{kw}</span>
                        ))}
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </section>

            {/* 学术会议 - 可点击 */}
            <section className="extra-section conference-section">
              <header className="extra-header">
                <h2>📅 最新学术会议资讯</h2>
                <a href="#" className="more-link">更多 →</a>
              </header>
              <div className="conference-list">
                {conferenceData.map((conf) => (
                  <article key={conf.id} className="conference-item">
                    <a href={conf.url} target="_blank" rel="noopener noreferrer" className="clickable-item">
                      <h3 className="conference-title">{conf.title}</h3>
                      <div className="conference-meta">
                        <span className="conf-host">主办: {conf.host}</span>
                        <span className="conf-date">📅 {conf.date}</span>
                        <span className="conf-location">📍 {conf.location}</span>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <div className="main-area">
            {search && (
              <div className="search-info">
                <span>搜索: <span className="search-keyword">{search}</span></span>
                <a href={activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : '/'} className="clear-search">清除搜索</a>
              </div>
            )}

            <section className="content-area">
              {sortedCategories.map((category) => {
                const config = categoryConfig[category] || { icon: '📁', color: '#666', desc: category }
                const domesticItems = groupedData[`${category}-国内`] || []
                const internationalItems = groupedData[`${category}-国际`] || []
                
                let filteredDomestic = filterItems(domesticItems)
                let filteredInternational = filterItems(internationalItems)
                
                if (category !== displayCategory) return null
                
                const totalCount = filteredDomestic.length + filteredInternational.length
                if (totalCount === 0) return null
                
                return (
                  <div key={category} className="items-section">
                    <header className="items-header">
                      <h2>
                        {config.icon} {category} <span className="count">({totalCount})</span>
                      </h2>
                    </header>
                    
                    <div className="compact-list">
                      {filteredDomestic.length > 0 && (
                        <div className="region-group">
                          <h3 className="region-label">🇨🇳 国内</h3>
                          <ul className="item-mini-list">
                            {filteredDomestic.map((item, idx) => (
                              <li key={`cn-${idx}`} className="item-mini">
                                <Link href={item.网址 || '#'} target="_blank" rel="noopener noreferrer" className="item-mini-link">
                                  <span className="item-name">{item.名称}</span>
                                  <span className="item-brief">{item.描述}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {filteredInternational.length > 0 && (
                        <div className="region-group">
                          <h3 className="region-label">🌍 国际</h3>
                          <ul className="item-mini-list">
                            {filteredInternational.map((item, idx) => (
                              <li key={`int-${idx}`} className="item-mini">
                                <Link href={item.网址 || '#'} target="_blank" rel="noopener noreferrer" className="item-mini-link">
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
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}