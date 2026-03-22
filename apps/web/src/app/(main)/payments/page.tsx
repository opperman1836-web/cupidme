'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Crown, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToastStore } from '@/components/ui/Toast';

const plans = [
  {
    name: 'CupidMe Plus',
    price: 'R149/mo',
    features: ['5 free match unlocks/month', 'Priority matching', 'See who liked you'],
    popular: false,
  },
  {
    name: 'CupidMe Premium',
    price: 'R299/mo',
    features: ['Unlimited match unlocks', 'All Plus features', 'Boosted profile', 'Advanced filters'],
    popular: true,
  },
];

export default function PaymentsPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, histRes] = await Promise.all([
          api.get<any>('/api/payments/subscription', token!),
          api.get<any>('/api/payments/history', token!),
        ]);
        setSubscription(subRes.data);
        setHistory(histRes.data || []);
      } catch { /* ignore */ }
    }
    if (token) load();
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Payments & Subscription</h1>

      {subscription && (
        <Card className="mb-8 border-cupid-200 bg-cupid-50/50">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-cupid-500" />
            <h2 className="text-lg font-bold text-dark-900">{subscription.products?.name}</h2>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-sm text-dark-500">
            Renews on {formatDate(subscription.current_period_end)}
          </p>
        </Card>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.popular ? 'border-cupid-300 ring-2 ring-cupid-100' : ''}>
            {plan.popular && (
              <Badge variant="info" >Most Popular</Badge>
            )}
            <h3 className="text-xl font-bold text-dark-900 mt-2">{plan.name}</h3>
            <p className="text-3xl font-extrabold text-cupid-500 mt-2">{plan.price}</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-dark-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button className="w-full mt-6" variant={plan.popular ? 'primary' : 'outline'}>
              {subscription ? 'Manage' : 'Subscribe'}
            </Button>
          </Card>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-dark-900 mb-4">Payment History</h2>
          <div className="space-y-2">
            {history.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-3 border-b border-dark-100">
                <div>
                  <p className="font-medium text-dark-900">{payment.products?.name}</p>
                  <p className="text-xs text-dark-400">{formatDate(payment.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(payment.amount_zar)}</p>
                  <Badge variant={payment.status === 'succeeded' ? 'success' : 'danger'}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
