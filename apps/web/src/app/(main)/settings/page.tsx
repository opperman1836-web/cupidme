'use client';

import { useState } from 'react';
import { Shield, Bell, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-dark-900 mb-6">Settings</h1>

      <div className="space-y-4">
        <Card>
          <h3 className="font-bold text-dark-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-dark-500" /> Privacy
          </h3>
          <div className="mt-3 space-y-3">
            <SettingToggle label="Show online status" defaultChecked />
            <SettingToggle label="Show distance" defaultChecked />
            <SettingToggle label="Show profile in discover" defaultChecked />
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-dark-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-dark-500" /> Notifications
          </h3>
          <div className="mt-3 space-y-3">
            <SettingToggle label="New matches" defaultChecked />
            <SettingToggle label="New messages" defaultChecked />
            <SettingToggle label="Challenge reminders" defaultChecked />
            <SettingToggle label="Venue offers" defaultChecked />
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-dark-900 flex items-center gap-2 text-red-500">
            <Trash2 className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-sm text-dark-500 mt-2">Permanently delete your account and all data.</p>
          <Button variant="danger" size="sm" className="mt-3">Delete Account</Button>
        </Card>
      </div>
    </div>
  );
}

function SettingToggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-dark-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className={`relative w-10 h-6 rounded-full transition ${checked ? 'bg-cupid-500' : 'bg-dark-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );
}
