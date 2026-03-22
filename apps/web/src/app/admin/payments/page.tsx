'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/admin/payments', token!);
        setData(res.data);
      } catch { /* ignore */ }
    }
    if (token) load();
  }, [token]);

  if (!data) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Payments Overview</h1>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Total Payments</p>
              <p className="text-2xl font-bold text-dark-900">{data.total_payments}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Active Subscriptions</p>
              <p className="text-2xl font-bold text-dark-900">{data.active_subscriptions}</p>
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-bold text-dark-900 mb-4">Recent Payments</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-200 text-left">
              <th className="py-3 px-2 font-medium text-dark-500">User</th>
              <th className="py-3 px-2 font-medium text-dark-500">Product</th>
              <th className="py-3 px-2 font-medium text-dark-500">Amount</th>
              <th className="py-3 px-2 font-medium text-dark-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_payments?.map((p: any) => (
              <tr key={p.id} className="border-b border-dark-100">
                <td className="py-3 px-2 text-dark-900">{p.users?.email}</td>
                <td className="py-3 px-2">{p.products?.name}</td>
                <td className="py-3 px-2 font-medium">{formatCurrency(p.amount_zar)}</td>
                <td className="py-3 px-2 text-dark-500">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
