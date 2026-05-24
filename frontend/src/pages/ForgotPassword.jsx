import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useForgotPasswordMutation } from '../app/api';

export default function ForgotPassword() {
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      setSubmitted(true);
    } catch {}
  };

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

        {submitted ? (
          /* ── Success state ── */
          <div className="text-center fade-in">
            <div className="flex justify-center mb-4">
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.15))',
                border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={32} color="#4ade80" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Check your inbox</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              If an account exists for <strong className="text-violet-400">{email}</strong>,
              we've sent a password reset link. Check your spam folder if you don't see it.
            </p>

            <div className="rounded-lg p-3 mb-6 text-xs text-slate-400"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              ⏱ The link expires in <strong className="text-slate-300">1 hour</strong>.
            </div>

            <button
              onClick={() => { setSubmitted(false); setEmail(''); }}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors mb-4 block mx-auto"
            >
              Use a different email
            </button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100 mb-1">Forgot your password?</h2>
              <p className="text-slate-400 text-sm">
                Enter your email and we'll send you a secure reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Email address</label>
                <div className="relative">
                  <Mail
                    size={15}
                    color="#64748b"
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <input
                    className="input-field"
                    style={{ paddingLeft: 36 }}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg p-3 text-sm text-red-400 flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {error.data?.message || 'Something went wrong. Please try again.'}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Sending…</>
                ) : (
                  <><Mail size={15} /> Send Reset Link</>
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
