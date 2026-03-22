import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';

const adminLinks = [
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/venues', label: 'Venues' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6 border-b border-dark-100 pb-4">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-dark-600 hover:text-cupid-500 px-3 py-1.5"
            >
              {link.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
