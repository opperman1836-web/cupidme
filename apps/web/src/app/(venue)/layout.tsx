import { Navbar } from '@/components/layout/Navbar';

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
