'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Star, Tag } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/venues');
        setVenues(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-20 text-dark-400">Loading venues...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Date Venues</h1>
      <p className="text-dark-500 mb-8">Discover amazing places for your next date. Unlock exclusive offers as your connection grows!</p>

      {venues.length === 0 ? (
        <div className="text-center py-20 text-dark-400">No venues available yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card hover>
                {venue.cover_image_url && (
                  <img src={venue.cover_image_url} alt={venue.name} className="w-full h-40 object-cover rounded-xl mb-4" />
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-dark-900">{venue.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-dark-500 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {venue.city}
                    </div>
                  </div>
                  <Badge>{venue.category.replace('_', ' ')}</Badge>
                </div>
                {venue.description && (
                  <p className="text-sm text-dark-500 mt-3 line-clamp-2">{venue.description}</p>
                )}
                {venue.venue_offers?.[0]?.count > 0 && (
                  <div className="flex items-center gap-1 text-sm text-cupid-500 font-medium mt-3">
                    <Tag className="w-3.5 h-3.5" />
                    {venue.venue_offers[0].count} active offer{venue.venue_offers[0].count > 1 ? 's' : ''}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
