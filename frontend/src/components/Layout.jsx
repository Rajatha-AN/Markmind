import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { LayoutDashboard, Bookmark, GitBranch, Users, LogOut, Brain } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/graph', icon: GitBranch, label: 'Graph' },
  { to: '/spaces', icon: Users, label: 'Spaces' },
];

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ background: 'rgba(10,12,24,0.95)', borderRight: '1px solid rgba(139,92,246,0.15)' }}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center pulse-glow" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Brain size={20} color="white" />
          </div>
          <span className="font-display text-lg font-bold gradient-text">MarkMind</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                  ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.2))', color: '#a78bfa', borderLeft: '2px solid #7c3aed' } : {}}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">{user?.username}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto" style={{ background: '#080b14' }}>
        {/* bg decoration */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>
        <div className="relative z-10 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
