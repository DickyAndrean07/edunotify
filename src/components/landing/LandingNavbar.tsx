'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Menu, X, ArrowRight } from 'lucide-react';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Alur Estafet', href: '#scrollytelling' },
    { label: 'Deteksi AI', href: '#ai-care' },
    { label: 'Jembatan WA', href: '#wa-bridge' },
    { label: 'Fitur', href: '#fitur' },
    { label: 'Video Showcase', href: '#video-showcase' },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 max-w-6xl mx-auto">
      <nav
        aria-label="Navigasi Utama"
        className="w-full rounded-full backdrop-blur-xl bg-white/90 dark:bg-[#071325]/85 border border-[#E4EBF6] dark:border-[#1D3756] shadow-lg shadow-black/5 dark:shadow-black/30 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-colors duration-200"
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <BrandLogo size="sm" showWordmark={true} />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs lg:text-sm font-medium text-[#415574] dark:text-[#91A9C6] hover:text-[#1351C6] dark:hover:text-[#04B9E8] px-3 py-1.5 rounded-full hover:bg-[#F3F7FE] dark:hover:bg-[#0D2037] transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white px-3.5 sm:px-4 py-2 rounded-full bg-gradient-to-r from-[#1351C6] to-[#04B9E8] hover:from-[#0F43A6] hover:to-[#039ec7] shadow-sm shadow-[#1351C6]/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Masuk Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Buka menu navigasi"
            className="md:hidden p-2 rounded-full border border-[#E4EBF6] dark:border-[#1D3756] text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-[#071325]/95 border border-[#E4EBF6] dark:border-[#1D3756] shadow-xl flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#172944] dark:text-[#EAF5FF] px-3 py-2 rounded-xl hover:bg-[#F3F7FE] dark:hover:bg-[#0D2037] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[#E4EBF6] dark:border-[#1D3756]">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1351C6] to-[#04B9E8]"
            >
              <span>Masuk Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}