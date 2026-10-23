import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  idPrefix?: string;
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  subtitle,
  className = '',
  idPrefix = 'en-logo',
}: BrandLogoProps) {
  const pixelSizes = {
    sm: { svg: 38, font: 'text-lg', subFont: 'text-[10px]' },
    md: { svg: 44, font: 'text-xl', subFont: 'text-xs' },
    lg: { svg: 58, font: 'text-2xl', subFont: 'text-xs' },
  };

  const current = pixelSizes[size];
  const gradId = `${idPrefix}-grad`;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={current.svg}
        height={current.svg}
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
        role="img"
        aria-label="EduNotify Monogram Logo"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1351C6" />
            <stop offset="100%" stopColor="#04B9E8" />
          </linearGradient>
        </defs>
        {/* Background Rounded Container */}
        <rect x="5" y="5" width="86" height="86" rx="25" fill={`url(#${gradId})`} />
        {/* Monogram 'E' in light cyan */}
        <path
          d="M26 28v40M26 28h21M26 48h17M26 68h21"
          stroke="#D8F8FF"
          strokeWidth="7.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Monogram 'N' in pure white */}
        <path
          d="M53 68V28l18 40V28"
          stroke="#FFFFFF"
          strokeWidth="7.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Distinctive Mint Accent Dot (Logo 03 — Insight) */}
        <circle
          cx="71"
          cy="27"
          r="9.5"
          fill="#58F0CE"
          stroke="#0F43A6"
          strokeWidth="2"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col">
          <div className={`font-extrabold tracking-tight leading-none ${current.font}`}>
            <span className="text-[#172944] dark:text-[#EAF5FF]">edu</span>
            <span className="text-[#176DFF] dark:text-[#04B9E8]">notify</span>
          </div>
          {subtitle && (
            <span className={`text-[#72849D] dark:text-[#91A9C6] mt-0.5 leading-tight ${current.subFont}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
