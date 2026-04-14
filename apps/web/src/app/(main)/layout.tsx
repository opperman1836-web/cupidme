import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProfileGate } from '@/components/ProfileGate';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <ProfileGate>{children}</ProfileGate>
      </main>
      <BottomNav />
    </div>
  );
}
