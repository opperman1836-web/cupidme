'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/admin/users', token!);
        setUsers(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  async function toggleActive(userId: string, currentlyActive: boolean) {
    try {
      await api.patch(`/api/admin/users/${userId}/active`, { is_active: !currentlyActive }, token!);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentlyActive } : u));
      addToast(`User ${!currentlyActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  }

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-900 mb-6">User Management</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-200 text-left">
              <th className="py-3 px-2 font-medium text-dark-500">Email</th>
              <th className="py-3 px-2 font-medium text-dark-500">Name</th>
              <th className="py-3 px-2 font-medium text-dark-500">Role</th>
              <th className="py-3 px-2 font-medium text-dark-500">Status</th>
              <th className="py-3 px-2 font-medium text-dark-500">Joined</th>
              <th className="py-3 px-2 font-medium text-dark-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-dark-100">
                <td className="py-3 px-2 text-dark-900">{user.email}</td>
                <td className="py-3 px-2">{user.profiles?.display_name || '—'}</td>
                <td className="py-3 px-2"><Badge>{user.role}</Badge></td>
                <td className="py-3 px-2">
                  <Badge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-dark-500">{formatDate(user.created_at)}</td>
                <td className="py-3 px-2">
                  <Button
                    variant={user.is_active ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => toggleActive(user.id, user.is_active)}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
