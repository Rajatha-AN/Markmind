import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import {
  useGetSpaceQuery, useAddCommentMutation, useGetBookmarksQuery,
  useAddToSpaceMutation, useDeleteSpaceMutation, useRemoveMemberMutation,
} from '../app/api';
import InviteModal from '../components/InviteModal';
import {
  MessageSquare, Plus, ExternalLink, Send, X, Users, UserPlus,
  Trash2, Settings, Wifi, WifiOff, Crown, Tag, ChevronLeft,
} from 'lucide-react';

let socket;

export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);

  const { data: space, refetch } = useGetSpaceQuery(id);
  const { data: myBookmarks } = useGetBookmarksQuery('');
  const [addComment, { isLoading: commenting }] = useAddCommentMutation();
  const [addToSpace] = useAddToSpaceMutation();
  const [deleteSpace] = useDeleteSpaceMutation();
  const [removeMember] = useRemoveMemberMutation();

  const [comment, setComment] = useState('');
  const [liveComments, setLiveComments] = useState([]);
  const [liveBookmarks, setLiveBookmarks] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAddBm, setShowAddBm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const commentsEndRef = useRef(null);
  const isCreator = space?.createdBy?._id === user?.id || space?.createdBy === user?.id;

  // ── Socket setup ──────────────────────────────────────
  useEffect(() => {
    socket = io('http://localhost:5001', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-space', { spaceId: id, userId: user?.id, username: user?.username });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('comment-added', (data) => {
      setLiveComments(prev => [...prev, data]);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    socket.on('bookmark-added', ({ bookmark, addedBy }) => {
      setLiveBookmarks(prev => {
        if (prev.find(b => b._id === bookmark._id)) return prev;
        return [...prev, bookmark];
      });
      pushNotif(`${addedBy} added a bookmark: ${bookmark.title}`);
    });

    socket.on('member-joined', ({ username }) => {
      setOnlineMembers(prev => [...new Set([...prev, username])]);
      pushNotif(`${username} joined the space`);
    });

    socket.on('member-left', ({ username }) => {
      setOnlineMembers(prev => prev.filter(u => u !== username));
    });

    socket.on('online-members', (members) => {
      setOnlineMembers(members.map(m => m.username));
    });

    return () => {
      socket.emit('leave-space', { spaceId: id });
      socket.disconnect();
    };
  }, [id]);

  const pushNotif = (msg) => {
    const notifId = Date.now();
    setNotifications(prev => [...prev, { id: notifId, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notifId)), 4000);
  };

  // ── Comments ──────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await addComment({ id, text: comment }).unwrap();
      setComment('');
      refetch();
    } catch {}
  };

  // ── Bookmarks ─────────────────────────────────────────
  const handleAddBm = async (bookmarkId) => {
    try {
      await addToSpace({ id, bookmarkId }).unwrap();
      setShowAddBm(false);
      refetch();
    } catch {}
  };

  // ── Delete space ──────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm(`Delete "${space?.name}"? This cannot be undone.`)) return;
    await deleteSpace(id).unwrap();
    navigate('/spaces');
  };

  // ── Remove member ─────────────────────────────────────
  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    await removeMember({ spaceId: id, memberId }).unwrap();
    refetch();
  };

  // ── Merge DB + live data ──────────────────────────────
  const dbCommentIds = new Set((space?.comments || []).map(c => c._id));
  const allComments = [
    ...(space?.comments || []),
    ...liveComments.filter(c => !dbCommentIds.has(c._id)),
  ];

  const dbBmIds = new Set((space?.bookmarks || []).map(b => b._id));
  const allBookmarks = [
    ...(space?.bookmarks || []),
    ...liveBookmarks.filter(b => !dbBmIds.has(b._id)),
  ];

  const availableBookmarks = (myBookmarks || []).filter(
    b => !allBookmarks.find(sb => sb._id === b._id)
  );

  return (
    <div className="space-y-6 fade-in max-w-5xl relative">
      {/* Live notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="fade-in px-4 py-2 rounded-lg text-sm text-white shadow-lg"
            style={{ background: 'rgba(124,58,237,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(139,92,246,0.5)' }}>
            ⚡ {n.msg}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/spaces')}
            className="mt-1 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold gradient-text">{space?.name}</h1>
              {/* Connection status */}
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{ background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: isConnected ? '#34d399' : '#94a3b8' }}>
                {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>
            {space?.description && <p className="text-slate-400 text-sm mt-1">{space.description}</p>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setShowMembers(!showMembers)}
            className="btn-ghost text-sm flex items-center gap-1.5">
            <Users size={14} />
            <span>{space?.members?.length || 0}</span>
          </button>
          <button onClick={() => setShowInvite(true)}
            className="btn-primary text-sm flex items-center gap-1.5">
            <UserPlus size={14} /> Invite
          </button>
          {isCreator && (
            <button onClick={handleDelete}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div className="glass p-4 fade-in">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Users size={14} className="text-violet-400" /> Members
          </h3>
          <div className="flex flex-wrap gap-3">
            {space?.members?.map(m => {
              const isOnline = onlineMembers.includes(m.username);
              const isMemberCreator = space?.createdBy?._id === m._id || space?.createdBy === m._id;
              return (
                <div key={m._id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                      {m.username[0].toUpperCase()}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-gray-900" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-200 flex items-center gap-1">
                      {m.username}
                      {isMemberCreator && <Crown size={10} className="text-yellow-400" />}
                    </p>
                    <p className="text-xs" style={{ color: isOnline ? '#34d399' : '#64748b' }}>
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  {isCreator && !isMemberCreator && m._id !== user?.id && (
                    <button onClick={() => handleRemoveMember(m._id)}
                      className="ml-1 p-1 rounded text-slate-600 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Bookmarks ─────────────────────────────── */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-200">
              Bookmarks
              <span className="ml-2 text-xs text-slate-500 font-normal">{allBookmarks.length}</span>
            </h2>
            <button onClick={() => setShowAddBm(true)} className="btn-ghost text-sm flex items-center gap-1">
              <Plus size={13} /> Add
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {allBookmarks.length ? allBookmarks.map(b => (
              <div key={b._id} className="flex items-center justify-between p-3 rounded-lg group"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{b.title}</p>
                  {b.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {b.tags.slice(0, 3).map(t => (
                        <span key={t} className="tag flex items-center gap-0.5"><Tag size={9} />{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <a href={b.url} target="_blank" rel="noopener noreferrer"
                  className="ml-2 p-1.5 rounded text-slate-500 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all">
                  <ExternalLink size={13} />
                </a>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                  style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Plus size={18} className="text-violet-400" />
                </div>
                <p className="text-slate-500 text-sm">No bookmarks yet</p>
                <p className="text-slate-600 text-xs mt-1">Add bookmarks to share with your team</p>
              </div>
            )}
          </div>

          {/* Add bookmark picker */}
          {showAddBm && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-300 font-medium">Select bookmark to add</p>
                <button onClick={() => setShowAddBm(false)} className="text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              {availableBookmarks.length ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {availableBookmarks.map(b => (
                    <button key={b._id} onClick={() => handleAddBm(b._id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-violet-500/20 transition-colors flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                      <span className="truncate">{b.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-3">All your bookmarks are already in this space</p>
              )}
            </div>
          )}
        </div>

        {/* ── Comments ──────────────────────────────── */}
        <div className="glass p-5 flex flex-col">
          <h2 className="font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <MessageSquare size={15} className="text-violet-400" />
            Comments
            <span className="text-xs text-slate-500 font-normal">{allComments.length}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400 font-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </h2>

          <div className="flex-1 space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
            {allComments.length ? allComments.map((c, i) => {
              const isMe = c.userId === user?.id || c.username === user?.username;
              return (
                <div key={c._id || i}
                  className={`p-3 rounded-xl ${isMe ? 'ml-4' : 'mr-4'}`}
                  style={{
                    background: isMe ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isMe ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                      {(c.username || user?.username)?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-medium" style={{ color: isMe ? '#a78bfa' : '#94a3b8' }}>
                      {c.username || user?.username}
                      {isMe && <span className="ml-1 text-violet-500/60">(you)</span>}
                    </span>
                    {c.createdAt && (
                      <span className="ml-auto text-xs text-slate-600">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{c.text}</p>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <MessageSquare size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No comments yet</p>
                <p className="text-slate-600 text-xs mt-1">Start the conversation!</p>
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>

          <form onSubmit={handleComment} className="flex gap-2">
            <input
              className="input-field flex-1"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              disabled={commenting}
            />
            <button type="submit" className="btn-primary px-3 flex-shrink-0" disabled={commenting || !comment.trim()}>
              {commenting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          spaceId={id}
          spaceName={space?.name}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
