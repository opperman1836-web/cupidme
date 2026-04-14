'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Store, MapPin, Camera, Clock, DollarSign, ArrowRight, ArrowLeft,
  Coffee, Utensils, Wine, Hotel, Sparkles, CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/components/ui/Toast';

const categories = [
  { value: 'cafe', label: 'Cafe / Coffee Shop', icon: Coffee },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'bar_lounge', label: 'Bar / Lounge', icon: Wine },
  { value: 'hotel', label: 'Hotel / Boutique Stay', icon: Hotel },
  { value: 'experience', label: 'Experience / Activity', icon: Sparkles },
];

export default function VenueRegisterPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    city: '',
    province: '',
    latitude: '',
    longitude: '',
    phone: '',
    website: '',
    cover_image_url: '',
    opening_hours: '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await api.post('/api/venues', {
        ...form,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
      }, token!);
      addToast('Venue submitted for review!', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      addToast(err.message || 'Failed to register venue', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                s <= step ? 'bg-cupid-500 text-white' : 'bg-dark-200 text-dark-500'
              }`}>
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 ${s < step ? 'bg-cupid-500' : 'bg-dark-200'}`} />}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-dark-100"
        >
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cupid-50 rounded-2xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-cupid-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-dark-900">Register Your Venue</h1>
                  <p className="text-dark-500 text-sm">Step 1: Basic Information</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input label="Venue Name" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. The Daily Grind" />
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <button key={cat.value} type="button" onClick={() => update('category', cat.value)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          form.category === cat.value ? 'border-cupid-500 bg-cupid-50 text-cupid-700' : 'border-dark-100 text-dark-600 hover:border-dark-200'
                        }`}>
                        <cat.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Description</label>
                  <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                    placeholder="Tell couples why your venue is the perfect date spot..." rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-cupid-400 focus:border-transparent resize-none" />
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <Button onClick={() => setStep(2)} disabled={!form.name || !form.category}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-dark-900">Location & Contact</h1>
                  <p className="text-dark-500 text-sm">Step 2: Where are you?</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input label="Street Address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="123 Long Street" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Cape Town" />
                  <Input label="Province" value={form.province} onChange={(e) => update('province', e.target.value)} placeholder="Western Cape" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Latitude" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="-33.9249" />
                  <Input label="Longitude" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="18.4241" />
                </div>
                <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+27 21 xxx xxxx" />
                <Input label="Website" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://yourvenue.co.za" />
              </div>
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={!form.address || !form.city}>Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-dark-900">Final Details</h1>
                  <p className="text-dark-500 text-sm">Step 3: Media & Hours</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input label="Cover Image URL" value={form.cover_image_url} onChange={(e) => update('cover_image_url', e.target.value)} placeholder="https://..." />
                <div>
                  <label className="block text-sm font-semibold text-dark-700 mb-2">Opening Hours</label>
                  <textarea value={form.opening_hours} onChange={(e) => update('opening_hours', e.target.value)}
                    placeholder="Mon-Fri: 8am-10pm&#10;Sat-Sun: 9am-11pm" rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-cupid-400 focus:border-transparent resize-none" />
                </div>
                <div className="bg-dark-50 rounded-2xl p-6 mt-4">
                  <p className="text-sm font-bold text-dark-500 mb-3">Preview</p>
                  <div className="bg-white rounded-xl p-4 border border-dark-100">
                    {form.cover_image_url && <img src={form.cover_image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-3" />}
                    <h3 className="font-bold text-dark-900">{form.name || 'Your Venue'}</h3>
                    <p className="text-sm text-dark-500 mt-1">{form.city || 'City'} &middot; {categories.find((c) => c.value === form.category)?.label || 'Category'}</p>
                    {form.description && <p className="text-sm text-dark-600 mt-2 line-clamp-2">{form.description}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={handleSubmit} loading={loading}>Submit for Review <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
