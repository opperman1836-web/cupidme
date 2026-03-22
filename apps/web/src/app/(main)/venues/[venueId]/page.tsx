'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Globe, Phone, Tag, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function VenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>(`/api/venues/${venueId}`);
        setVenue(res.data);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [venueId]);

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;
  if (!venue) return <div className="text-center py-20 text-dark-400">Venue not found.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {venue.cover_image_url && (
        <img src={venue.cover_image_url} alt={venue.name} className="w-full h-64 object-cover rounded-2xl mb-6" />
      )}

      <h1 className="text-3xl font-bold text-dark-900">{venue.name}</h1>
      <div className="flex items-center gap-4 mt-2 text-dark-500">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" /> {venue.address}, {venue.city}
        </div>
        <Badge>{venue.category.replace('_', ' ')}</Badge>
      </div>

      {venue.description && <p className="text-dark-600 mt-4">{venue.description}</p>}

      <div className="flex gap-4 mt-4">
        {venue.website && (
          <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-cupid-500 hover:underline">
            <Globe className="w-4 h-4" /> Website
          </a>
        )}
        {venue.phone && (
          <a href={`tel:${venue.phone}`} className="flex items-center gap-1 text-sm text-dark-500">
            <Phone className="w-4 h-4" /> {venue.phone}
          </a>
        )}
      </div>

      {/* Offers */}
      {venue.venue_offers?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-dark-900 mb-4">Active Offers</h2>
          <div className="grid gap-4">
            {venue.venue_offers.map((offer: any) => (
              <Card key={offer.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-dark-900">{offer.title}</h3>
                    <p className="text-sm text-dark-500 mt-1">{offer.description}</p>
                  </div>
                  <Badge variant="success">
                    {offer.offer_type.replace('_', ' ')}
                    {offer.discount_value ? ` ${offer.discount_value}%` : ''}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Min level: {offer.min_connection_level}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Until {formatDate(offer.valid_until)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
