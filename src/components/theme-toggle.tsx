'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      aria-label="Ganti mode tampilan"
      className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center border ${
        theme === 'dark'
          ? 'bg-[#0D2037] border-[#1D3756] text-[#91A9C6] hover:text-[#EAF5FF] hover:border-[#2D4E75]'
          : 'bg-white border-[#E4EBF6] text-[#72849D] hover:text-[#172944] hover:border-[#CBD8EA] shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#FFAA00] transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#1351C6] transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
