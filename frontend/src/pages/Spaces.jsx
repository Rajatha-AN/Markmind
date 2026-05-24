import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSpacesQuery, useCreateSpaceMutation } from '../app/api';
import { Users, Plus, X, BookOpen, ChevronRight, Crown, MessageSquare } from 'lucide-react';
import { useSelector } from 'react-redux';

function CreateModal({ onClose }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [create, { isLoading, error }] = useCreateSpaceMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await create(form).unwrap();
      onClose();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="glass w-full max-w-md p-6 fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-lg gradient-text">Create Space</h2>
            <p className="text-slate-500 text-xs mt-0.5">A collaborative environment for your team</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Space Name</label>
            <input className="input-field" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Research Hub, Design Refs..." required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Description <span className="text-slate-600">(optional)</span></label>
            <textarea className="input-field" rows={3} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What will this space be used for?" />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error?.data?.message || 'Failed to create space'}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : 'Create Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Spaces() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: spaces, isLoading } = useGetSpacesQuery();
  const user = useSelector(s => s.auth.user);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold gradient-text flex items-center gap-3">
            <Users size={24} /> Collaborative Spaces
          </h1>
          <p className="text-slate-400 text-sm mt-1">Shared knowledge environments · invite teammates · collaborate live</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Space
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass h-44 animate-pulse" />)}
        </div>
      ) : spaces?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map(s => {
            const isOwner = s.createdBy?._id === user?.id || s.createdBy === user?.id;
            return (
              <Link key={s._id} to={`/spaces/${s._id}`}
                className="glass p-5 hover:border-violet-500/40 transition-all group cursor-pointer block">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(37,99,235,0.25))' }}>
                    <BookOpen size={17} className="text-violet-300" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isOwner && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <Crown size={9} /> Owner
                      </span>
                    )}
                    <ChevronRight size={15} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </div>

                <h3 className="text-slate-100 font-semibold mb-1 group-hover:text-violet-200 transition-colors">{s.name}</h3>
                {s.description && <p className="text-slate-400 text-xs mb-3 line-clamp-2 leading-relaxed">{s.description}</p>}

                {/* Member avatars */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex -space-x-1.5">
                    {s.members?.slice(0, 4).map((m, i) => (
                      <div key={m._id || i}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', borderColor: '#0d1117' }}
                        title={m.username}>
                        {m.username?.[0]?.toUpperCase()}
                      </div>
                    ))}
                    {s.members?.length > 4 && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border"
                        style={{ background: 'rgba(255,255,255,0.08)', borderColor: '#0d1117', color: '#94a3b8' }}>
                        +{s.members.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{s.bookmarks?.length || 0} bm</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={10} />{s.comments?.length || 0}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="glass p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Users size={28} className="text-violet-400" />
          </div>
          <h3 className="text-slate-200 font-semibold mb-2">No spaces yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create a space and invite teammates to collaborate in real-time</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={15} /> Create your first space
          </button>
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
