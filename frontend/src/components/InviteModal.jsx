import React, { useState } from 'react';
import { useSendInviteMutation, useGetSpaceInvitationsQuery, useResendInviteMutation } from '../app/api';
import { X, Mail, Send, Clock, CheckCircle, XCircle, RotateCcw, ExternalLink, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: CheckCircle },
  rejected: { label: 'Declined', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle },
  expired: { label: 'Expired', color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: AlertCircle },
};

export default function InviteModal({ spaceId, spaceName, onClose }) {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const [sendInvite, { isLoading: sending }] = useSendInviteMutation();
  const [resendInvite] = useResendInviteMutation();
  const { data: invitations, refetch } = useGetSpaceInvitationsQuery(spaceId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSuccessMsg('');
    setErrorMsg('');
    setPreviewUrl('');

    try {
      const result = await sendInvite({ spaceId, email: email.trim() }).unwrap();
      setSuccessMsg(`Invitation sent to ${email.trim()}`);
      setEmail('');
      if (result.emailPreviewUrl) {
        setPreviewUrl(result.emailPreviewUrl);
      }
      refetch();
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to send invitation');
    }
  };

  const handleResend = async (invitationId) => {
    try {
      const result = await resendInvite({ spaceId, invitationId }).unwrap();
      setSuccessMsg('Invitation resent!');
      if (result.emailPreviewUrl) setPreviewUrl(result.emailPreviewUrl);
      refetch();
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to resend');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="glass w-full max-w-lg fade-in" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="font-display font-bold text-lg gradient-text">Invite to Space</h2>
            <p className="text-slate-500 text-xs mt-0.5">{spaceName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Email form */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Invite by email address</label>
            <form onSubmit={handleSend} className="flex gap-2">
              <div className="flex-1 relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className="input-field w-full pl-8"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={sending}
                />
              </div>
              <button type="submit" className="btn-primary px-4 flex items-center gap-2 flex-shrink-0" disabled={sending || !email.trim()}>
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Send
              </button>
            </form>
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div className="rounded-lg p-3 flex items-center gap-2 text-emerald-300 text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={14} />
              {successMsg}
            </div>
          )}

          {/* Dev preview URL (Ethereal) */}
          {previewUrl && (
            <div className="rounded-lg p-3 text-sm"
              style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <p className="text-blue-300 font-medium mb-1 flex items-center gap-1">
                <Mail size={13} /> Dev mode: Email preview available
              </p>
              <p className="text-slate-400 text-xs mb-2">
                No SMTP configured — using Ethereal test inbox. Click to preview the email:
              </p>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs underline">
                <ExternalLink size={11} /> Open Email Preview
              </a>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg p-3 flex items-center gap-2 text-red-300 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          {/* Pending invitations */}
          {invitations?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Invitations ({invitations.length})
              </h3>
              <div className="space-y-2">
                {invitations.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(37,99,235,0.3))' }}>
                          <span className="text-xs font-bold text-white">{inv.email[0].toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-200 text-sm truncate">{inv.email}</p>
                          <p className="text-slate-500 text-xs">
                            by {inv.invitedBy} · {new Date(inv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                          style={{ color: cfg.color, background: cfg.bg }}>
                          <StatusIcon size={10} />
                          {cfg.label}
                        </span>
                        {(inv.status === 'pending' || inv.status === 'expired') && (
                          <button onClick={() => handleResend(inv.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-400/10 transition-colors"
                            title="Resend invitation">
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {invitations?.length === 0 && (
            <div className="text-center py-4">
              <Mail size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No invitations sent yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-slate-600 text-center">
            Invited users will receive an email with an accept link valid for 7 days
          </p>
        </div>
      </div>
    </div>
  );
}
