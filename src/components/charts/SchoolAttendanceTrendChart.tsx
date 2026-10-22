'use client';

import React, { useState } from 'react';
import { DailyAttendanceTrend } from '@/services/reportService';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface SchoolAttendanceTrendChartProps {
  data: DailyAttendanceTrend[];
  title?: string;
}

export function SchoolAttendanceTrendChart({
  data,
  title = 'Tren Persentase Kehadiran Harian Sekolah',
}: SchoolAttendanceTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center">
        <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
        <p className="text-sm text-neutral-400">
          Belum ada data rekaman presensi dalam rentang waktu yang dipilih.
        </p>
      </div>
    );
  }

  // Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // X points
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;

  const points = data.map((d, i) => {
    const x = paddingLeft + (data.length > 1 ? i * stepX : chartWidth / 2);
    // Y maps 0% - 100% to chartHeight - 0
    const rate = Math.min(Math.max(d.attendanceRate, 0), 100);
    const y = paddingTop + chartHeight - (rate / 100) * chartHeight;
    return { x, y, rate, d, i };
  });

  // SVG Line path
  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // SVG Area path (close under bottom)
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          paddingTop + chartHeight
        } L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

  // 90% benchmark Y
  const benchmarkY = paddingTop + chartHeight - (90 / 100) * chartHeight;

  // Selected or hovered point
  const activePt =
    hoveredIndex !== null && points[hoveredIndex]
      ? points[hoveredIndex]
      : points[points.length - 1];

  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Garis ambang batas target kehadiran sekolah (90%)
          </p>
        </div>

        {activePt && (
          <div className="flex items-center gap-4 text-xs font-mono bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              {activePt.d.date}
            </span>
            <span className="text-emerald-400 font-bold">
              {activePt.d.attendanceRate.toFixed(1)}% Hadir
            </span>
            <span className="text-neutral-400">
              (H: {activePt.d.hadirCount} | S: {activePt.d.sakitCount} | I:{' '}
              {activePt.d.izinCount} | A: {activePt.d.alpaCount})
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-60"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (0%, 25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = paddingTop + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#262626"
                  strokeWidth="1"
                  strokeDasharray={val === 0 ? undefined : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#737373"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* 90% Target Benchmark Line */}
          <line
            x1={paddingLeft}
            y1={benchmarkY}
            x2={svgWidth - paddingRight}
            y2={benchmarkY}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <text
            x={svgWidth - paddingRight - 4}
            y={benchmarkY - 4}
            textAnchor="end"
            fill="#10b981"
            fontSize="9"
            fontWeight="bold"
            opacity="0.7"
          >
            Target 90%
          </text>

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#trendGradient)" />}

          {/* Line Stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Hover Points */}
          {points.map((pt) => {
            const isHovered = hoveredIndex === pt.i;
            const isAlert = pt.rate < 80;
            const dotColor = isAlert ? '#f43f5e' : '#10b981';

            return (
              <g key={pt.i}>
                {/* Invisible hover target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(pt.i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Visible Data Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6' : '3.5'}
                  fill={dotColor}
                  stroke="#171717"
                  strokeWidth="2"
                  className="transition-all duration-150 pointer-events-none"
                />

                {/* X-axis date labels (show every few points if dense) */}
                {(data.length <= 10 ||
                  pt.i % Math.ceil(data.length / 8) === 0 ||
                  pt.i === data.length - 1) && (
                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fill={isHovered ? '#f5f5f5' : '#737373'}
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {pt.d.date.substring(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
