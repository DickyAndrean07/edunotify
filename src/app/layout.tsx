import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

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
    <html lang="id" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('edunotify-theme');
                if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#F3F7FE] text-[#172944] dark:bg-[#071325] dark:text-[#EAF5FF] flex flex-col font-sans transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
