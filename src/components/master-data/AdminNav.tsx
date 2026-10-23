'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DoorOpen,
  CalendarDays,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard, exact: true },
  { href: '/admin/reports', label: 'Laporan & Ekspor', icon: FileSpreadsheet },
  { href: '/admin/students', label: 'Data Siswa', icon: GraduationCap },
  { href: '/admin/teachers', label: 'Guru & Staf', icon: Users },
  { href: '/admin/classes', label: 'Kelas & Rombel', icon: DoorOpen },
  { href: '/admin/schedules', label: 'Jadwal Pelajaran', icon: Clock },
  { href: '/admin/calendar', label: 'Kalender Akademik', icon: CalendarDays },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-[#E4EBF6] dark:border-[#1D3756] scrollbar-none transition-colors">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-[#1351C6]/10 text-[#1351C6] dark:text-[#04B9E8] border border-[#1351C6]/30 dark:border-[#1684FF]/40 shadow-sm'
                : 'text-[#72849D] dark:text-[#91A9C6] hover:text-[#172944] dark:hover:text-[#EAF5FF] hover:bg-white dark:hover:bg-[#0D2037] border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
