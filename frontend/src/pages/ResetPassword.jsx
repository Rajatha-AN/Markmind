import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Brain, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Loader2,
  ArrowLeft, ShieldCheck,
} from 'lucide-react';
import { useResetPasswordMutation } from '../app/api';

const StrengthBar = ({ password }) => {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score  = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] }}>
        {labels[score]} password
      </p>
    </div>
  );
};

const Requirement = ({ met, label }) => (
  <li className="flex items-center gap-2 text-xs" style={{ color: met ? '#4ade80' : '#64748b' }}>
    <div style={{
      width: 14, height: 14, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: met ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${met ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
      transition: 'all 0.2s',
      flexShrink: 0,
    }}>
      {met && <CheckCircle size={8} color="#4ade80" />}
    </div>
    {label}
  </li>
);

export default function ResetPassword() {
  const { token }                         = useParams();
  const navigate                          = useNavigate();
  const [form, setForm]                   = useState({ password: '', confirm: '' });
  const [showPw, setShowPw]               = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [success, setSuccess]             = useState(false);
  const [clientError, setClientError]     = useState('');
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

  const requirements = [
    { met: form.password.length >= 8,          label: 'At least 8 characters' },
    { met: /[A-Z]/.test(form.password),         label: 'One uppercase letter' },
    { met: /[0-9]/.test(form.password),         label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(form.password), label: 'One special character' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError('');

    if (form.password !== form.confirm) {
      setClientError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setClientError('Password must be at least 8 characters.');
      return;
    }

    try {
      await resetPassword({ token, password: form.password }).unwrap();
      setSuccess(true);
    } catch {}
  };

  /* ── Invalid/missing token ── */
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080b14' }}>
        <div className="glass glow w-full max-w-md p-8 text-center fade-in">
          <AlertCircle size={40} color="#f87171" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Invalid Reset Link</h2>
          <p className="text-slate-400 text-sm mb-6">This password reset link is invalid or missing.</p>
          <Link to="/forgot-password" className="btn-primary inline-flex items-center gap-2 text-sm">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080b14' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="glass glow w-full max-w-md p-8 fade-in relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-glow"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Brain size={32} color="white" />
          </div>
          <h1 className="font-display text-2xl font-bold gradient-text">MarkMind</h1>
        </div>

        {success ? (
          /* ── Success state ── */
          <div className="text-center fade-in">
            <div className="flex justify-center mb-4">
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.15))',
                border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={32} color="#4ade80" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Password Updated!</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <KeyRound size={15} /> Sign In Now
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100 mb-1">Create new password</h2>
              <p className="text-slate-400 text-sm">
                Choose a strong password for your MarkMind account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">New Password</label>
                <div className="relative">
                  <input
                    className="input-field"
                    style={{ paddingRight: 40 }}
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <StrengthBar password={form.password} />
              </div>

              {/* Requirements checklist */}
              {form.password && (
                <ul className="space-y-1.5 p-3 rounded-lg fade-in"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {requirements.map(r => <Requirement key={r.label} {...r} />)}
                </ul>
              )}

              {/* Confirm Password */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Confirm Password</label>
                <div className="relative">
                  <input
                    className="input-field"
                    style={{
                      paddingRight: 40,
                      borderColor: form.confirm && form.password !== form.confirm
                        ? 'rgba(239,68,68,0.5)' : '',
                    }}
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                    }}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
                {form.confirm && form.password === form.confirm && form.confirm.length > 0 && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle size={11} /> Passwords match
                  </p>
                )}
              </div>

              {/* Errors */}
              {(clientError || error) && (
                <div className="rounded-lg p-3 text-sm text-red-400 flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {clientError || error?.data?.message || 'Something went wrong. Please try again.'}
                    {(error?.data?.message?.toLowerCase().includes('expired') || error?.data?.message?.toLowerCase().includes('invalid')) && (
                      <Link to="/forgot-password" className="block mt-1 text-violet-400 hover:text-violet-300">
                        Request a new reset link →
                      </Link>
                    )}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={isLoading || form.password !== form.confirm || form.password.length < 8}
              >
                {isLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Resetting…</>
                ) : (
                  <><ShieldCheck size={15} /> Reset Password</>
                )}
              </button>
            </form>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mt-6"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
