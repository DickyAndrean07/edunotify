'use client';

import React from 'react';
import { ClassAttendanceComparison } from '@/services/reportService';
import { BarChart3, AlertTriangle, Users } from 'lucide-react';

interface ClassComparisonBarChartProps {
  data: ClassAttendanceComparison[];
  title?: string;
}

export function ClassComparisonBarChart({
  data,
  title = 'Perbandingan Persentase Kehadiran Antarkelas',
}: ClassComparisonBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center">
        <p className="text-sm text-neutral-400">
          Belum ada data komparasi kelas yang tersedia.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
        </div>
        <span className="text-xs text-neutral-400">
          Total {data.length} Rombel
        </span>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const rate = item.attendanceRate;
          let barBg = 'bg-emerald-500';
          let textColor = 'text-emerald-400';

          if (rate < 80) {
            barBg = 'bg-rose-500';
            textColor = 'text-rose-400';
          } else if (rate < 90) {
            barBg = 'bg-amber-500';
            textColor = 'text-amber-400';
          }

          return (
            <div key={item.classId} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold ${
                      item.rank === 1
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : item.rank === 2
                        ? 'bg-neutral-300/20 text-neutral-300'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    #{item.rank}
                  </span>
                  <span className="font-semibold text-neutral-200">
                    Kelas {item.className}
                  </span>
                  <span className="text-[11px] text-neutral-400 hidden sm:inline">
                    (Wali: {item.homeroomTeacherName || '-'})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {item.atRiskStudentsCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {item.atRiskStudentsCount} Siswa EWS
                    </span>
                  )}
                  <span className="text-neutral-400 text-[11px] hidden sm:inline flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {item.studentCount} siswa
                  </span>
                  <span className={`font-mono font-bold text-xs ${textColor}`}>
                    {rate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800/80 p-0.5 flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                  style={{ width: `${Math.min(Math.max(rate, 0), 100)}%` }}
                />
              </div>

              {/* Mini Details below bar */}
              <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1 px-1">
                <span>
                  Hadir: {item.hadirCount} | Sakit: {item.sakitCount} | Izin:{' '}
                  {item.izinCount} | Alpa: {item.alpaCount}
                </span>
                <span>Alpa: {item.alpaRate.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
