import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { BarChart3, Sparkles, TrendingUp, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PrincipalDashboardPage() {
  const session = await getSession();
  if (
    !session ||
    (session.role !== 'KEPALA_SEKOLAH' && session.role !== 'ADMIN_SEKOLAH')
  ) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <DashboardHeader user={session} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-100">
            Eksekutif Kepala Sekolah
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Ringkasan kehadiran agregat sekolah, analisis AI, dan ekspor laporan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <TrendingUp className="w-6 h-6 text-emerald-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Tingkat Kehadiran Sekolah
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Metrik agregat & persentase kehadiran seluruh kelas
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Sparkles className="w-6 h-6 text-purple-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Ringkasan Naratif AI
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Narasi tren kehadiran & rekomendasi manajerial non-punitif
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <BarChart3 className="w-6 h-6 text-blue-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Komparasi Antarkelas
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Perbandingan pola presensi rombel dan tingkat risiko
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
            <Download className="w-6 h-6 text-amber-400 mb-3" />
            <div className="text-sm font-semibold text-neutral-200">
              Ekspor Laporan
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Unduh rekapitulasi formal format PDF dan Excel
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
