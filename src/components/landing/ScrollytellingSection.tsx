'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Clock,
  HeartHandshake,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Send,
  Sparkles,
  UserCheck,
  RefreshCw,
  PhoneCall,
  CalendarCheck2,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function ScrollytellingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Interactive mockup state for Step 1
  const [mockAttendance, setMockAttendance] = useState([
    { id: 1, name: 'Ahmad Fauzi', nis: '202401', jam1: 'Hadir', jam2: 'Hadir' },
    { id: 2, name: 'Citra Dewi', nis: '202402', jam1: 'Izin', jam2: 'Izin' },
    { id: 3, name: 'Farhan Maulana', nis: '202403', jam1: 'Alpa', jam2: 'Alpa' },
  ]);

  // Interactive state for Step 2
  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [riskAnalyzed, setRiskAnalyzed] = useState(true);

  // Interactive state for Step 3
  const [waSentStatus, setWaSentStatus] = useState<string | null>(null);

  const triggerAnalyze = () => {
    setAnalyzingRisk(true);
    setTimeout(() => {
      setAnalyzingRisk(false);
      setRiskAnalyzed(true);
    }, 600);
  };

  const handleSimulateWa = () => {
    setWaSentStatus('Membuka tautan resmi wa.me/6281234567890...');
    setTimeout(() => {
      setWaSentStatus('Draft pesan santun terkirim ke WhatsApp wali murid');
    }, 1200);
  };

  const updateAttendanceStatus = (id: number, status: string) => {
    setMockAttendance((prev) =>
      prev.map((item) => (item.id === id ? { ...item, jam2: status } : item))
    );
  };

  // GSAP ScrollTrigger Setup
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    // Use GSAP context for proper cleanup in React
    const ctx = gsap.context(() => {
      // Pinned horizontal scrub
      const totalPanels = 3;
      gsap.to(track, {
        xPercent: -((totalPanels - 1) / totalPanels) * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          pin: true,
          scrub: 1,
          start: 'top top',
          end: '+=2400',
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.33) {
              setActiveStep(0);
            } else if (p < 0.67) {
              setActiveStep(1);
            } else {
              setActiveStep(2);
            }
          },
        },
      });

      // Refresh ScrollTrigger to ensure proper offsets
      ScrollTrigger.refresh();
    }, container);

    return () => {
      ctx.revert();
    };
  }, []);

  const scrollToStep = (index: number) => {
    setActiveStep(index);
    if (!containerRef.current) return;
    const triggers = ScrollTrigger.getAll();
    const targetTrigger = triggers.find((t) => t.trigger === containerRef.current);
    if (targetTrigger) {
      const start = targetTrigger.start;
      const end = targetTrigger.end;
      const targetScroll = start + (index / 2) * (end - start);
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="scrollytelling"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#F3F7FE] dark:bg-[#071325] transition-colors duration-200 overflow-hidden flex flex-col justify-between py-10"
    >
      {/* Hidden Navigation Anchors */}
      <div id="alur-estafet" className="absolute top-0 pointer-events-none" />
      <div id="ai-care" className="absolute top-0 pointer-events-none" />
      <div id="wa-bridge" className="absolute top-0 pointer-events-none" />

      {/* Top Header & Step Navigation Bar */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-2 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4EBF6] dark:border-[#1D3756] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 text-[#1351C6] dark:text-[#04B9E8] text-xs font-bold uppercase tracking-wider mb-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>GSAP ScrollTrigger Scrollytelling</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#172944] dark:text-white tracking-tight">
              Alur Kerja 3 Langkah EduNotify
            </h2>
          </div>

          {/* Interactive Step Buttons */}
          <div className="flex items-center gap-2">
            {[
              { num: '01', label: 'Presensi Estafet' },
              { num: '02', label: 'AI Early Warning' },
              { num: '03', label: 'Jembatan WhatsApp' },
            ].map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => scrollToStep(idx)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 border ${
                    isActive
                      ? 'bg-[#1351C6] text-white border-[#1351C6] shadow-md shadow-[#1351C6]/20'
                      : 'bg-white/80 dark:bg-[#0D2037]/80 text-[#72849D] dark:text-[#91A9C6] border-[#E4EBF6] dark:border-[#1D3756] hover:border-[#04B9E8]/50 hover:text-[#172944] dark:hover:text-white'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white text-[#1351C6]'
                        : 'bg-[#F3F7FE] dark:bg-[#1D3756] text-[#72849D] dark:text-[#91A9C6]'
                    }`}
                  >
                    {step.num}
                  </span>
                  <span className="hidden md:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Horizontal Track (3 Slides) */}
      <div className="relative z-10 w-full overflow-hidden flex-1 flex items-center">
        <div
          ref={trackRef}
          className="flex flex-nowrap w-[300vw] h-full items-center will-change-transform"
        >
          {/* ========================================================= */}
          {/* SLIDE 01: Presensi Estafet                                */}
          {/* ========================================================= */}
          <div className="w-[100vw] px-4 sm:px-8 lg:px-12 shrink-0 flex items-center justify-center">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* Left Column: Story & Giant Number */}
              <div className="lg:col-span-5 flex flex-col justify-center relative">
                {/* Minimalist Giant Number */}
                <div className="text-7xl sm:text-9xl font-black text-[#1351C6]/15 dark:text-[#04B9E8]/20 tracking-tighter select-none font-mono leading-none -mb-4 sm:-mb-6">
                  01
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 text-[#1351C6] dark:text-[#04B9E8] text-xs font-bold tracking-widest uppercase mb-3 w-fit">
                  <span>Langkah 01: Presensi Estafet</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-[#172944] dark:text-white tracking-tight leading-tight mb-3">
                  Pencatatan Presensi Real-Time{' '}
                  <span className="italic text-[#04B9E8]">Per Jam Pelajaran</span>
                </h3>

                <p className="text-sm sm:text-base text-[#52647E] dark:text-[#91A9C6] leading-relaxed mb-6">
                  Setiap guru mata pelajaran mencatat kehadiran siswa langsung pada jam aktifnya. Sistem otomatis merekonsiliasi kehadiran secara estafet dari Jam 1 ke Jam 2 tanpa tumpang tindih jadwal.
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Anti-Konflik:</strong> Mencegah bentrok input antara guru mapel di kelas yang sama</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Rekonsiliasi Estafet:</strong> Status hadir atau alpa jam sebelumnya diteruskan otomatis</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Hemat Waktu:</strong> Memangkas rekap manual wali kelas hingga 85% setiap hari</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Web Component UI Mockup (Zero AI Slop) */}
              <div className="lg:col-span-7">
                <div className="relative rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-[#0D2037]/90 border border-[#E4EBF6] dark:border-[#1D3756] p-4 sm:p-6 shadow-2xl shadow-[#1351C6]/10 dark:shadow-black/50">
                  {/* Mockup Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-[#E4EBF6] dark:border-[#1D3756] gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#35E6BD] shadow-[0_0_6px_#35E6BD]" />
                      <div>
                        <div className="text-xs font-bold text-[#172944] dark:text-white">
                          Kelas XII MIPA 1 &bull; Presensi Estafet
                        </div>
                        <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                          Jumat, 23 Oktober 2026 &bull; Jam Ke-2 Berjalan
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#35E6BD]/15 text-[#0F8266] dark:text-[#35E6BD] font-bold text-[11px] self-start sm:self-auto">
                      Sinkronisasi Estafet Aktif
                    </span>
                  </div>

                  {/* Teacher Relay Transition Indicator: Guru Jam 1 ➔ Jam 2 */}
                  <div className="p-3 rounded-2xl bg-[#F3F7FE] dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 text-[#1351C6] dark:text-[#04B9E8] flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <div className="font-bold text-[#172944] dark:text-white">Pak Hendra Pratama, S.Pd</div>
                        <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">Jam 1 (07:00-07:45) &bull; Matematika &bull; Terkunci</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[#04B9E8] font-bold text-xs">
                      <span>➔</span>
                      <span className="text-[10px] uppercase tracking-wider">Estafet</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#04B9E8]/20 text-[#04B9E8] flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <div className="font-bold text-[#172944] dark:text-white">Ibu Siti Rahma, M.Pd</div>
                        <div className="text-[10px] text-[#04B9E8] font-semibold">Jam 2 (07:45-08:30) &bull; Fisika &bull; Input Aktif</div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Attendance Table Mockup */}
                  <div className="overflow-x-auto rounded-2xl border border-[#E4EBF6] dark:border-[#1D3756]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3F7FE] dark:bg-[#071325] text-[#72849D] dark:text-[#91A9C6] font-semibold border-b border-[#E4EBF6] dark:border-[#1D3756]">
                        <tr>
                          <th className="p-2.5">Siswa</th>
                          <th className="p-2.5">Jam 1</th>
                          <th className="p-2.5">Jam 2 (Klik Status)</th>
                          <th className="p-2.5">Status Estafet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#1D3756] text-[#172944] dark:text-[#EAF5FF]">
                        {mockAttendance.map((row) => (
                          <tr key={row.id} className="hover:bg-[#F3F7FE]/50 dark:hover:bg-[#071325]/50 transition-colors">
                            <td className="p-2.5 font-medium">
                              <div>{row.name}</div>
                              <div className="text-[10px] text-[#72849D] dark:text-[#91A9C6]">NIS: {row.nis}</div>
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                  row.jam1 === 'Hadir'
                                    ? 'bg-[#35E6BD]/15 text-[#0F8266] dark:text-[#35E6BD]'
                                    : row.jam1 === 'Izin'
                                    ? 'bg-[#FFAA00]/15 text-[#B27200] dark:text-[#FFAA00]'
                                    : 'bg-[#FF4D4F]/15 text-[#D62828] dark:text-[#FF4D4F]'
                                }`}
                              >
                                {row.jam1}
                              </span>
                            </td>
                            <td className="p-2.5">
                              {/* Status Toggle Buttons */}
                              <div className="inline-flex rounded-lg border border-[#E4EBF6] dark:border-[#1D3756] p-0.5 bg-[#F3F7FE] dark:bg-[#071325] gap-0.5">
                                {['Hadir', 'Izin', 'Alpa'].map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => updateAttendanceStatus(row.id, st)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                      row.jam2 === st
                                        ? st === 'Hadir'
                                          ? 'bg-[#35E6BD] text-[#071325] shadow-xs'
                                          : st === 'Izin'
                                          ? 'bg-[#FFAA00] text-[#071325] shadow-xs'
                                          : 'bg-[#FF4D4F] text-white shadow-xs'
                                        : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-white'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className="text-[10px] text-[#35E6BD] flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Rekonsiliasi OK
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Verification Note */}
                  <div className="mt-3.5 pt-2.5 border-t border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-between text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                    <span>Klik tombol status untuk mencoba interaksi presensi estafet</span>
                    <span className="font-semibold text-[#1351C6] dark:text-[#04B9E8]">100% Bebas Bentrok Jadwal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SLIDE 02: AI Early Warning                                */}
          {/* ========================================================= */}
          <div className="w-[100vw] px-4 sm:px-8 lg:px-12 shrink-0 flex items-center justify-center">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* Left Column: Story & Giant Number */}
              <div className="lg:col-span-5 flex flex-col justify-center relative">
                {/* Minimalist Giant Number */}
                <div className="text-7xl sm:text-9xl font-black text-[#1351C6]/15 dark:text-[#04B9E8]/20 tracking-tighter select-none font-mono leading-none -mb-4 sm:-mb-6">
                  02
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#04B9E8]/10 text-[#04B9E8] text-xs font-bold tracking-widest uppercase mb-3 w-fit">
                  <span>Langkah 02: AI Early Warning</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-[#172944] dark:text-white tracking-tight leading-tight mb-3">
                  Deteksi Dini Siswa Berisiko{' '}
                  <span className="italic text-[#04B9E8]">Analitik Empati</span>
                </h3>

                <p className="text-sm sm:text-base text-[#52647E] dark:text-[#91A9C6] leading-relaxed mb-6">
                  Mesin aturan deterministik bekerja sama dengan modul analitik AI untuk mendeteksi alpa beruntun secara dini. Wali kelas menerima narasi rekomendasi solutif berbasis empati sebelum masalah kehadiran menjadi kronis.
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Deterministic Engine:</strong> Deteksi instan alpa 3 hari beruntun atau anomali hari tertentu</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Rekomendasi Non-Punitif:</strong> Pendekatan santun tanpa bahasa menghakimi atau menyudutkan</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Multi-Level Risk Score:</strong> Klasifikasi visual risiko Tinggi, Sedang, dan Rendah</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Web Component UI Mockup (Zero AI Slop) */}
              <div className="lg:col-span-7">
                <div className="relative rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-[#0D2037]/90 border border-[#E4EBF6] dark:border-[#1D3756] p-4 sm:p-6 shadow-2xl shadow-[#1351C6]/10 dark:shadow-black/50">
                  {/* Mockup Top Header with Status Pulse */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-[#E4EBF6] dark:border-[#1D3756] gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Real status indicator dot with pulse */}
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35E6BD] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#35E6BD]"></span>
                      </span>
                      <div>
                        <div className="text-xs font-bold text-[#172944] dark:text-white">
                          Modul EWS Deterministik & AI Insight
                        </div>
                        <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                          Evaluasi Otomatis Siklus Presensi Mingguan
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={triggerAnalyze}
                      disabled={analyzingRisk}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 text-[#1351C6] dark:text-[#04B9E8] hover:bg-[#1351C6]/20 text-xs font-bold transition-colors self-start sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${analyzingRisk ? 'animate-spin' : ''}`} />
                      <span>{analyzingRisk ? 'Menganalisis...' : 'Refresh Analisis'}</span>
                    </button>
                  </div>

                  {/* Card 1: High Risk Student with Non-Punitive Advice */}
                  <div className="p-3.5 rounded-2xl bg-[#FF4D4F]/10 border border-[#FF4D4F]/25 mb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#FF4D4F]">Farhan Maulana (XII MIPA 1)</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FF4D4F] text-white font-extrabold text-[10px]">
                            Risiko Tinggi (Skor 88/100)
                          </span>
                        </div>
                        <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-0.5">
                          Pemicu: Alpa 3 hari berturut-turut pada jam pelajaran awal (Senin-Rabu-Jumat)
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#071325]/70 border border-[#FF4D4F]/20 text-xs">
                      <div className="text-[10px] font-bold text-[#FF4D4F] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-[#35E6BD]" />
                        <span>Rekomendasi Non-Punitif AI untuk Wali Kelas:</span>
                      </div>
                      <p className="text-[11px] text-[#172944] dark:text-[#EAF5FF] leading-relaxed">
                        &ldquo;Hubungi wali murid dengan hangat untuk memastikan kondisi kesehatan Farhan atau ada kendala transportasi. Berikan ruang dialog tanpa memberikan sanksi terburu-buru.&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Medium Risk Student */}
                  <div className="p-3.5 rounded-2xl bg-[#FFAA00]/10 border border-[#FFAA00]/25">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#B27200] dark:text-[#FFAA00]">Citra Dewi (XII MIPA 1)</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFAA00] text-[#071325] font-extrabold text-[10px]">
                            Risiko Sedang (Skor 52/100)
                          </span>
                        </div>
                        <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6] mt-0.5">
                          Pola: Terdeteksi 2x izin sakit dalam 7 hari terakhir
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-[#071325]/70 border border-[#FFAA00]/20 text-xs">
                      <div className="text-[10px] font-bold text-[#FFAA00] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-[#35E6BD]" />
                        <span>Rekomendasi Pendampingan:</span>
                      </div>
                      <p className="text-[11px] text-[#172944] dark:text-[#EAF5FF] leading-relaxed">
                        &ldquo;Tanyakan kabar kesembuhan ananda saat kembali masuk sekolah dan tawarkan modul rangkuman materi pelajaran yang tertinggal.&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Bottom Verification Note */}
                  <div className="mt-3.5 pt-2.5 border-t border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-between text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                    <span>Aturan deterministik mencegah salah klasifikasi siswa</span>
                    <span className="font-semibold text-[#35E6BD]">EWS Terintegrasi Real-Time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SLIDE 03: Jembatan WhatsApp                               */}
          {/* ========================================================= */}
          <div className="w-[100vw] px-4 sm:px-8 lg:px-12 shrink-0 flex items-center justify-center">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              {/* Left Column: Story & Giant Number */}
              <div className="lg:col-span-5 flex flex-col justify-center relative">
                {/* Minimalist Giant Number */}
                <div className="text-7xl sm:text-9xl font-black text-[#1351C6]/15 dark:text-[#04B9E8]/20 tracking-tighter select-none font-mono leading-none -mb-4 sm:-mb-6">
                  03
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#25D366]/10 text-[#0F8266] dark:text-[#25D366] text-xs font-bold tracking-widest uppercase mb-3 w-fit">
                  <span>Langkah 03: Jembatan WhatsApp</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-[#172944] dark:text-white tracking-tight leading-tight mb-3">
                  Jembatan Komunikasi Langsung{' '}
                  <span className="italic text-[#04B9E8]">Ke Orang Tua</span>
                </h3>

                <p className="text-sm sm:text-base text-[#52647E] dark:text-[#91A9C6] leading-relaxed mb-6">
                  Hubungkan kepedulian sekolah langsung ke wali murid melalui WhatsApp Click-to-Chat transparan. Wali kelas dapat memverifikasi dan mengirimkan pesan kehadiran yang santun dalam satu klik tanpa bot pengirim gelap.
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Draft Santun Otomatis:</strong> Pesan resmi terisi nama siswa, tanggal, dan rekap jam pelajaran</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>Verifikasi Manual Wali Kelas:</strong> Menghindari klaim log pengiriman palsu atau manipulasi status</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172944] dark:text-[#EAF5FF]">
                    <CheckCircle2 className="w-4 h-4 text-[#35E6BD] shrink-0 mt-0.5" />
                    <span><strong>WhatsApp Resmi (wa.me):</strong> Membuka aplikasi WhatsApp resmi dengan nomor terdaftar</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Web Component UI Mockup (Zero AI Slop) */}
              <div className="lg:col-span-7">
                <div className="relative rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-[#0D2037]/90 border border-[#E4EBF6] dark:border-[#1D3756] p-4 sm:p-6 shadow-2xl shadow-[#1351C6]/10 dark:shadow-black/50">
                  {/* Mockup Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-[#E4EBF6] dark:border-[#1D3756] gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#172944] dark:text-white">
                          Jembatan Komunikasi WhatsApp
                        </div>
                        <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                          Wali Murid Farhan Maulana (0812-3456-7890)
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 text-[#1351C6] dark:text-[#04B9E8] font-bold text-[11px] self-start sm:self-auto flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#35E6BD]" />
                      <span>Verifikasi Manual</span>
                    </span>
                  </div>

                  {/* Realistic WhatsApp Chat Bubble Mockup */}
                  <div className="p-4 rounded-2xl bg-[#EFEAE2] dark:bg-[#0B141A] border border-[#E4EBF6] dark:border-[#1D3756] mb-4">
                    <div className="max-w-md ml-auto rounded-2xl rounded-tr-xs bg-[#E7FFDB] dark:bg-[#005C4B] p-3 text-xs shadow-sm text-[#111B21] dark:text-[#E9EDEF]">
                      <div className="font-bold text-[#0F8266] dark:text-[#25D366] text-[11px] mb-1">
                        Pesan Otomatis Sekolah &bull; EduNotify
                      </div>
                      <p className="leading-relaxed text-[11px] mb-2">
                        Assalamu&apos;alaikum Wr. Wb. Selamat pagi Bapak/Ibu Wali dari <strong>Farhan Maulana</strong> (Kelas XII MIPA 1).
                      </p>
                      <p className="leading-relaxed text-[11px] mb-2">
                        Kami mengonfirmasi bahwa ananda tercatat belum hadir di sekolah pada hari <strong>Jumat, 23 Oktober 2026</strong>. Mohon kabar jika ananda sedang sakit atau ada kendala lain.
                      </p>
                      <p className="leading-relaxed text-[11px]">
                        Kesehatan dan kehadiran ananda adalah prioritas kami bersama. Terima kasih atas kerja samanya.
                      </p>
                      <div className="text-right text-[9px] text-[#667781] dark:text-[#8696A0] mt-1">
                        08:15 WIB &bull; Draft Siap Kirim
                      </div>
                    </div>
                  </div>

                  {/* Interactive WhatsApp Click-to-Chat Action Bar */}
                  <div className="p-3.5 rounded-2xl bg-[#F3F7FE] dark:bg-[#071325] border border-[#E4EBF6] dark:border-[#1D3756] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[#172944] dark:text-white flex items-center gap-1.5">
                        <span>Pesan Siap Ditinjau</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#35E6BD]" />
                      </div>
                      <div className="text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                        Klik tombol untuk menyimulasikan pembukaan WhatsApp resmi
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateWa}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md shadow-[#25D366]/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Buka WhatsApp Click-to-Chat</span>
                    </button>
                  </div>

                  {/* Feedback on click */}
                  {waSentStatus && (
                    <div className="mt-2.5 p-2 rounded-xl bg-[#25D366]/10 text-[#0F8266] dark:text-[#25D366] text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{waSentStatus}</span>
                    </div>
                  )}

                  {/* Bottom Verification Note */}
                  <div className="mt-3.5 pt-2.5 border-t border-[#E4EBF6] dark:border-[#1D3756] flex items-center justify-between text-[11px] text-[#72849D] dark:text-[#91A9C6]">
                    <span>Tautan resmi https://wa.me/ dengan nomor wali murid terverifikasi</span>
                    <span className="font-semibold text-[#25D366]">100% Transparan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Subtle Scroll Indicator */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 w-full pt-2 flex items-center justify-between text-xs text-[#72849D] dark:text-[#91A9C6]">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#04B9E8]" />
          <span>Scroll ke bawah untuk menggeser alur langkah 01 ➔ 02 ➔ 03</span>
        </span>
        <span className="font-semibold text-[#1351C6] dark:text-[#04B9E8]">
          Langkah {activeStep + 1} dari 3
        </span>
      </div>
    </section>
  );
}
