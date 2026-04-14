'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Crown, Check, Zap, Heart, Star, Shield,
  Sparkles, ArrowRight, Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToastStore } from '@/components/ui/Toast';

const plans = [
  {
    id: 'plus',
    name: 'CupidMe Plus',
    price: 'R149',
    period: '/mo',
    features: [
      '5 free match unlocks/month',
      'Priority matching',
      'See who liked you',
      'Extended chat windows',
    ],
    popular: false,
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'premium',
    name: 'CupidMe Premium',
    price: 'R299',
    period: '/mo',
    features: [
      'Unlimited match unlocks',
      'All Plus features',
      'Boosted profile visibility',
      'Advanced filters & preferences',
      'Priority AI challenge evaluation',
      'Exclusive venue offers',
    ],
    popular: true,
    icon: Crown,
    color: 'from-cupid-500 to-cupid-600',
  },
];

const boosts = [
  { name: 'Match Unlock', price: 'R29', description: 'Unlock one match instantly', icon: Heart },
  { name: 'Chat Extension', price: 'R19', description: 'Add 24h to any chat', icon: Clock },
  { name: 'Profile Boost', price: 'R49', description: '2x visibility for 24 hours', icon: Zap },
];

export default function PaymentsPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
    }
    if (token) {
      load();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function handleSubscribe(planId: string) {
    try {
      const res = await api.post<any>('/api/payments/checkout', {
        product_id: planId,
        type: 'subscription',
      }, token!);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to start checkout', 'error');
    }
  }

  async function handleBoost(boostType: string) {
    try {
      const res = await api.post<any>('/api/payments/checkout', {
        product_id: boostType,
        type: 'one_time',
      }, token!);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to purchase', 'error');
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-dark-900">Premium</h1>
        <p className="text-dark-500 mt-1">Upgrade your love life with premium features and boosts</p>
      </div>

      {/* Current subscription */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 bg-gradient-to-r from-cupid-500 to-cupid-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8" />
                <div>
                  <h2 className="text-lg font-bold">{subscription.products?.name || 'Premium'}</h2>
                  <p className="text-cupid-100 text-sm">
                    Renews {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-0">Active</Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-5 mb-12">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={`relative overflow-hidden h-full ${
                plan.popular ? 'border-cupid-300 ring-2 ring-cupid-100' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-cupid-500 to-cupid-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                  MOST POPULAR
                </div>
              )}

              <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg`}>
                <plan.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-black text-dark-900">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-dark-900">{plan.price}</span>
                <span className="text-dark-500 font-medium">{plan.period}</span>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm text-dark-600">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full mt-8 ${plan.popular ? '' : ''}`}
                variant={plan.popular ? 'primary' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
              >
                {subscription ? 'Manage Subscription' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* One-time boosts */}
      <div className="mb-12">
        <h2 className="text-xl font-black text-dark-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> One-Time Boosts
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {boosts.map((boost, i) => (
            <motion.div
              key={boost.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Card hover className="text-center cursor-pointer" onClick={() => handleBoost(boost.name.toLowerCase().replace(' ', '_'))}>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <boost.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-bold text-dark-900 text-sm">{boost.name}</h3>
                <p className="text-xs text-dark-500 mt-1">{boost.description}</p>
                <p className="text-lg font-black text-cupid-500 mt-2">{boost.price}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-dark-900 mb-4">Payment History</h2>
          <Card>
            <div className="divide-y divide-dark-100">
              {history.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-50 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-dark-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-dark-900">{payment.products?.name || 'Payment'}</p>
                      <p className="text-xs text-dark-400">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark-900">{formatCurrency(payment.amount_zar)}</p>
                    <Badge variant={payment.status === 'succeeded' ? 'success' : 'danger'} className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
