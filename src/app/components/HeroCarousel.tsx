'use client';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200',
    title: '智汇遗藏 | herithub',
    subtitle: '文化遗产信息智能平台',
  },
];

export default function HeroCarousel() {
  return (
    <div className="hero-carousel">
      <div className="carousel-track">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="carousel-slide carousel-slide--active"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="carousel-overlay" />
            <div className="carousel-caption">
              <h2 className="carousel-caption__title">{slide.title}</h2>
              <p className="carousel-caption__subtitle">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 仅一张幻灯片，隐藏左右箭头 */}
      {/* 仅一张幻灯片，隐藏底部圆点指示器 */}
    </div>
  );
}
