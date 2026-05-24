import React, { useState, useEffect } from 'react';
import { Bell, Shield, Bookmark, Users, Save, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../app/api';

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    loginAlerts: true,
    bookmarkEmails: true,
    collaborationEmails: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  useEffect(() => {
    api.get('/auth/notification-preferences')
      .then(r => { setPrefs(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const { data } = await api.put('/auth/notification-preferences', prefs);
      setPrefs(data);
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const settings = [
    {
      key: 'loginAlerts',
      icon: Shield,
      color: '#34d399',
      title: 'Login Alerts',
      description: 'Receive an email whenever your account is accessed from a new session. Helps you detect unauthorized access.',
    },
    {
      key: 'bookmarkEmails',
      icon: Bookmark,
      color: '#a78bfa',
      title: 'Bookmark Saved Emails',
      description: 'Get a confirmation email with AI-generated tags and summary whenever you save a new bookmark.',
    },
    {
      key: 'collaborationEmails',
      icon: Users,
      color: '#fbbf24',
      title: 'Collaboration Notifications',
      description: 'Be notified when other members add bookmarks or post comments in shared spaces you belong to.',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.2))', border: '1px solid rgba(124,58,237,0.4)' }}>
          <Bell size={20} color="#a78bfa" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notification Settings</h1>
          <p className="text-sm text-slate-400">Control which emails MarkMind sends you</p>
        </div>
      </div>

      {/* Settings cards */}
      <div className="space-y-4 mb-8">
        {settings.map(({ key, icon: Icon, color, title, description }) => (
          <div key={key}
            className="rounded-xl p-5 transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${prefs[key] ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)'}`,
            }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggle(key)}
                className="flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 relative"
                style={{
                  background: prefs[key]
                    ? 'linear-gradient(135deg,#7c3aed,#2563eb)'
                    : 'rgba(255,255,255,0.1)',
                }}>
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: prefs[key] ? '22px' : '2px' }}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Status message */}
      {status === 'success' && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <CheckCircle size={16} color="#34d399" />
          <span className="text-sm text-emerald-400">Preferences saved successfully!</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertCircle size={16} color="#f87171" />
          <span className="text-sm text-red-400">Failed to save. Please try again.</span>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
        <Save size={16} />
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  );
}
