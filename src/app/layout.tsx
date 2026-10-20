import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Homebrew Recipe Studio | Grain, Honey, Sugar, Hop & Yeast Formulator',
  description:
    'Formulate all-grain, BIAB, partial-mash, and extract homebrew recipes with live OG/FG/ABV/IBU/SRM calculations, honey & sugar fermentability modeling, inventory tracking, water chemistry, and brew day timers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-[#3B82F6] selection:text-white">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
