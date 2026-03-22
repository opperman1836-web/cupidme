import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'CupidMe - Where Love Is Earned',
  description: 'A dating platform where meaningful connections are built through effort, challenges, and real experiences.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
