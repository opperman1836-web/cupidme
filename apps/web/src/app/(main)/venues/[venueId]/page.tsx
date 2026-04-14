'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Phone, Globe, Tag, Gift, Coffee, Utensils,
  Wine, Hotel, Sparkles, QrCode, ArrowLeft, Lock,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

const categoryIcons: Record<string, any> = {
  cafe: Coffee,
  restaurant: Utensils,
  bar_lounge: Wine,
  hotel: Hotel,
  experience: Sparkles,
};

export default function VenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>(`/api/venues/${venueId}`, token || undefined);
        setVenue(res.data);
      } catch {
        addToast('Failed to load venue', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [venueId, token, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cupid-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-500">Venue not found.</p>
        <Link href="/venues" className="text-cupid-500 font-medium mt-2 inline-block">Back to Venues</Link>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[venue.category] || MapPin;
  const offers = venue.venue_offers || [];

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/venues" className="inline-flex items-center gap-1 text-dark-500 hover:text-cupid-500 mb-4 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> All Venues
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-6"
      >
        {venue.cover_image_url ? (
          <img src={venue.cover_image_url} alt={venue.name} className="w-full h-64 md:h-80 object-cover" />
        ) : (
          <div className="w-full h-64 md:h-80 bg-gradient-to-br from-cupid-100 to-cupid-200 flex items-center justify-center">
            <CategoryIcon className="w-20 h-20 text-cupid-400" />
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-8">
          <Badge className="mb-2">{venue.category.replace('_', ' ')}</Badge>
          <h1 className="text-3xl font-black text-white">{venue.name}</h1>
          <div className="flex items-center gap-1 text-white/80 mt-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{venue.address}, {venue.city}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {venue.description && (
            <Card>
              <h2 className="font-bold text-dark-900 mb-3">About</h2>
              <p className="text-dark-600 leading-relaxed">{venue.description}</p>
            </Card>
          )}

          {/* Offers */}
          <div>
            <h2 className="text-xl font-bold text-dark-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-cupid-500" /> Date Packages
            </h2>
            {offers.length > 0 ? (
              <div className="space-y-3">
                {offers.map((offer: any, i: number) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card hover className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-cupid-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        {offer.offer_type === 'free_item' && <Gift className="w-7 h-7 text-cupid-500" />}
                        {offer.offer_type === 'percentage_discount' && <Tag className="w-7 h-7 text-emerald-500" />}
                        {offer.offer_type === 'fixed_discount' && <Tag className="w-7 h-7 text-blue-500" />}
                        {offer.offer_type === 'special_experience' && <Sparkles className="w-7 h-7 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-dark-900">{offer.title}</h3>
                        <p className="text-sm text-dark-500 mt-0.5">{offer.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
                          {offer.discount_value && (
                            <span className="font-bold text-cupid-600 text-sm">
                              {offer.offer_type === 'percentage_discount' ? `${offer.discount_value}% OFF` : `R${offer.discount_value} OFF`}
                            </span>
                          )}
                          {offer.min_connection_level > 1 && (
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Level {offer.min_connection_level}+
                            </span>
                          )}
                          {offer.valid_until && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Until {formatDate(offer.valid_until)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button size="sm">Claim</Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <Gift className="w-8 h-8 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500 text-sm">No offers available yet. Check back soon!</p>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-dark-900 mb-4">Details</h3>
            <div className="space-y-3">
              {venue.phone && (
                <a href={`tel:${venue.phone}`} className="flex items-center gap-3 text-sm text-dark-600 hover:text-cupid-500">
                  <Phone className="w-4 h-4 text-dark-400" /> {venue.phone}
                </a>
              )}
              {venue.website && (
                <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-cupid-500 hover:underline">
                  <Globe className="w-4 h-4 text-dark-400" /> {venue.website.replace('https://', '')}
                </a>
              )}
              {venue.opening_hours && (
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-dark-400 mt-0.5" />
                  <span className="text-dark-600 whitespace-pre-line">{venue.opening_hours}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-cupid-50 border-cupid-100">
            <h3 className="font-bold text-cupid-800 mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4" /> How to Redeem
            </h3>
            <ol className="space-y-2 text-sm text-cupid-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-cupid-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                Claim an offer above
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-cupid-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                Show the QR code at the venue
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-cupid-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                Enjoy your date!
              </li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
