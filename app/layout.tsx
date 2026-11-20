import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import SiteShell from '@/components/SiteShell';
import 'lenis/dist/lenis.css';
import './globals.css';

// Fonts are bundled with the site (latin subsets of the variable fonts), so builds never depend on Google
// and pages don't wait on a third-party font server.
const display = localFont({ src: './fonts/funnel-display.woff2', weight: '300 800', variable: '--font-display', display: 'swap' });
const body = localFont({ src: './fonts/instrument-sans.woff2', weight: '400 700', variable: '--font-body', display: 'swap' });
const pixel = localFont({ src: './fonts/silkscreen.woff2', weight: '400', variable: '--font-pixel', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Isaac Newking, Brand Designer', template: '%s, Isaac Newking' },
  description: 'Brand designer working across identity, motion and UI/UX for crypto founders, agencies and local businesses.',
  openGraph: { type: 'website', title: 'Isaac Newking, Brand Designer', images: ['/img/work/branding/eh-billboard.jpg'] },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#000000' };

// Sets the saved light/dark choice before first paint, so the page never flashes the wrong theme.
// Also skips the intro loader on repeat visits in the session and for reduced motion, before it can paint.
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}try{if(sessionStorage.getItem('in-intro')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('no-loader')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${pixel.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <SiteShell>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
