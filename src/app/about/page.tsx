export const metadata = {
  title: '关于 | 智汇遗藏',
  description: '了解智汇遗藏——文化遗产领域一站式信息中枢。',
};

export default function AboutPage() {
  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <h2>关于智汇遗藏</h2>
        <p>文化遗产领域一站式信息中枢</p>
      </section>

      {/* Site Introduction */}
      <section className="about-section">
        <h3 className="about-heading">网站介绍</h3>
        <div className="about-content">
          <p>
            <strong>智汇遗藏</strong>是一个面向文化遗产领域从业者、研究者、学生及爱好者的综合性信息平台。
            我们的使命是汇聚国内外文化遗产相关机构、商业情报、学术动态和行业资源，打造一个权威、开放、持续更新的信息中枢。
          </p>
          <p>
            当前，文化遗产领域信息高度分散——政府机构发布在政务网站，商业机会散布于各采购平台，学术会议和研究成果分布在期刊和院校官网。
            智汇遗藏通过系统化采集、结构化整理和人工核验，将这些碎片化信息聚合为可检索、可追溯的知识网络。
          </p>
          <p>
            项目始于2025年，目前收录超过1000条机构条目，覆盖世界遗产、非物质文化遗产、博物馆、研究机构、政府机构与国际组织六大类别。
            随着v1.2.8持续迭代，商业情报、学术会议与论文成果等新板块陆续上线，逐步实现"一站式"的信息服务目标。
          </p>
        </div>
      </section>

      {/* Three Major Sections */}
      <section className="about-section">
        <h3 className="about-heading">三大板块</h3>
        <div className="about-grid">
          <div className="about-card">
            <h4>机构名录</h4>
            <p>
              收录国内外文化遗产相关机构的权威名录，涵盖世界遗产地、非物质文化遗产项目、
              博物馆、考古与文物保护研究机构、各级政府文物主管部门以及UNESCO、ICOMOS等国际组织。
              每条条目包含机构简介、官方网站、联系方式和分类标签。
            </p>
          </div>
          <div className="about-card">
            <h4>商业情报</h4>
            <p>
              覆盖文创开发、文旅融合、文化遗产数字化、专业服务、教育培训、内容与媒体、投融资与资产化七大细分领域。
              汇集招标公告、项目合作招募、成交公告、报价基准、商业案例与服务商名录，助力从业者把握行业商机。
            </p>
          </div>
          <div className="about-card">
            <h4>学术动态</h4>
            <p>
              持续跟踪文化遗产领域重要学术会议与最新论文成果。会议板块提供时间、地点、投稿截止日期、主办方等关键信息；
              论文板块收录国内外核心期刊发表的文化遗产相关研究，含摘要、关键词、DOI等完整元数据。
            </p>
          </div>
        </div>
      </section>

      {/* Content Standards */}
      <section className="about-section">
        <h3 className="about-heading">内容标准</h3>
        <div className="about-content">
          <div className="standard-item">
            <span className="standard-icon">O</span>
            <div>
              <strong>真实性</strong>
              <p>所有条目均标注来源，优先引用官网和权威平台发布的信息。每一条目经人工核验后标注验证状态。</p>
            </div>
          </div>
          <div className="standard-item">
            <span className="standard-icon">O</span>
            <div>
              <strong>可访问性</strong>
              <p>每条记录均提供可点击的原始链接，方便用户直接访问信息来源。对因网络环境限制无法直接访问的链接予以标注。</p>
            </div>
          </div>
          <div className="standard-item">
            <span className="standard-icon">O</span>
            <div>
              <strong>时效性</strong>
              <p>定期核查链接有效性和内容更新情况。商业情报和学术会议标注发布日期与最后核验日期，过期信息予以标记或归档。</p>
            </div>
          </div>
          <div className="standard-item">
            <span className="standard-icon">O</span>
            <div>
              <strong>不重复</strong>
              <p>对同一实体或事件，仅保留高质量、信息完整的单条记录，避免信息冗余干扰检索效率。</p>
            </div>
          </div>
          <div className="standard-item">
            <span className="standard-icon">O</span>
            <div>
              <strong>可追溯性</strong>
              <p>每条记录标注原始出处URL、采集时间和数据更新时间，确保信息链路完整可追溯。所有数据变更记录在案。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution Guide */}
      <section className="about-section">
        <h3 className="about-heading">贡献指南</h3>
        <div className="about-content">
          <p>智汇遗藏是一个开放的知识项目，欢迎文化遗产领域的从业者和研究者贡献条目、纠正错误或提出改进建议。</p>
          <h4>如何提交条目</h4>
          <ol className="contribute-steps">
            <li>
              <strong>准备信息</strong>：确保条目包含名称、网址、简要描述、来源、分类等核心字段。商业情报还请注明金额、发布日期；学术会议请注明时间、地点和投稿截止日期。
            </li>
            <li>
              <strong>核验来源</strong>：优先引用官网、政府采购平台、权威学术数据库（如CNKI、DOI链接）发布的原始信息。
            </li>
            <li>
              <strong>通过邮件提交</strong>：将条目信息发送至邮箱，我们将在3个工作日内审核并收录。
            </li>
          </ol>
          <p className="contribute-note">
            所有贡献条目需遵循上述内容标准，经人工核验后发布。贡献者的名字将列入致谢名单。
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="about-section">
        <h3 className="about-heading">联系方式</h3>
        <div className="about-content">
          <div className="contact-info">
            <div className="contact-row">
              <span className="contact-label">电子邮箱</span>
              <span>heritage@example.com</span>
            </div>
            <div className="contact-row">
              <span className="contact-label">项目地址</span>
              <span>https://heritage.example.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* URL Specification */}
      <section className="about-section">
        <h3 className="about-heading">URL 规范</h3>
        <div className="about-content">
          <p>本网站遵循 RESTful 风格的 URL 设计规范，所有路径具备良好的可读性和一致性。</p>

          <h4>页面路由结构</h4>
          <table className="url-spec-table">
            <thead>
              <tr>
                <th>路径</th>
                <th>页面</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/</code></td>
                <td>首页</td>
                <td>三栏聚合（商业情报/会议/论文）、机构名录入口、全站搜索</td>
              </tr>
              <tr>
                <td><code>/business</code></td>
                <td>商业情报列表</td>
                <td>按领域/类型筛选，搜索，卡片列表</td>
              </tr>
              <tr>
                <td><code>/business/[id]</code></td>
                <td>商业情报详情</td>
                <td>完整字段、原始链接、验证状态、反馈表单</td>
              </tr>
              <tr>
                <td><code>/business/archive</code></td>
                <td>商业情报归档</td>
                <td>按月份分组展示三个月前的历史情报</td>
              </tr>
              <tr>
                <td><code>/academic</code></td>
                <td>学术动态列表</td>
                <td>双Tab（会议/论文），多维筛选（期刊/关键词/年份）</td>
              </tr>
              <tr>
                <td><code>/academic/conference/[id]</code></td>
                <td>会议详情</td>
                <td>完整会务信息、官网链接、验证状态</td>
              </tr>
              <tr>
                <td><code>/academic/paper/[id]</code></td>
                <td>论文详情</td>
                <td>完整元数据、DOI链接、摘要关键词</td>
              </tr>
              <tr>
                <td><code>/academic/archive</code></td>
                <td>学术动态归档</td>
                <td>按月份分组展示三个月前的历史条目</td>
              </tr>
              <tr>
                <td><code>/heritage/[id]</code></td>
                <td>机构详情</td>
                <td>机构简介、联系方式、分类标签、关联条目</td>
              </tr>
              <tr>
                <td><code>/about</code></td>
                <td>关于帮助</td>
                <td>网站介绍、内容标准、贡献指南、URL 规范</td>
              </tr>
              <tr>
                <td><code>/contribute</code></td>
                <td>用户贡献</td>
                <td>三Tab表单（机构/会议/论文），审核流程</td>
              </tr>
              <tr>
                <td><code>/subscribe</code></td>
                <td>订阅管理</td>
                <td>新建订阅、查询/取消订阅</td>
              </tr>
              <tr>
                <td><code>/review</code></td>
                <td>审核看板</td>
                <td>待审核条目统计、三Tab审核列表</td>
              </tr>
            </tbody>
          </table>

          <h4>命名规范</h4>
          <ul className="url-spec-list">
            <li><strong>全小写、连字符分隔</strong>：路径使用小写字母，单词间用连字符（kebab-case），如 <code>/business-intelligence</code>。</li>
            <li><strong>资源名用复数或不加后缀</strong>：列表页不加后缀，如 <code>/business</code>；归档页用 <code>/archive</code>。</li>
            <li><strong>动态参数</strong>：详情页使用 <code>[id]</code> 占位，数字 ID 作为路径段，如 <code>/business/1</code>。</li>
            <li><strong>无尾斜杠</strong>：所有 URL 末尾不含斜杠，避免重复内容。</li>
          </ul>

          <h4>链接状态约定</h4>
          <ul className="url-spec-list">
            <li>每条条目均包含 <code>sourceUrl</code> 字段，指向信息原始出处。</li>
            <li>详情页展示完整原始链接，卡片底部提供"原始链接"快捷入口。</li>
            <li>链接失效时页面将显示红色「链接失效」标签，用户可通过"报告问题"入口提交修正。</li>
            <li>外部链接一律 <code>target="_blank"</code> 新窗口打开。</li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>智汇遗藏 &copy; {new Date().getFullYear()} —— 文化遗产领域一站式信息中枢</p>
      </footer>
    </div>
  );
}
