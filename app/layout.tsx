import './globals.css';

export const metadata = {
  title: 'New Skills Academy — Caregiver Course',
  description: 'Certified caregiver course for R2000. No matric needed. Start immediately.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
