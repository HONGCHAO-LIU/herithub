import influencers from '@/data/influencers.json';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '文化遗产创作者',
  description: '汇聚各平台文化遗产领域的优质内容创作者',
};

interface Influencer {
  name: string;
  platform: string;
  platformIcon: string;
  followers: string;
  category: string;
  description: string;
  tags: string[];
  url: string;
  avatar: string;
}

const platformOrder = ['抖音', 'B站', '小红书', '微信公众号/视频号'];

const platformMeta: Record<string, { label: string; color: string }> = {
  '抖音': { label: '抖音', color: '#FF0044' },
  'B站': { label: 'B站', color: '#FB7299' },
  '小红书': { label: '小红书', color: '#FE2C55' },
  '微信公众号/视频号': { label: '微信公众号 / 视频号', color: '#07C160' },
};

export default function CreatorsPage() {
  const data = influencers as Influencer[];

  const grouped = platformOrder.map((platform) => ({
    platform,
    meta: platformMeta[platform],
    items: data.filter((item) => item.platform === platform),
  }));

  return (
    <div className="creators-page">
      <section className="creators-hero">
        <h1>文化遗产创作者</h1>
        <p>汇聚各平台文化遗产领域的优质内容创作者</p>
      </section>

      <div className="container">
        {grouped.map((group) => (
          <section key={group.platform} className="creators-platform">
            <h2 className="creators-platform__title">
              <span
                className="creators-platform__dot"
                style={{ backgroundColor: group.meta.color }}
              />
              {group.meta.label}
              <span className="creators-platform__count">{group.items.length} 位</span>
            </h2>
            <div className="creators-grid">
              {group.items.map((item, idx) => (
                <div key={`${item.platform}-${item.name}-${idx}`} className="creators-card">
                  <div className="creators-card__header">
                    <h3 className="creators-card__name">{item.name}</h3>
                    <span
                      className="creators-card__platform"
                      style={{
                        backgroundColor: group.meta.color,
                        color: '#fff',
                      }}
                    >
                      {group.meta.label}
                    </span>
                  </div>
                  <div className="creators-card__followers">
                    {item.followers} 粉丝
                  </div>
                  <p className="creators-card__desc">{item.description}</p>
                  <div className="creators-card__tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="creators-card__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
