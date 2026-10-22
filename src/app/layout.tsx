import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduNotify — Presensi Siswa & EWS Multitenant',
  description:
    'Platform presensi siswa berbasis alur jadwal pelajaran estafet dengan Early Warning System dan narasi analitik AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased dark">
      <body className="min-h-full bg-neutral-950 text-neutral-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
