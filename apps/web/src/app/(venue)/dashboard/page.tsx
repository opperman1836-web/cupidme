'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Store, Tag, BarChart3, QrCode, Plus, TrendingUp, Users, Eye,
  DollarSign, Calendar, ArrowUpRight, Gift, MapPin, Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface VenueAnalytics {
  total_offers: number;
  total_redemptions: number;
  total_views?: number;
  revenue?: number;
}

export default function VenueDashboardPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, VenueAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'analytics'>('overview');
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/venues/my/venues', token!);
        const venueList = res.data || [];
        setVenues(venueList);

        // Fetch analytics for each venue
        const analyticsMap: Record<string, VenueAnalytics> = {};
        await Promise.all(
          venueList.map(async (v: any) => {
            try {
              const a = await api.get<any>(`/api/venues/${v.id}/analytics`, token!);
              analyticsMap[v.id] = a.data || {};
            } catch {
              analyticsMap[v.id] = { total_offers: 0, total_redemptions: 0 };
            }
          })
        );
        setAnalytics(analyticsMap);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cupid-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalOffers = Object.values(analytics).reduce((sum, a) => sum + (a.total_offers || 0), 0);
  const totalRedemptions = Object.values(analytics).reduce((sum, a) => sum + (a.total_redemptions || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark-900">Business Dashboard</h1>
          <p className="text-dark-500 mt-1">Manage your venues, offers, and track performance</p>
        </div>
        <Link href="/register">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add Venue
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Store, label: 'Active Venues', value: venues.filter((v) => v.status === 'approved').length, color: 'text-blue-500 bg-blue-50' },
          { icon: Tag, label: 'Active Offers', value: totalOffers, color: 'text-cupid-500 bg-cupid-50' },
          { icon: QrCode, label: 'Redemptions', value: totalRedemptions, color: 'text-emerald-500 bg-emerald-50' },
          { icon: TrendingUp, label: 'Conversion Rate', value: totalOffers > 0 ? `${Math.round((totalRedemptions / totalOffers) * 100)}%` : '0%', color: 'text-amber-500 bg-amber-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-dark-900">{stat.value}</p>
                <p className="text-sm text-dark-500">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-dark-100 rounded-2xl p-1 mb-6 max-w-md">
        {(['overview', 'offers', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Venues List */}
      {venues.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="text-center py-16">
            <div className="w-20 h-20 bg-dark-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-dark-300" />
            </div>
            <h2 className="text-xl font-bold text-dark-700">No venues registered</h2>
            <p className="text-dark-500 mt-2 max-w-md mx-auto">
              Register your business to start sponsoring dates and attracting couples!
            </p>
            <Link href="/register" className="inline-block mt-6">
              <Button><Plus className="w-4 h-4 mr-2" /> Register Your Venue</Button>
            </Link>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {venues.map((venue, i) => {
            const va = analytics[venue.id] || { total_offers: 0, total_redemptions: 0 };
            return (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Venue image */}
                    {venue.cover_image_url && (
                      <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                        <img
                          src={venue.cover_image_url}
                          alt={venue.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-dark-900">{venue.name}</h3>
                            <Badge variant={venue.status === 'approved' ? 'success' : venue.status === 'rejected' ? 'danger' : 'warning'}>
                              {venue.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-dark-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {venue.address}, {venue.city}
                          </p>
                        </div>
                      </div>

                      {/* Mini stats */}
                      <div className="flex gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-cupid-500" />
                          <span className="text-sm"><strong>{va.total_offers}</strong> offers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm"><strong>{va.total_redemptions}</strong> redeemed</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Link href={`/dashboard/offers/${venue.id}`}>
                          <Button variant="outline" size="sm">
                            <Gift className="w-4 h-4 mr-1" /> Manage Offers
                          </Button>
                        </Link>
                        <Link href={`/dashboard/analytics/${venue.id}`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4 mr-1" /> Analytics
                          </Button>
                        </Link>
                        <Link href={`/dashboard/scan/${venue.id}`}>
                          <Button variant="outline" size="sm">
                            <QrCode className="w-4 h-4 mr-1" /> Scan QR
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
