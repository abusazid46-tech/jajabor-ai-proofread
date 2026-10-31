import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jajabor AI Proofread — Multilingual Government Document Quality Assurance',
  description: 'Faster, More Consistent Multilingual Proofreading of Government Documents for Assam Directorate of Printing & Stationery (NESFIC-D-38).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-100 text-slate-800">
        {children}
      </body>
    </html>
  );
}
