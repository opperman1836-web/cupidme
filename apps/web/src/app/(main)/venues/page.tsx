'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Tag, Coffee, Utensils, Wine, Hotel, Sparkles,
  Search, SlidersHorizontal, Star, Gift,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

const categories = [
  { value: '', label: 'All', icon: MapPin },
  { value: 'cafe', label: 'Cafes', icon: Coffee },
  { value: 'restaurant', label: 'Restaurants', icon: Utensils },
  { value: 'bar_lounge', label: 'Bars', icon: Wine },
  { value: 'hotel', label: 'Hotels', icon: Hotel },
  { value: 'experience', label: 'Experiences', icon: Sparkles },
];

const categoryIcons: Record<string, any> = {
  cafe: Coffee,
  restaurant: Utensils,
  bar_lounge: Wine,
  hotel: Hotel,
  experience: Sparkles,
};

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

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

  const filteredVenues = venues.filter((v) => {
    const matchesSearch = !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || v.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cupid-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-dark-900">Date Venues</h1>
        <p className="text-dark-500 mt-1">
          Discover amazing places for your next date. Unlock exclusive offers as your connection grows!
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues by name or city..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-dark-200 bg-white focus:border-cupid-500 focus:ring-2 focus:ring-cupid-100 focus:outline-none transition-all"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const active = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-cupid-500 text-white shadow-lg shadow-cupid-500/25'
                    : 'bg-white text-dark-600 border border-dark-200 hover:border-cupid-200'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Venues grid */}
      {filteredVenues.length === 0 ? (
        <div className="text-center py-20">
          <MapPin className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-dark-500">No venues found</h2>
          <p className="text-dark-400 mt-1 text-sm">Try adjusting your filters or search.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVenues.map((venue, i) => {
            const CategoryIcon = categoryIcons[venue.category] || MapPin;
            const offerCount = venue.venue_offers?.[0]?.count || 0;
            return (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/venues/${venue.id}`}>
                  <Card hover className="overflow-hidden p-0 h-full">
                    {/* Image */}
                    <div className="h-44 bg-dark-100 relative overflow-hidden">
                      {venue.cover_image_url ? (
                        <img
                          src={venue.cover_image_url}
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cupid-50 to-cupid-100">
                          <CategoryIcon className="w-12 h-12 text-cupid-300" />
                        </div>
                      )}
                      {offerCount > 0 && (
                        <div className="absolute top-3 right-3 bg-cupid-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Gift className="w-3 h-3" /> {offerCount} offer{offerCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-dark-900 text-lg leading-tight">{venue.name}</h3>
                        <Badge className="flex-shrink-0 text-xs">{venue.category.replace('_', ' ')}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-dark-500 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{venue.city}</span>
                      </div>
                      {venue.description && (
                        <p className="text-sm text-dark-500 mt-3 line-clamp-2 leading-relaxed">{venue.description}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
