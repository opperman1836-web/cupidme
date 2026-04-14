'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Bell, Trash2, Moon, Sun, Globe, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/components/ThemeProvider';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-black text-dark-900 dark:text-white mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2 mb-4">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-cupid-500" /> : <Sun className="w-5 h-5 text-cupid-500" />}
              Appearance
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-700 dark:text-dark-300">Dark Mode</p>
                <p className="text-xs text-dark-500">Switch between light and dark themes</p>
              </div>
              <button
                onClick={toggle}
                className={`relative w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-cupid-500' : 'bg-dark-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform flex items-center justify-center ${theme === 'dark' ? 'translate-x-5' : ''}`}>
                  {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-cupid-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                </span>
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-500" /> Privacy
            </h3>
            <div className="space-y-4">
              <SettingToggle label="Show online status" description="Let others see when you're active" defaultChecked />
              <SettingToggle label="Show distance" description="Display distance to other users" defaultChecked />
              <SettingToggle label="Appear in Discover" description="Allow others to find your profile" defaultChecked />
              <SettingToggle label="Read receipts" description="Show when you've read messages" defaultChecked />
            </div>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-500" /> Notifications
            </h3>
            <div className="space-y-4">
              <SettingToggle label="New matches" description="When someone matches with you" defaultChecked />
              <SettingToggle label="New messages" description="When you receive a message" defaultChecked />
              <SettingToggle label="Challenge reminders" description="Reminders about active challenges" defaultChecked />
              <SettingToggle label="Venue offers" description="New offers from partner venues" defaultChecked />
            </div>
          </Card>
        </motion.div>

        {/* Legal */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <h3 className="font-bold text-dark-900 dark:text-white flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-dark-500" /> Legal & Data
            </h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center justify-between py-2 text-sm text-dark-600 dark:text-dark-400 hover:text-cupid-500 transition-colors">
                <span>Privacy Policy (POPIA & GDPR)</span>
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center justify-between py-2 text-sm text-dark-600 dark:text-dark-400 hover:text-cupid-500 transition-colors">
                <span>Terms of Service</span>
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center justify-between py-2 text-sm text-dark-600 dark:text-dark-400 hover:text-cupid-500 transition-colors">
                <span>Download My Data</span>
                <Eye className="w-4 h-4" />
              </a>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-red-100 dark:border-red-900/30">
            <h3 className="font-bold text-red-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-dark-500 mt-2">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="danger" size="sm" className="mt-4">Delete Account</Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, defaultChecked = false }: { label: string; description?: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <span className="text-sm font-medium text-dark-700 dark:text-dark-300">{label}</span>
        {description && <p className="text-xs text-dark-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${checked ? 'bg-cupid-500' : 'bg-dark-200 dark:bg-dark-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}
