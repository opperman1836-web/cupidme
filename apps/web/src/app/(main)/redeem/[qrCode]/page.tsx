'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  QrCode, CheckCircle2, Gift, MapPin, Clock, Star, Heart,
  AlertCircle, ArrowLeft, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';

export default function RedeemPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [status, setStatus] = useState<'loading' | 'ready' | 'redeemed' | 'error'>('loading');
  const [redemption, setRedemption] = useState<any>(null);
  const [error, setError] = useState('');
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    // For now, just show the QR code status
    setStatus('ready');
  }, [qrCode]);

  async function handleRedeem() {
    try {
      const res = await api.post<any>('/api/venues/redemptions/redeem', {
        qr_code: qrCode,
      }, token!);
      setRedemption(res.data);
      setStatus('redeemed');
      addToast('Offer redeemed successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to redeem offer');
      setStatus('error');
    }
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <Link href="/venues" className="inline-flex items-center gap-1 text-dark-500 hover:text-cupid-500 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="overflow-hidden">
          {status === 'ready' && (
            <div className="py-8">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 bg-cupid-50 rounded-3xl flex items-center justify-center mx-auto mb-6"
              >
                <QrCode className="w-12 h-12 text-cupid-500" />
              </motion.div>

              <h1 className="text-2xl font-black text-dark-900 mb-2">Redeem Your Date</h1>
              <p className="text-dark-500 mb-1">QR Code: <code className="text-dark-700 font-mono">{qrCode}</code></p>
              <p className="text-sm text-dark-400 mb-8">Show this to the venue staff to redeem your offer</p>

              <div className="bg-dark-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <Gift className="w-6 h-6 text-cupid-500" />
                  <span className="text-lg font-bold text-dark-900">Sponsored Date Package</span>
                </div>
              </div>

              <Button onClick={handleRedeem} className="w-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Redemption
              </Button>
              <p className="text-xs text-dark-400 mt-3">
                Only press this when the venue staff confirms your offer
              </p>
            </div>
          )}

          {status === 'redeemed' && (
            <div className="py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-14 h-14 text-emerald-500" />
              </motion.div>
              <h2 className="text-2xl font-black text-emerald-600 mb-2">Offer Redeemed!</h2>
              <p className="text-dark-500 mb-8">Enjoy your date! Your relationship score has been updated.</p>

              <div className="bg-emerald-50 rounded-2xl p-5 flex items-center gap-3 justify-center mb-6">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-emerald-700">+15 Relationship Score</span>
              </div>

              <Link href="/matches">
                <Button className="w-full">
                  <Heart className="w-4 h-4 mr-2" /> Back to Matches
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-14 h-14 text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-red-500 mb-2">Redemption Failed</h2>
              <p className="text-dark-500 mb-8">{error}</p>
              <Link href="/venues">
                <Button variant="outline" className="w-full">
                  Browse Venues
                </Button>
              </Link>
            </div>
          )}

          {status === 'loading' && (
            <div className="py-12">
              <div className="animate-spin w-10 h-10 border-4 border-cupid-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-dark-400 mt-4">Loading offer details...</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
