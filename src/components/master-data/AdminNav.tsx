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
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard, exact: true },
  { href: '/admin/students', label: 'Data Siswa', icon: GraduationCap },
  { href: '/admin/teachers', label: 'Guru & Staf', icon: Users },
  { href: '/admin/classes', label: 'Kelas & Rombel', icon: DoorOpen },
  { href: '/admin/schedules', label: 'Jadwal Pelajaran', icon: Clock },
  { href: '/admin/calendar', label: 'Kalender Akademik', icon: CalendarDays },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-neutral-800 scrollbar-none">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
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
