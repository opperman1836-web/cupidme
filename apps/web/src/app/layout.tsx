import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'CupidMe - Where Love Is Earned',
  description: 'A dating platform where meaningful connections are built through effort, challenges, and real experiences. Find love, earn dates, discover amazing venues.',
  keywords: ['dating', 'love', 'relationships', 'venues', 'dates', 'challenges', 'AI matching'],
  openGraph: {
    title: 'CupidMe - Where Love Is Earned',
    description: 'No mindless swiping. Prove you care through AI-powered challenges, build real connections, and unlock sponsored dates at amazing venues.',
    type: 'website',
    url: 'https://cupidme.org',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CupidMe - Where Love Is Earned',
    description: 'The dating revolution. Earn your dates through challenges and build real connections.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#F43F5E" />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
