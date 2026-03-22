import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'New Skills Academy — Accredited Training',
  description: 'Certified caregiver courses. Job-ready healthcare skills in 3 months. No matric required.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
