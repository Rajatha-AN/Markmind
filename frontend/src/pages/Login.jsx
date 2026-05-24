import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../app/api';
import { setCredentials } from '../features/auth/authSlice';
import { Brain, LogIn, KeyRound } from 'lucide-react';

export default function Login() {
  const [form, setForm]             = useState({ email: '', password: '' });
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch                    = useDispatch();
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();
  const redirect                    = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form).unwrap();
      dispatch(setCredentials(data));
      navigate(redirect || '/');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080b14' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div className="glass glow w-full max-w-md p-8 fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-glow"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Brain size={32} color="white" />
          </div>
          <h1 className="font-display text-2xl font-bold gradient-text">MarkMind</h1>
          <p className="text-slate-400 text-sm mt-1">
            {redirect ? 'Sign in to accept your invitation' : 'Sign in to your knowledge base'}
          </p>
        </div>

        {/* Invitation redirect notice */}
        {redirect && (
          <div className="rounded-lg p-3 mb-4 text-sm text-violet-300"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
            🔗 You'll be redirected back to your invitation after signing in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Email</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-slate-400">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
              >
                <KeyRound size={11} />
                Forgot password?
              </Link>
            </div>
            <input
              className="input-field"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error.data?.message || 'Login failed. Please try again.'}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <LogIn size={16} />
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          No account?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
