'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Tag, BarChart3, QrCode, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function VenueDashboardPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/venues/my/venues', token!);
        setVenues(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-900">Venue Dashboard</h1>
        <Link href="/dashboard/register">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Venue</Button>
        </Link>
      </div>

      {venues.length === 0 ? (
        <Card className="text-center py-12">
          <Store className="w-12 h-12 text-dark-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-dark-700">No venues registered</h2>
          <p className="text-dark-500 mt-2">Register your business to start sponsoring dates!</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {venues.map((venue) => (
            <Card key={venue.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-dark-900">{venue.name}</h3>
                  <p className="text-sm text-dark-500">{venue.address}, {venue.city}</p>
                </div>
                <Badge variant={venue.status === 'approved' ? 'success' : 'warning'}>
                  {venue.status}
                </Badge>
              </div>
              <div className="flex gap-3 mt-4">
                <Link href={`/offers?venue=${venue.id}`}>
                  <Button variant="outline" size="sm"><Tag className="w-4 h-4 mr-1" /> Offers</Button>
                </Link>
                <Link href={`/analytics?venue=${venue.id}`}>
                  <Button variant="outline" size="sm"><BarChart3 className="w-4 h-4 mr-1" /> Analytics</Button>
                </Link>
                <Link href={`/redemptions?venue=${venue.id}`}>
                  <Button variant="outline" size="sm"><QrCode className="w-4 h-4 mr-1" /> Scan QR</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
