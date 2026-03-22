'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/admin/venues/pending', token!);
        setVenues(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  async function handleApproval(venueId: string, status: 'approved' | 'rejected') {
    try {
      await api.patch(`/api/admin/venues/${venueId}/approve`, { status }, token!);
      setVenues((prev) => prev.filter((v) => v.id !== venueId));
      addToast(`Venue ${status}`, 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  }

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Venue Approvals</h1>
      {venues.length === 0 ? (
        <p className="text-dark-400 text-center py-12">No pending venues.</p>
      ) : (
        <div className="space-y-4">
          {venues.map((venue) => (
            <Card key={venue.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-dark-900">{venue.name}</h3>
                  <p className="text-sm text-dark-500">{venue.address}, {venue.city}</p>
                  <p className="text-xs text-dark-400 mt-1">
                    Category: {venue.category} &middot; Owner: {venue.users?.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproval(venue.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handleApproval(venue.id, 'rejected')}>Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
