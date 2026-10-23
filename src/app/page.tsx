import React from 'react';
import type { Metadata } from 'next';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { ScrollytellingSection } from '@/components/landing/ScrollytellingSection';
import { LandingVideoShowcase } from '@/components/landing/LandingVideoShowcase';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'EduNotify: Presensi Siswa Estafet & Early Warning System AI',
  description:
    'Platform presensi sekolah modern berbasis jadwal estafet guru mapel, deteksi dini siswa berisiko AI, dan komunikasi kepedulian wali murid.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F7FE] text-[#172944] dark:bg-[#071325] dark:text-[#EAF5FF] transition-colors duration-200 selection:bg-[#04B9E8]/20 selection:text-[#1351C6] dark:selection:text-[#04B9E8]">
      {/* Floating Pill Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <LandingHero />

      {/* Interactive 3-Step Scrollytelling Section */}
      <ScrollytellingSection />

      {/* 12-Second HyperFrames Video Showcase Section */}
      <LandingVideoShowcase />

      {/* Key Feature Capabilities Grid */}
      <LandingFeatures />

      {/* Call to Action Banner */}
      <LandingCTA />

      {/* Modern Footer */}
      <LandingFooter />
    </div>
  );
}