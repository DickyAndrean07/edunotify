'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Film, Sparkles, Volume2, VolumeX, Maximize2 } from 'lucide-react';

export function LandingVideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section id="video-showcase" className="relative py-20 px-4 sm:px-6 max-w-6xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1351C6]/10 dark:bg-[#04B9E8]/10 border border-[#1351C6]/20 dark:border-[#04B9E8]/30 text-[#1351C6] dark:text-[#04B9E8] text-xs font-bold uppercase tracking-wider mb-4">
          <Film className="w-3.5 h-3.5" />
          <span>Video Showcase Produk 12 Detik</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#172944] dark:text-white tracking-tight leading-tight mb-4">
          Simak Animasi Visual EduNotify
        </h2>

        <p className="text-base sm:text-lg text-[#72849D] dark:text-[#91A9C6] leading-relaxed">
          Dirancang dengan teknologi HyperFrames (HTML + GSAP Motion) menghasilkan rendering MP4 1080p yang jernih, tajam, dan memvisualisasikan ekosistem presensi estafet secara utuh.
        </p>
      </div>

      {/* Video Player Container */}
      <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-[#0D2037]/80 border border-[#E4EBF6] dark:border-[#1D3756] p-3 sm:p-5 shadow-2xl shadow-[#1351C6]/15 dark:shadow-black/60 group">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#1D3756]/60">
          <video
            ref={videoRef}
            src="/videos/edunotify-showcase.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Floating Top Tag */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md bg-black/60 border border-white/20 text-white text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#04B9E8]" />
            <span>HyperFrames + GSAP 1080p Showcase</span>
          </div>

          {/* Floating Center Play/Pause Overlay Button */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition-colors group/btn"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full backdrop-blur-md bg-white/20 dark:bg-black/40 border border-white/40 flex items-center justify-center text-white shadow-2xl transition-transform duration-300 group-hover/btn:scale-110">
              {isPlaying ? (
                <Pause className="w-7 h-7 sm:w-8 sm:h-8 opacity-80 group-hover/btn:opacity-100" />
              ) : (
                <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 opacity-90 group-hover/btn:opacity-100" />
              )}
            </div>
          </button>

          {/* Bottom Video Controls Bar */}
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl backdrop-blur-md bg-black/60 border border-white/10 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="hover:text-[#04B9E8] transition-colors"
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="hover:text-[#04B9E8] transition-colors"
                title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="font-mono text-[11px] text-gray-300">00:00 / 00:12</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#04B9E8]">
              <span className="w-2 h-2 rounded-full bg-[#35E6BD] animate-pulse" />
              <span>Full HD 1920x1080</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}