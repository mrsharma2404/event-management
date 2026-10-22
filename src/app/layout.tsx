import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import { Header } from '@/components/layout/Header';
import { CtaBand, Footer, WhatsAppFab } from '@/components/layout/Footer';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { AuthModal } from '@/components/enquiry/AuthModal';
import { Toaster } from '@/components/ui/Toaster';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { SiteChrome } from '@/components/layout/SiteChrome';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'], weight: ['600', '700'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Crown & Co. Events — Book Weddings, Parties & Corporate Events', template: '%s | Crown & Co. Events' },
  description: 'Book curated wedding, birthday, corporate and destination event packages across India — instantly, or get a free custom quote from our planners.',
  openGraph: { siteName: 'Crown & Co. Events', type: 'website', locale: 'en_IN' },
};

export const viewport: Viewport = { themeColor: '#f2b91d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <StoreProvider>
          <SiteChrome><AnalyticsProvider /></SiteChrome>
          <SiteChrome><Header /></SiteChrome>
          <main id="main" className="min-h-[60vh]">{children}</main>
          <SiteChrome>
            <CtaBand />
            <Footer />
            <WhatsAppFab />
          </SiteChrome>
          <EnquiryModal />
          <AuthModal />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
