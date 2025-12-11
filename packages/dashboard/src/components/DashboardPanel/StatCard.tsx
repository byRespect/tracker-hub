/**
 * StatCard Component
 *
 * Trend göstergesi ve ikon ile tek bir metrik görüntüler.
 * Dashboard header'ında anahtar istatistikleri göstermek için kullanılır.
 */

import React, { useState, useRef } from 'react';

/**
 * StatCard component props'ları
 */
export interface StatCardProps {
  /** İstatistik için başlık/etiket */
  title: string;
  /** Gösterilecek değer */
  value: string;
  /** İkon elementi */
  icon: React.ReactNode;
  /** Trend metni (örn: "+12%", "Stable") */
  trend: string;
  /** Trend'in pozitif olup olmadığı */
  trendUp: boolean;
  /** Card için renk teması */
  color: 'cyan' | 'amber' | 'red' | 'emerald';
}

/**
 * StatCard - Trend göstergesiyle tek bir metrik görüntüler
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  color,
}) => {
  const colorClasses = {
    cyan: 'border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10',
    amber: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10',
    red: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10',
  };

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${colorClasses[color]}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-[#020617]/40 backdrop-blur-sm border border-white/5">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {value}
        </span>
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            trendUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          }`}
        >
          {trend}
        </span>
      </div>
    </div>
  );
};

/**
 * SimpleSparkline component props'ları
 */
export interface SimpleSparklineProps {
  /** Veri noktaları dizisi */
  data: number[];
  /** Çizgi ve alan için renk */
  color: string;
}

/**
 * SimpleSparkline - Hover göstergeleriyle interaktif SVG chart
 * Zaman dilimlerinde request hacim trend'ini gösterir
 */
export const SimpleSparkline: React.FC<SimpleSparklineProps> = ({ data, color }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const max = Math.max(...data, 1);
  const min = 0;

  /**
   * Veri noktaları için yüzdelik koordinatları hesaplar
   */
  const getCoords = (i: number) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((data[i] - min) / (max - min)) * 100;
    return { x, y };
  };

  // Create SVG polyline points
  const points = data
    .map((_, i) => {
      const { x, y } = getCoords(i);
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `0,100 ${points} 100,100`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const index = Math.round(percentage * (data.length - 1));
    setActiveIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const index = Math.round(percentage * (data.length - 1));
    setActiveIndex(index);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-crosshair touch-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveIndex(null)}
      onTouchMove={handleTouchMove}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Fill area under line */}
        <polygon
          points={fillPoints}
          fill="url(#sparkGradient)"
          className="transition-opacity duration-300"
          style={{ opacity: activeIndex !== null ? 0.8 : 0.6 }}
        />

        {/* Line chart */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active indicator at hover position */}
        {activeIndex !== null && (
          <g>
            <line
              x1={getCoords(activeIndex).x}
              y1="0"
              x2={getCoords(activeIndex).x}
              y2="100"
              stroke="white"
              strokeOpacity="0.1"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="4 4"
            />
            <circle
              cx={getCoords(activeIndex).x}
              cy={getCoords(activeIndex).y}
              r="4"
              fill={color}
              stroke="#0f172a"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={getCoords(activeIndex).x}
              cy={getCoords(activeIndex).y}
              r="8"
              fill={color}
              opacity="0.2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {activeIndex !== null && (
        <div
          className="absolute pointer-events-none z-50 flex flex-col items-center"
          style={{
            left: `${getCoords(activeIndex).x}%`,
            top: `${getCoords(activeIndex).y}%`,
            transform: 'translate(-50%, -100%) translateY(-12px)',
          }}
        >
          <div className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2 whitespace-nowrap">
            <span className="font-bold font-mono text-white">{data[activeIndex]}</span>
            <span className="text-slate-400 text-[10px] uppercase">Reqs</span>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-700 -mt-[1px]" />
        </div>
      )}

      {/* Grid lines */}
      <div className="absolute inset-0 flex justify-between pointer-events-none opacity-10">
        <div className="h-full w-px bg-slate-500 border-l border-dashed" />
        <div className="h-full w-px bg-slate-500 border-l border-dashed" />
        <div className="h-full w-px bg-slate-500 border-l border-dashed" />
        <div className="h-full w-px bg-slate-500 border-l border-dashed" />
      </div>
    </div>
  );
};
