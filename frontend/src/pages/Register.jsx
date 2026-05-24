import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRegisterMutation } from '../app/api';
import { setCredentials } from '../features/auth/authSlice';
import { Brain, UserPlus } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [register, { isLoading, error }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await register(form).unwrap();
      dispatch(setCredentials(data));
      navigate('/');
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080b14' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 60%)' }} />
      <div className="glass glow w-full max-w-md p-8 fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-glow" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Brain size={32} color="white" />
          </div>
          <h1 className="font-display text-2xl font-bold gradient-text">MarkMind</h1>
          <p className="text-slate-400 text-sm mt-1">Create your knowledge base</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[['username','Username','johndoe'], ['email','Email','you@example.com'], ['password','Password','••••••••']].map(([key, label, ph]) => (
            <div key={key}>
              <label className="text-sm text-slate-400 mb-1 block">{label}</label>
              <input className="input-field" type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} required />
            </div>
          ))}
          {error && <p className="text-red-400 text-sm">{error.data?.message || 'Registration failed'}</p>}
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={isLoading}>
            <UserPlus size={16} /> {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
