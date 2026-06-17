'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Pie, Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement
);

interface Stats {
  generatedAt: string;
  typeCounts: {
    heritage: number;
    conference: number;
    paper: number;
    business: number;
  };
  topTags: { name: string; count: number }[];
  topSources: { name: string; count: number }[];
  monthlyTrend: {
    month: string;
    heritage: number;
    conference: number;
    paper: number;
    business: number;
  }[];
}

const TYPE_COLORS: Record<string, string> = {
  heritage: '#8B4513',
  conference: '#D2691E',
  paper: '#B8860B',
  business: '#A0522D',
};

const TYPE_BG_COLORS: Record<string, string> = {
  heritage: 'rgba(139, 69, 19, 0.15)',
  conference: 'rgba(210, 105, 30, 0.15)',
  paper: 'rgba(184, 134, 11, 0.15)',
  business: 'rgba(160, 82, 45, 0.15)',
};

const TYPE_LABELS: Record<string, string> = {
  heritage: '机构名录',
  conference: '学术会议',
  paper: '学术论文',
  business: '商业情报',
};

ChartJS.defaults.font.family =
  "'Noto Serif SC', 'Songti SC', 'Microsoft YaHei', 'PingFang SC', sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(44, 24, 16, 0.85)';
ChartJS.defaults.plugins.tooltip.titleFont = { size: 13 };
ChartJS.defaults.plugins.tooltip.bodyFont = { size: 12 };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch('/stats.json')
      .then((res) => {
        if (!res.ok) throw new Error('stats.json 加载失败');
        return res.json();
      })
      .then((data: Stats) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">数据加载中...</div>
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          {error || '数据不可用，请先运行 npm run build 生成统计数据'}
        </div>
      </main>
    );
  }

  const total =
    stats.typeCounts.heritage +
    stats.typeCounts.conference +
    stats.typeCounts.paper +
    stats.typeCounts.business;

  // 饼图数据：数据类型分布
  const pieData = {
    labels: Object.keys(stats.typeCounts).map((k) => TYPE_LABELS[k] || k),
    datasets: [
      {
        data: Object.values(stats.typeCounts),
        backgroundColor: Object.keys(stats.typeCounts).map((k) => TYPE_COLORS[k] || '#ccc'),
        borderColor: '#FAF7F2',
        borderWidth: 2,
      },
    ],
  };

  // 柱状图数据：标签分布 Top 15
  const barData = {
    labels: stats.topTags.map((t) => t.name),
    datasets: [
      {
        label: '数量',
        data: stats.topTags.map((t) => t.count),
        backgroundColor: 'rgba(139, 69, 19, 0.75)',
        borderColor: '#8B4513',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // 环形图数据：来源分布 Top 10
  const doughnutData = {
    labels: stats.topSources.map((s) => s.name),
    datasets: [
      {
        data: stats.topSources.map((s) => s.count),
        backgroundColor: [
          '#8B4513', '#A0522D', '#D2691E', '#B8860B', '#CD853F',
          '#6B3A2A', '#C41E3A', '#4A2C1A', '#8B6914', '#A0522D',
        ],
        borderColor: '#FAF7F2',
        borderWidth: 2,
      },
    ],
  };

  // 折线图数据：月度新增趋势
  const lineData = {
    labels: stats.monthlyTrend.map((m) => m.month),
    datasets: ['heritage', 'conference', 'paper', 'business'].map((key) => ({
      label: TYPE_LABELS[key] || key,
      data: stats.monthlyTrend.map((m) => (m as unknown as Record<string, number>)[key]),
      borderColor: TYPE_COLORS[key],
      backgroundColor: TYPE_BG_COLORS[key],
      borderWidth: 2,
      tension: 0.3,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true } },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { color: 'rgba(139, 69, 19, 0.08)' } },
      y: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 14, usePointStyle: true, font: { size: 11 } } },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true } },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(139, 69, 19, 0.08)' }, beginAtZero: true },
    },
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">数据可视化看板</h1>
        <p className="dashboard-subtitle">
          共收录 <strong>{total.toLocaleString()}</strong> 条数据
          &nbsp;·&nbsp;
          生成时间：{new Date(stats.generatedAt).toLocaleString('zh-CN')}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="stat-cards dashboard-stat-cards">
        {Object.entries(stats.typeCounts).map(([key, count]) => (
          <div key={key} className="stat-card" style={{ borderTopColor: TYPE_COLORS[key] }}>
            <div className="stat-card__number" style={{ color: TYPE_COLORS[key] }}>
              {count.toLocaleString()}
            </div>
            <div className="stat-card__label">{TYPE_LABELS[key] || key}</div>
          </div>
        ))}
      </div>

      {/* 图表网格 */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">数据类型分布</h3>
          <div className="dashboard-chart">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="dashboard-card-title">标签分布 Top 15</h3>
          <div className="dashboard-chart">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="dashboard-card-title">来源分布 Top 10</h3>
          <div className="dashboard-chart">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="dashboard-card-title">月度新增趋势（近 12 个月）</h3>
          <div className="dashboard-chart">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>
    </main>
  );
}
