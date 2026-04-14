'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Gift, Plus, Tag, Sparkles, ArrowLeft, Trash2, Calendar,
  Lock, Users, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

const offerTypes = [
  { value: 'free_item', label: 'Free Item', description: 'Coffee, bagel, appetizer, etc.', icon: Gift },
  { value: 'percentage_discount', label: '% Discount', description: 'Percentage off the bill', icon: Tag },
  { value: 'fixed_discount', label: 'Fixed Discount', description: 'Rand amount off', icon: Tag },
  { value: 'special_experience', label: 'Special Experience', description: 'VIP table, tasting, etc.', icon: Sparkles },
];

export default function ManageOffersPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [offers, setOffers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  const [form, setForm] = useState({
    title: '',
    description: '',
    offer_type: 'free_item',
    discount_value: '',
    min_connection_level: '1',
    max_redemptions: '100',
    valid_until: '',
  });

  useEffect(() => {
    loadOffers();
  }, [venueId, token]);

  async function loadOffers() {
    try {
      const res = await api.get<any>(`/api/venues/${venueId}`, token!);
      setOffers(res.data?.venue_offers || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/api/venues/${venueId}/offers`, {
        ...form,
        discount_value: parseFloat(form.discount_value) || 0,
        min_connection_level: parseInt(form.min_connection_level) || 1,
        max_redemptions: parseInt(form.max_redemptions) || 100,
      }, token!);
      addToast('Offer created!', 'success');
      setShowForm(false);
      setForm({ title: '', description: '', offer_type: 'free_item', discount_value: '', min_connection_level: '1', max_redemptions: '100', valid_until: '' });
      loadOffers();
    } catch (err: any) {
      addToast(err.message || 'Failed to create offer', 'error');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cupid-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-dark-500 hover:text-cupid-500 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-dark-900">Manage Offers</h1>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> {showForm ? 'Cancel' : 'New Offer'}
        </Button>
      </div>

      {/* Create offer form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <Card className="mb-6">
            <h2 className="text-lg font-bold text-dark-900 mb-4">Create Date Package</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Package Name"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Coffee + Bagel Date"
                required
              />
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {offerTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, offer_type: type.value }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                        form.offer_type === type.value
                          ? 'border-cupid-500 bg-cupid-50'
                          : 'border-dark-100 hover:border-dark-200'
                      }`}
                    >
                      <type.icon className={`w-4 h-4 ${form.offer_type === type.value ? 'text-cupid-500' : 'text-dark-400'}`} />
                      <div>
                        <p className="text-sm font-semibold text-dark-900">{type.label}</p>
                        <p className="text-xs text-dark-500">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what couples will receive..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-cupid-400 focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={form.offer_type === 'percentage_discount' ? 'Discount %' : 'Value (R)'}
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder="e.g. 50"
                />
                <Input
                  label="Min Connection Level"
                  type="number"
                  value={form.min_connection_level}
                  onChange={(e) => setForm((f) => ({ ...f, min_connection_level: e.target.value }))}
                  placeholder="1-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Redemptions"
                  type="number"
                  value={form.max_redemptions}
                  onChange={(e) => setForm((f) => ({ ...f, max_redemptions: e.target.value }))}
                  placeholder="100"
                />
                <Input
                  label="Valid Until"
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full" loading={submitting}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Create Offer
              </Button>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Existing offers */}
      {offers.length === 0 ? (
        <Card className="text-center py-12">
          <Gift className="w-12 h-12 text-dark-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-dark-700">No offers yet</h2>
          <p className="text-dark-500 mt-2 text-sm">Create your first date package to attract couples!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, i) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cupid-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {offer.offer_type === 'free_item' && <Gift className="w-6 h-6 text-cupid-500" />}
                  {offer.offer_type === 'percentage_discount' && <Tag className="w-6 h-6 text-emerald-500" />}
                  {offer.offer_type === 'fixed_discount' && <Tag className="w-6 h-6 text-blue-500" />}
                  {offer.offer_type === 'special_experience' && <Sparkles className="w-6 h-6 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-dark-900">{offer.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Lvl {offer.min_connection_level}+
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {offer.redemption_count || 0}/{offer.max_redemptions}
                    </span>
                    {offer.valid_until && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(offer.valid_until)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={offer.is_active !== false ? 'success' : 'warning'}>
                  {offer.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
