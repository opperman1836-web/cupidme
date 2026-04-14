'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { QrCode, CheckCircle2, AlertCircle, ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToastStore } from '@/components/ui/Toast';

export default function ScanQRPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!qrCode.trim()) return;
    setStatus('scanning');
    try {
      await api.post('/api/venues/redemptions/redeem', {
        qr_code: qrCode.trim(),
      }, token!);
      setStatus('success');
      addToast('Offer redeemed successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired QR code');
      setStatus('error');
    }
  }

  function reset() {
    setQrCode('');
    setStatus('idle');
    setError('');
  }

  return (
    <div className="max-w-md mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-dark-500 hover:text-cupid-500 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-2xl font-black text-dark-900 mb-6">Scan QR Code</h1>

      <Card>
        {status === 'idle' || status === 'scanning' ? (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-cupid-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-10 h-10 text-cupid-500" />
              </div>
              <p className="text-dark-500 text-sm">
                Enter the QR code shown by the couple to redeem their offer
              </p>
            </div>
            <form onSubmit={handleRedeem} className="space-y-4">
              <Input
                label="QR Code"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Enter or scan QR code..."
                required
              />
              <Button type="submit" className="w-full" loading={status === 'scanning'}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Verify & Redeem
              </Button>
            </form>
          </>
        ) : status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-emerald-600">Redeemed!</h2>
            <p className="text-dark-500 mt-2">The offer has been successfully redeemed.</p>
            <Button className="mt-6" onClick={reset}>Scan Another</Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-500">Invalid Code</h2>
            <p className="text-dark-500 mt-2 text-sm">{error}</p>
            <Button className="mt-6" variant="outline" onClick={reset}>Try Again</Button>
          </motion.div>
        )}
      </Card>
    </div>
  );
}
