'use client';

import React from 'react';

interface ClassTrendCurveProps {
  className?: string;
  dataPoints?: number[]; // percentages 0-100
}

export function ClassTrendCurve({
  className = '',
  dataPoints = [88, 92, 91, 95, 96.5],
}: ClassTrendCurveProps) {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 350 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="trend-curve-grad" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#1684FF" stopOpacity="0.28" />
            <stop offset="1" stopColor="#1684FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines & Labels */}
        <text
          x="32"
          y="35"
          className="text-[9px] fill-[#72849D] dark:fill-[#91A9C6] font-medium"
        >
          100%
        </text>
        <line
          x1="62"
          y1="32"
          x2="335"
          y2="32"
          stroke="currentColor"
          strokeDasharray="3 3"
          className="text-[#E4EBF6] dark:text-[#1D3756]"
        />

        <text
          x="32"
          y="75"
          className="text-[9px] fill-[#72849D] dark:fill-[#91A9C6] font-medium"
        >
          90%
        </text>
        <line
          x1="62"
          y1="72"
          x2="335"
          y2="72"
          stroke="currentColor"
          strokeDasharray="3 3"
          className="text-[#E4EBF6] dark:text-[#1D3756]"
        />

        <text
          x="32"
          y="115"
          className="text-[9px] fill-[#72849D] dark:fill-[#91A9C6] font-medium"
        >
          80%
        </text>
        <line
          x1="62"
          y1="112"
          x2="335"
          y2="112"
          stroke="currentColor"
          strokeDasharray="3 3"
          className="text-[#E4EBF6] dark:text-[#1D3756]"
        />

        {/* Area fill */}
        <path
          d="M87 90 Q 116 80 145 55 T 203 65 T 261 45 T 319 35 L 319 125 L 87 125 Z"
          fill="url(#trend-curve-grad)"
        />

        {/* Curve stroke */}
        <path
          d="M87 90 Q 116 80 145 55 T 203 65 T 261 45 T 319 35"
          fill="none"
          stroke="#1684FF"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Dots */}
        {[
          { cx: 87, cy: 90 },
          { cx: 145, cy: 55 },
          { cx: 203, cy: 65 },
          { cx: 261, cy: 45 },
          { cx: 319, cy: 35 },
        ].map((pt, i) => (
          <circle
            key={i}
            cx={pt.cx}
            cy={pt.cy}
            r="4.5"
            stroke="#1684FF"
            strokeWidth="2.5"
            className="fill-white dark:fill-[#0D2037]"
          />
        ))}

        {/* X Axis Labels */}
        <text
          x="87"
          y="148"
          textAnchor="middle"
          className="text-[10px] fill-[#72849D] dark:fill-[#91A9C6] font-semibold"
        >
          M1
        </text>
        <text
          x="145"
          y="148"
          textAnchor="middle"
          className="text-[10px] fill-[#72849D] dark:fill-[#91A9C6] font-semibold"
        >
          M2
        </text>
        <text
          x="203"
          y="148"
          textAnchor="middle"
          className="text-[10px] fill-[#72849D] dark:fill-[#91A9C6] font-semibold"
        >
          M3
        </text>
        <text
          x="261"
          y="148"
          textAnchor="middle"
          className="text-[10px] fill-[#72849D] dark:fill-[#91A9C6] font-semibold"
        >
          M4
        </text>
        <text
          x="319"
          y="148"
          textAnchor="middle"
          className="text-[10px] fill-[#72849D] dark:fill-[#91A9C6] font-semibold"
        >
          M5
        </text>
      </svg>
    </div>
  );
}
