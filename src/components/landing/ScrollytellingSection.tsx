'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Clock, HeartHandshake, MessageCircle, CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface StepData {
  id: string;
  stepNumber: string;
  tag: string;
  title: string;
  accentText: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  badgeIcon: React.ElementType;
  badgeText: string;
  statBadge: string;
  features: { title: string; desc: string }[];
}

const STEPS: StepData[] = [
  {
    id: 'alur-estafet',
    stepNumber: '01',
    tag: 'LANGKAH 01 / PRESENSI ESTAFET',
    title: 'Pencatatan Presensi Real-Time',
    accentText: 'Per Jam Pelajaran Terjadwal',
    description:
      'Setiap guru mata pelajaran mencatat presensi langsung di jam aktifnya. Sistem otomatis merekonsiliasi kehadiran siswa secara estafet sehingga status harian (Hadir, Sakit, Izin, Alpa) tersinkronisasi tanpa tumpang tindih jadwal dan tanpa rekap manual berulang.',
    imageSrc: '/images/landing/step-1-attendance.webp',
    imageAlt: 'Alur Presensi Estafet Guru Mata Pelajaran EduNotify',
    badgeIcon: Clock,
    badgeText: 'Presensi Terjadwal Real-Time',
    statBadge: '99.8% Presensi Terekonsiliasi Otomatis',
    features: [
      {
        title: 'Anti-Konflik Jadwal',
        desc: 'Mencegah tumpang tindih input presensi antara guru mapel di kelas dan jam yang sama.',
      },
      {
        title: 'Rekonsiliasi Cerdas',
        desc: 'Satu siswa alpa di jam pertama akan langsung diverifikasi dan diestafetkan ke jam berikutnya.',
      },
      {
        title: 'Efisiensi Guru & Wali Kelas',
        desc: 'Memangkas waktu rekap kehadiran manual harian hingga 85% untuk fokus pada kegiatan mengajar.',
      },
    ],
  },
  {
    id: 'ai-care',
    stepNumber: '02',
    tag: 'LANGKAH 02 / EARLY WARNING SYSTEM',
    title: 'Deteksi Dini Siswa Berisiko',
    accentText: 'Dengan Analitik Empati AI',
    description:
      'Mesin aturan deterministik bekerja sama dengan modul analitik AI untuk mendeteksi alpa beruntun dan penurunan tren kehadiran secara dini. Wali kelas menerima narasi rekomendasi solutif berbasis empati sebelum masalah kehadiran menjadi kronis.',
    imageSrc: '/images/landing/step-2-ai-heart.webp',
    imageAlt: 'AI Early Warning & Care Monitoring EduNotify',
    badgeIcon: HeartHandshake,
    badgeText: 'Care & Well-Being Monitoring',
    statBadge: '0 Siswa Terabaikan Tanpa Pendampingan',
    features: [
      {
        title: 'Deterministic Rule Engine',
        desc: 'Deteksi instan alpa berturut-turut (3 hari beruntun) dan anomali absensi hari Senin/Jumat.',
      },
      {
        title: 'Narasi Empati AI',
        desc: 'Rekomendasi tindakan berbasis kepedulian tanpa bahasa menghakimi untuk wali kelas dan BK.',
      },
      {
        title: 'Multi-Level Risk Score',
        desc: 'Klasifikasi visual risiko Tinggi (Merah), Sedang (Kuning), dan Rendah (Hijau) yang mudah dipantau.',
      },
    ],
  },
  {
    id: 'wa-bridge',
    stepNumber: '03',
    tag: 'LANGKAH 03 / JEMBATAN KOMUNIKASI',
    title: 'Jembatan Komunikasi Langsung',
    accentText: 'Ke Genggaman Orang Tua',
    description:
      'Hubungkan kepedulian sekolah langsung ke wali murid melalui integrasi WhatsApp Click-to-Chat transparan. Wali kelas dapat mengirimkan pesan notifikasi kehadiran yang santun dan akurat hanya dengan satu klik tanpa manipulasi log pengiriman.',
    imageSrc: '/images/landing/step-3-communication-bridge.webp',
    imageAlt: 'Jembatan Komunikasi WhatsApp Orang Tua EduNotify',
    badgeIcon: MessageCircle,
    badgeText: 'WhatsApp Click-to-Chat Transparan',
    statBadge: '100% Pesan Santun & Terdokumentasi',
    features: [
      {
        title: 'Draft Pesan Santun Otomatis',
        desc: 'Format pesan resmi dengan tanggal, nama siswa, dan catatan jam pelajaran yang otomatis terisi.',
      },
      {
        title: 'Transparansi Penuh',
        desc: 'Sistem memberi panduan jelas bahwa klik tombol membuka WhatsApp resmi tanpa klaim status palsu.',
      },
      {
        title: 'Kolaborasi Keluarga & Sekolah',
        desc: 'Mempererat hubungan guru dan orang tua dalam mendampingi perkembangan akademik peserta didik.',
      },
    ],
  },
];

export function ScrollytellingSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // Sync scroll position with active step for interactive scrollytelling
  useEffect(() => {
    const handleScroll = () => {
      if (isAutoScrolling.current || !sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // When section is active in the viewport
      if (rect.top <= windowHeight * 0.35 && rect.bottom >= windowHeight * 0.35) {
        const total = rect.height - windowHeight * 0.5;
        const progress = Math.max(0, Math.min(1, (-rect.top + windowHeight * 0.2) / (total || 1)));

        if (progress < 0.33) {
          setActiveStep(0);
        } else if (progress < 0.68) {
          setActiveStep(1);
        } else {
          setActiveStep(2);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to hash changes (#alur-estafet, #ai-care, #wa-bridge)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      const foundIdx = STEPS.findIndex((s) => s.id === hash);
      if (foundIdx !== -1) {
        setActiveStep(foundIdx);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const goToStep = (idx: number) => {
    setActiveStep(idx);
    if (!sectionRef.current) return;

    isAutoScrolling.current = true;
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 600);
  };

  const currentStep = STEPS[activeStep];
  const BadgeIcon = currentStep.badgeIcon;

  return (
    <section
      id="scrollytelling"
      ref={sectionRef}
      className="relative py-24 sm:py-32 px-4 sm:px-6 max-w-6xl mx-auto overflow-hidden"
    >
      {/* Hidden Anchors for Direct Navigation */}
      <div id="alur-estafet" className="absolute top-0 pointer-events-none" />
      <div id="ai-care" className="absolute top-1/3 pointer-events-none" />
      <div id="wa-bridge" className="absolute top-2/3 pointer-events-none" />
      {/* Section Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 border border-[#1351C6]/20 dark:border-[#04B9E8]/30 text-[#1351C6] dark:text-[#04B9E8] text-xs font-bold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>Interactive Scroll Motion</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#172944] dark:text-white tracking-tight leading-tight mb-4">
          Alur Kerja 3 Langkah EduNotify
        </h2>

        <p className="text-base sm:text-lg text-[#72849D] dark:text-[#91A9C6] leading-relaxed">
          Dari pencatatan presensi di ruang kelas hingga ke meja kepala sekolah dan ponsel orang tua, seluruh siklus berjalan harmonis, otomatis, dan transparan.
        </p>
      </div>

      {/* Interactive Step Navigator Tabs */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-14 overflow-x-auto pb-2 scrollbar-none">
        {STEPS.map((step, idx) => {
          const isActive = activeStep === idx;
          const Icon = step.badgeIcon;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(idx)}
              className={`flex items-center gap-2.5 px-4 sm:px-6 py-3 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-[#1351C6] to-[#04B9E8] text-white border-transparent shadow-lg shadow-[#1351C6]/25 scale-105'
                  : 'bg-white/80 dark:bg-[#0D2037]/80 text-[#72849D] dark:text-[#91A9C6] border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#04B9E8]/40 hover:text-[#172944] dark:hover:text-white'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-white text-[#1351C6]'
                    : 'bg-[#F3F7FE] dark:bg-[#1D3756] text-[#72849D] dark:text-[#91A9C6]'
                }`}
              >
                {step.stepNumber}
              </span>
              <span>{step.title.split(' ')[0]} {step.title.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Showcase Panel (Active Step Content) */}
      <div className="relative rounded-3xl backdrop-blur-xl bg-white/75 dark:bg-[#0D2037]/80 border border-[#E4EBF6] dark:border-[#1D3756] p-6 sm:p-10 shadow-2xl shadow-[#1351C6]/10 dark:shadow-black/40 transition-all duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Descriptive Story */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Step Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#04B9E8]/10 text-[#04B9E8] text-xs font-bold tracking-widest uppercase mb-4 w-fit">
              <span>{currentStep.tag}</span>
            </div>

            {/* Headline */}
            <h3 className="text-2xl sm:text-4xl font-extrabold text-[#172944] dark:text-white tracking-tight leading-tight mb-4">
              {currentStep.title}{' '}
              <span className="italic font-serif text-[#0284C7] dark:text-[#35E6BD]">
                {currentStep.accentText}
              </span>
            </h3>

            {/* Body */}
            <p className="text-sm sm:text-base text-[#334661] dark:text-[#91A9C6] leading-relaxed mb-6">
              {currentStep.description}
            </p>

            {/* Metric Banner */}
            <div className="p-3.5 rounded-xl bg-[#F3F7FE] dark:bg-[#071325]/80 border border-[#E4EBF6] dark:border-[#1D3756] flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-[#35E6BD]/20 text-[#35E6BD]">
                <CheckCircle2 className="w-5 h-5 text-[#35E6BD]" />
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#172944] dark:text-[#EAF5FF]">
                {currentStep.statBadge}
              </div>
            </div>

            {/* Key Features Bullets */}
            <div className="space-y-3.5 mb-8">
              {currentStep.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1351C6]/10 dark:bg-[#04B9E8]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-bold text-[#1351C6] dark:text-[#04B9E8]">
                      {fIdx + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#172944] dark:text-white">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-[#556987] dark:text-[#91A9C6] leading-relaxed mt-0.5">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Step Switchers */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#E4EBF6] dark:border-[#1D3756]">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeStep === idx
                      ? 'w-8 bg-[#04B9E8]'
                      : 'w-2 bg-[#E4EBF6] dark:bg-[#1D3756] hover:bg-[#72849D]'
                  }`}
                  aria-label={`Pindah ke langkah ${idx + 1}`}
                />
              ))}
              <span className="text-xs text-[#72849D] dark:text-[#91A9C6] ml-2">
                Langkah {activeStep + 1} dari 3
              </span>
            </div>
          </div>

          {/* Right Column: Visual Card Frame */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#04B9E8]/30 dark:border-[#04B9E8]/40 shadow-2xl shadow-black/20 group">
              {/* Stacked Step Images with Smooth Crossfade Transition */}
              {STEPS.map((step, idx) => (
                <div
                  key={step.id}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    activeStep === idx
                      ? 'opacity-100 scale-100 z-10'
                      : 'opacity-0 scale-95 z-0 pointer-events-none'
                  }`}
                >
                  <Image
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 550px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority={idx === 0}
                  />
                </div>
              ))}

              {/* Gradient Backdrop Shine */}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#071325]/75 via-transparent to-transparent pointer-events-none" />

              {/* Floating Top Badge */}
              <div className="absolute top-4 left-4 z-30 p-2.5 px-3.5 rounded-xl backdrop-blur-md bg-white/90 dark:bg-[#071325]/90 border border-white/20 dark:border-[#1D3756] shadow-lg flex items-center gap-2">
                <BadgeIcon className="w-4 h-4 text-[#04B9E8]" />
                <span className="text-xs font-bold text-[#172944] dark:text-white">
                  {currentStep.badgeText}
                </span>
              </div>

              {/* Bottom Card Pill */}
              <div className="absolute bottom-4 left-4 right-4 z-30 p-3 rounded-xl backdrop-blur-md bg-white/90 dark:bg-[#071325]/90 border border-white/20 dark:border-[#1D3756] shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35E6BD] animate-pulse" />
                  <span className="text-xs font-semibold text-[#172944] dark:text-[#EAF5FF]">
                    {currentStep.title} Terintegrasi
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep((activeStep + 1) % STEPS.length)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1351C6] dark:text-[#04B9E8] hover:underline"
                >
                  <span>Langkah Berikutnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}