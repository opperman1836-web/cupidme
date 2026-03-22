'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<any>('/api/admin/reports', token!);
        setReports(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  async function resolve(reportId: string, status: string) {
    try {
      await api.patch(`/api/admin/reports/${reportId}`, { status, resolution_note: `Marked as ${status}` }, token!);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      addToast(`Report ${status}`, 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  }

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Reports</h1>
      {reports.length === 0 ? (
        <p className="text-dark-400 text-center py-12">No open reports.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="warning">{report.reason}</Badge>
                  <p className="text-sm text-dark-700 mt-2">{report.description || 'No description'}</p>
                  <p className="text-xs text-dark-400 mt-1">
                    Reporter: {report.reporter_id} &middot; Reported: {report.reported_user_id}
                  </p>
                  <p className="text-xs text-dark-400">{formatDate(report.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => resolve(report.id, 'resolved')}>Resolve</Button>
                  <Button size="sm" variant="ghost" onClick={() => resolve(report.id, 'dismissed')}>Dismiss</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
