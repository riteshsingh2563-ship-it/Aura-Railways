import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aura Railways — Intelligent Railway Journey Engine',
  description: 'Automated multi-leg train journey planning, real-time interchange discovery, live delay risk analysis, and station boards across Indian Railways.',
  icons: {
    icon: '/brand/aura_logo.png',
    apple: '/brand/aura_logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-aura-dark text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="min-h-screen flex flex-col justify-between max-w-md md:max-w-2xl lg:max-w-5xl mx-auto shadow-2xl relative">
          {children}
        </div>
      </body>
    </html>
  );
}
