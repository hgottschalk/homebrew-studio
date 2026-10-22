import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Homebrew Recipe Studio | Grain, Honey, Sugar, Hop & Yeast Formulator',
  description:
    'Open-source all-grain, BIAB, partial-mash, and extract homebrew recipe formulator with live OG/FG/ABV/IBU/SRM calculations, honey & sugar fermentability modeling, inventory tracking, water chemistry, and brew day timers.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Brew Studio',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-[#3B82F6] selection:text-white"
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
