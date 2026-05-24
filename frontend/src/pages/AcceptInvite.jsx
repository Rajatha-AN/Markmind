import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetInviteByTokenQuery, useAcceptInviteMutation, useRejectInviteMutation } from '../app/api';
import { Users, CheckCircle, XCircle, Clock, Brain, AlertTriangle, LogIn } from 'lucide-react';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const authUser = useSelector(s => s.auth.user);
  const authToken = useSelector(s => s.auth.token);

  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data, isLoading, error } = useGetInviteByTokenQuery(token, { skip: !token });
  const [acceptInvite, { isLoading: accepting }] = useAcceptInviteMutation();
  const [rejectInvite, { isLoading: rejecting }] = useRejectInviteMutation();

  const invite = data?.invitation;

  const handleAccept = async () => {
    if (!authToken) {
      // Redirect to login, then come back
      navigate(`/login?redirect=/invite/accept?token=${token}`);
      return;
    }
    try {
      setActionError('');
      const result = await acceptInvite(token).unwrap();
      setAccepted(true);
      setTimeout(() => navigate(`/spaces/${result.space._id}`), 2000);
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleReject = async () => {
    try {
      setActionError('');
      await rejectInvite(token).unwrap();
      setRejected(true);
    } catch (err) {
      setActionError(err?.data?.message || 'Failed to decline invitation');
    }
  };

  if (!token) {
    return <InviteShell><ErrorState title="Invalid Link" message="No invitation token found in the URL." /></InviteShell>;
  }

  if (isLoading) {
    return (
      <InviteShell>
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading invitation...</p>
        </div>
      </InviteShell>
    );
  }

  if (error) {
    const msg = error?.data?.message || 'Invitation not found or has expired.';
    const isExpired = error?.status === 410;
    return (
      <InviteShell>
        <ErrorState
          title={isExpired ? 'Invitation Expired' : 'Invitation Not Found'}
          message={msg}
          icon={isExpired ? Clock : XCircle}
        />
      </InviteShell>
    );
  }

  if (accepted) {
    return (
      <InviteShell>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">You're in!</h2>
          <p className="text-slate-400 mb-1">You've joined <strong className="text-violet-300">{invite?.space?.name}</strong></p>
          <p className="text-slate-500 text-sm">Redirecting to the space...</p>
          <div className="mt-4 w-8 h-1 rounded-full bg-violet-500 mx-auto animate-pulse" />
        </div>
      </InviteShell>
    );
  }

  if (rejected) {
    return (
      <InviteShell>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <XCircle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Invitation Declined</h2>
          <p className="text-slate-400 mb-6">You've declined the invitation to <strong className="text-slate-300">{invite?.space?.name}</strong>.</p>
          <button onClick={() => navigate('/')} className="btn-ghost">Go to Dashboard</button>
        </div>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <div className="fade-in">
        {/* Inviter info */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(37,99,235,0.3))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <Users size={24} className="text-violet-300" />
          </div>
          <p className="text-slate-400 text-sm">
            <span className="text-violet-300 font-semibold">{invite?.invitedBy?.username}</span> invited you to collaborate
          </p>
        </div>

        {/* Space card */}
        <div className="rounded-xl p-5 mb-6"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <h2 className="text-lg font-bold text-slate-100 mb-1">{invite?.space?.name}</h2>
          {invite?.space?.description && (
            <p className="text-slate-400 text-sm mb-3">{invite?.space?.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users size={12} />
            <span>{invite?.space?.memberCount} member{invite?.space?.memberCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Login warning if not authenticated */}
        {!authToken && (
          <div className="rounded-lg p-3 mb-4 flex items-start gap-3"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium">Login required</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                You need to be logged in to accept. Make sure to use the account with email <strong>{invite?.email}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Email mismatch warning */}
        {authToken && authUser?.email?.toLowerCase() !== invite?.email?.toLowerCase() && (
          <div className="rounded-lg p-3 mb-4 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-medium">Wrong account</p>
              <p className="text-red-400/70 text-xs mt-0.5">
                This invitation was sent to <strong>{invite?.email}</strong>. You're logged in as <strong>{authUser?.email}</strong>.
              </p>
            </div>
          </div>
        )}

        {actionError && (
          <div className="rounded-lg p-3 mb-4 text-red-300 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {actionError}
          </div>
        )}

        {/* Expiry */}
        <p className="text-xs text-slate-500 text-center mb-5">
          <Clock size={11} className="inline mr-1" />
          Expires {new Date(invite?.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Actions */}
        {!authToken ? (
          <div className="flex gap-3">
            <button onClick={() => navigate(`/login?redirect=/invite/accept?token=${token}`)}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              <LogIn size={15} /> Log In to Accept
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={handleReject} disabled={rejecting}
              className="btn-ghost flex-1"
              style={{ color: '#f87171' }}>
              {rejecting ? 'Declining...' : 'Decline'}
            </button>
            <button onClick={handleAccept} disabled={accepting}
              className="btn-primary flex-1">
              {accepting ? 'Joining...' : 'Accept & Join'}
            </button>
          </div>
        )}
      </div>
    </InviteShell>
  );
}

function InviteShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080b14' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Brain size={20} color="white" />
          </div>
          <span className="font-display text-xl font-bold" style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MarkMind</span>
        </div>

        <div className="glass p-8">
          <h1 className="text-center font-display text-xl font-bold gradient-text mb-6">Collaboration Invitation</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ title, message, icon: Icon = XCircle }) {
  const navigate = useNavigate();
  return (
    <div className="text-center py-6">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <Icon size={28} className="text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-100 mb-2">{title}</h2>
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      <button onClick={() => navigate('/')} className="btn-ghost">Go to Dashboard</button>
    </div>
  );
}
