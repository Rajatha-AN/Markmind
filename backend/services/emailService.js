'use strict';
const nodemailer = require('nodemailer');

// ── Transporter factory ───────────────────────────────────────────────────────
const createTransporter = () => {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth:    { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });
  }
  return null;
};

const getFromAddress = () =>
  process.env.EMAIL_FROM ||
  process.env.GMAIL_USER ||
  process.env.EMAIL_USER ||
  'noreply@markmind.app';

let _etherealTransporter = null;
const getTransporter = async () => {
  let transporter = createTransporter();
  let usingEthereal = false;
  if (!transporter) {
    if (!_etherealTransporter) {
      console.warn('[Email] No SMTP config found — using Ethereal test account.');
      const testAccount = await nodemailer.createTestAccount();
      _etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }
    transporter = _etherealTransporter;
    usingEthereal = true;
  }
  return { transporter, usingEthereal };
};

// ── Reusable send utility ─────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const { transporter, usingEthereal } = await getTransporter();
    const info = await transporter.sendMail({
      from: `"MarkMind" <${getFromAddress()}>`,
      to, subject, html,
      text: text || subject,
    });
    const previewUrl = usingEthereal ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) console.log(`[Email] Preview: ${previewUrl}`);
    console.log(`[Email] Sent "${subject}" to ${to}`);
    return { success: true, previewUrl, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] FAILED to send "${subject}" to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ── Shared email chrome ───────────────────────────────────────────────────────
const emailWrapper = (bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#080b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080b14;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background:linear-gradient(135deg,#7c3aed,#2563eb);width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;">
                  <span style="color:white;font-size:22px;font-weight:bold;">M</span>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <span style="font-size:22px;font-weight:700;color:#a78bfa;">MarkMind</span>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.25);border-radius:20px;padding:40px 48px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#334155;">
                MarkMind · Collaborative Knowledge Management<br/>
                You can manage notification preferences in your account settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ── Welcome Email ─────────────────────────────────────────────────────────────
const buildWelcomeHTML = ({ username }) => {
  const body = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.2));border:1px solid rgba(124,58,237,0.4);">
        <span style="font-size:36px;">🎉</span>
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f1f5f9;text-align:center;">
      Welcome to MarkMind!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;">
      Hey <strong style="color:#a78bfa;">${username}</strong>, your account is ready. Start building your knowledge graph today.
    </p>

    <!-- Feature cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      ${[
        ['🔖', 'Smart Bookmarks', 'Save URLs with AI-generated tags and summaries automatically.'],
        ['🧠', 'Knowledge Graph', 'Visualize connections between your bookmarks in an interactive graph.'],
        ['🤝', 'Collaboration', 'Create shared spaces and collaborate with your team in real-time.'],
        ['🔍', 'Semantic Search', 'Find anything with intelligent, context-aware search.'],
      ].map(([icon, title, desc]) => `
      <tr><td style="padding:0 0 12px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.18);border-radius:12px;">
          <tr>
            <td style="padding:16px 20px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:40px;font-size:22px;vertical-align:middle;">${icon}</td>
                <td style="padding-left:14px;vertical-align:middle;">
                  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#e2e8f0;">${title}</p>
                  <p style="margin:0;font-size:12px;color:#64748b;">${desc}</p>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>
      </td></tr>`).join('')}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr><td align="center">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}"
          style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;font-size:15px;font-weight:600;padding:14px 44px;border-radius:10px;letter-spacing:0.02em;">
          Start Exploring &rarr;
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
      Need help? Reply to this email or visit our documentation.
    </p>
  `;
  return emailWrapper(body);
};

// ── Login Alert Email ─────────────────────────────────────────────────────────
const buildLoginAlertHTML = ({ username, loginTime, device, browser, ip }) => {
  const formattedTime = new Date(loginTime).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.1));border:1px solid rgba(34,197,94,0.3);">
        <span style="font-size:28px;">🔓</span>
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;text-align:center;">
      New Login Detected
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;">
      Hey <strong style="color:#a78bfa;">${username}</strong>, your MarkMind account was just accessed.
    </p>

    <!-- Details card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.2);border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        ${[
          ['🕐', 'Time', formattedTime],
          browser ? ['🌐', 'Browser', browser] : null,
          device  ? ['💻', 'Device',  device]  : null,
          ip      ? ['📍', 'IP Address', ip]   : null,
        ].filter(Boolean).map(([icon, label, val]) => `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
          <td style="width:28px;font-size:16px;vertical-align:top;padding-top:1px;">${icon}</td>
          <td style="padding-left:12px;">
            <span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">${label}</span><br/>
            <span style="font-size:14px;color:#e2e8f0;">${val}</span>
          </td>
        </tr></table>`).join('')}
      </td></tr>
    </table>

    <!-- Not you? -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:14px 18px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:18px;font-size:13px;">⚠️</td>
          <td style="padding-left:10px;font-size:12px;color:#94a3b8;line-height:1.5;">
            <strong style="color:#fca5a5;">Wasn't you?</strong>
            If you didn't sign in, please
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password" style="color:#f87171;">reset your password immediately</a>.
          </td>
        </tr></table>
      </td></tr>
    </table>

    <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
      If this was you, no action is needed. You can disable login alerts in your notification settings.
    </p>
  `;
  return emailWrapper(body);
};

// ── Bookmark Added Email ──────────────────────────────────────────────────────
const buildBookmarkAddedHTML = ({ username, bookmark }) => {
  const tags = Array.isArray(bookmark.tags) ? bookmark.tags : [];
  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.2));border:1px solid rgba(124,58,237,0.4);">
        <span style="font-size:28px;">🔖</span>
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;text-align:center;">
      Bookmark Saved!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;">
      Hey <strong style="color:#a78bfa;">${username}</strong>, your new bookmark has been saved with AI-generated insights.
    </p>

    <!-- Bookmark card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);border-radius:14px;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#e2e8f0;">${bookmark.title}</p>
        <p style="margin:0 0 16px;">
          <a href="${bookmark.url}" style="font-size:13px;color:#7c3aed;text-decoration:none;word-break:break-all;">${bookmark.url}</a>
        </p>

        ${bookmark.description ? `
        <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;line-height:1.6;border-left:3px solid rgba(124,58,237,0.5);padding-left:12px;">
          ${bookmark.description}
        </p>` : ''}

        ${bookmark.aiSummary ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.2);border-radius:8px;margin-bottom:16px;">
          <tr><td style="padding:12px 16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:0.06em;">🤖 AI Summary</p>
            <p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.6;">${bookmark.aiSummary}</p>
          </td></tr>
        </table>` : ''}

        ${tags.length ? `
        <div>
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">🏷️ Tags</p>
          <div>
            ${tags.slice(0, 8).map(tag => `<span style="display:inline-block;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.3);border-radius:6px;padding:3px 10px;font-size:12px;color:#a78bfa;margin:0 4px 4px 0;">${tag}</span>`).join('')}
          </div>
        </div>` : ''}
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}"
          style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 36px;border-radius:10px;">
          View All Bookmarks &rarr;
        </a>
      </td></tr>
    </table>
  `;
  return emailWrapper(body);
};

// ── Collaboration Bookmark Email ──────────────────────────────────────────────
const buildCollabBookmarkHTML = ({ memberName, adderUsername, spaceName, spaceId, bookmark }) => {
  const tags = Array.isArray(bookmark.tags) ? bookmark.tags : [];
  const spaceUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/spaces/${spaceId}`;
  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(234,88,12,0.1));border:1px solid rgba(245,158,11,0.3);">
        <span style="font-size:28px;">📚</span>
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;text-align:center;">
      New Bookmark in Your Space
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;">
      Hey <strong style="color:#a78bfa;">${memberName}</strong> — <strong style="color:#fbbf24;">${adderUsername}</strong> added a new bookmark to <strong style="color:#e2e8f0;">${spaceName}</strong>.
    </p>

    <!-- Bookmark card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:14px;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#e2e8f0;">${bookmark.title}</p>
        <p style="margin:0 0 14px;">
          <a href="${bookmark.url}" style="font-size:12px;color:#7c3aed;word-break:break-all;">${bookmark.url}</a>
        </p>
        ${bookmark.aiSummary ? `
        <p style="margin:0 0 12px;font-size:13px;color:#94a3b8;line-height:1.6;">${bookmark.aiSummary}</p>` : ''}
        ${tags.length ? `
        <div>${tags.slice(0, 6).map(tag => `<span style="display:inline-block;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:6px;padding:2px 9px;font-size:11px;color:#fbbf24;margin:0 3px 3px 0;">${tag}</span>`).join('')}</div>` : ''}
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${spaceUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 36px;border-radius:10px;">
          Open Space &rarr;
        </a>
      </td></tr>
    </table>
  `;
  return emailWrapper(body);
};

// ── Collaboration Comment Email ───────────────────────────────────────────────
const buildCollabCommentHTML = ({ memberName, commenterUsername, spaceName, spaceId, commentText }) => {
  const spaceUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/spaces/${spaceId}`;
  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(5,150,105,0.1));border:1px solid rgba(16,185,129,0.3);">
        <span style="font-size:28px;">💬</span>
      </div>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;text-align:center;">
      New Comment in Your Space
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;">
      Hey <strong style="color:#a78bfa;">${memberName}</strong> — <strong style="color:#34d399;">${commenterUsername}</strong> left a comment in <strong style="color:#e2e8f0;">${spaceName}</strong>.
    </p>

    <!-- Comment card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:14px;margin-bottom:28px;">
      <tr><td style="padding:24px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#2563eb);border-radius:50%;text-align:center;vertical-align:middle;">
            <span style="color:white;font-size:14px;font-weight:700;">${commenterUsername.charAt(0).toUpperCase()}</span>
          </td>
          <td style="padding-left:12px;vertical-align:middle;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">${commenterUsername}</p>
            <p style="margin:0;font-size:11px;color:#64748b;">just now in ${spaceName}</p>
          </td>
        </tr></table>
        <div style="margin-top:16px;padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;border-left:3px solid rgba(16,185,129,0.5);">
          <p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.7;">${commentText}</p>
        </div>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${spaceUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 36px;border-radius:10px;">
          Reply in Space &rarr;
        </a>
      </td></tr>
    </table>
  `;
  return emailWrapper(body);
};

// ── Password Reset Email ──────────────────────────────────────────────────────
const buildPasswordResetHTML = ({ username, resetUrl, expiresAt }) => {
  const expiry = new Date(expiresAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.2));border:1px solid rgba(124,58,237,0.4);">
        <span style="font-size:28px;">🔐</span>
      </div>
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;text-align:center;">Reset Your Password</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;">
      Hey <strong style="color:#a78bfa;">${username}</strong>, we received a request to reset your MarkMind password.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:10px;margin-bottom:28px;">
      <tr><td style="padding:16px 20px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:20px;vertical-align:top;padding-top:2px;font-size:14px;">⏱</td>
          <td style="padding-left:10px;font-size:13px;color:#94a3b8;line-height:1.6;">
            This link expires in <strong style="color:#e2e8f0;">1 hour</strong> (${expiry}). It can only be used once.
          </td>
        </tr></table>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;font-size:15px;font-weight:600;padding:14px 44px;border-radius:10px;letter-spacing:0.02em;">
          Reset Password &rarr;
        </a>
      </td></tr>
    </table>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 20px;"/>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:14px 18px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:18px;font-size:13px;">⚠️</td>
          <td style="padding-left:10px;font-size:12px;color:#94a3b8;line-height:1.5;">
            <strong style="color:#fca5a5;">Didn't request this?</strong>
            Your password has not been changed. You can safely ignore this email.
          </td>
        </tr></table>
      </td></tr>
    </table>
    <p style="margin:0;font-size:11px;color:#475569;text-align:center;">
      Button not working? Copy and paste this link:<br/>
      <span style="color:#7c3aed;word-break:break-all;">${resetUrl}</span>
    </p>
  `;
  return emailWrapper(body);
};

// ── Invitation Email ──────────────────────────────────────────────────────────
const buildInviteEmailHTML = ({ inviterName, spaceName, spaceDescription, acceptUrl, expiresAt }) => {
  const expiry = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f1f5f9;text-align:center;">You're invited to collaborate!</h1>
    <p style="margin:0 0 32px;font-size:15px;color:#94a3b8;text-align:center;">
      <strong style="color:#a78bfa;">${inviterName}</strong> has invited you to join a space on MarkMind.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:12px;margin-bottom:32px;">
      <tr><td style="padding:20px 24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,rgba(124,58,237,0.4),rgba(37,99,235,0.3));padding:8px 10px;border-radius:8px;margin-bottom:12px;"><span style="font-size:20px;">📚</span></div>
        <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#e2e8f0;">${spaceName}</p>
        ${spaceDescription ? `<p style="margin:0;font-size:13px;color:#94a3b8;">${spaceDescription}</p>` : ''}
      </td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">As a member you can</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      ${[['🔖','Add and share bookmarks together'],['💬','Comment and discuss in real-time'],['⚡','See live updates from all members']].map(([icon,text])=>`
      <tr><td style="padding:6px 0;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;font-size:15px;">${icon}</td>
          <td style="font-size:14px;color:#cbd5e1;">${text}</td>
        </tr></table>
      </td></tr>`).join('')}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;">Accept Invitation &rarr;</a>
      </td></tr>
    </table>
    <p style="margin:0 0 24px;font-size:12px;color:#475569;text-align:center;">This invitation expires on <strong style="color:#94a3b8;">${expiry}</strong></p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0 0 20px;"/>
    <p style="margin:0;font-size:11px;color:#475569;text-align:center;">
      If the button doesn't work, copy and paste this link:<br/>
      <span style="color:#7c3aed;word-break:break-all;">${acceptUrl}</span>
    </p>
  `;
  return emailWrapper(body);
};

// ── Public API ────────────────────────────────────────────────────────────────
const sendWelcomeEmail = async ({ toEmail, username }) => {
  return sendEmail({
    to: toEmail,
    subject: `Welcome to MarkMind, ${username}! 🎉`,
    html: buildWelcomeHTML({ username }),
    text: `Welcome to MarkMind, ${username}! Your account is ready. Visit ${process.env.FRONTEND_URL || 'http://localhost:5173'} to get started.`,
  });
};

const sendLoginAlertEmail = async ({ toEmail, username, loginTime, device, browser, ip }) => {
  return sendEmail({
    to: toEmail,
    subject: 'New login to your MarkMind account',
    html: buildLoginAlertHTML({ username, loginTime, device, browser, ip }),
    text: `Hi ${username}, a new login to your MarkMind account was detected at ${new Date(loginTime).toLocaleString()}.`,
  });
};

const sendBookmarkAddedEmail = async ({ toEmail, username, bookmark }) => {
  return sendEmail({
    to: toEmail,
    subject: `Bookmark saved: ${bookmark.title}`,
    html: buildBookmarkAddedHTML({ username, bookmark }),
    text: `Hi ${username}, your bookmark "${bookmark.title}" has been saved with tags: ${(bookmark.tags || []).join(', ')}.`,
  });
};

const sendCollabBookmarkEmail = async ({ toEmail, memberName, adderUsername, spaceName, spaceId, bookmark }) => {
  return sendEmail({
    to: toEmail,
    subject: `${adderUsername} added a bookmark to "${spaceName}"`,
    html: buildCollabBookmarkHTML({ memberName, adderUsername, spaceName, spaceId, bookmark }),
    text: `Hi ${memberName}, ${adderUsername} added "${bookmark.title}" to the space "${spaceName}".`,
  });
};

const sendCollabCommentEmail = async ({ toEmail, memberName, commenterUsername, spaceName, spaceId, commentText }) => {
  return sendEmail({
    to: toEmail,
    subject: `${commenterUsername} commented in "${spaceName}"`,
    html: buildCollabCommentHTML({ memberName, commenterUsername, spaceName, spaceId, commentText }),
    text: `Hi ${memberName}, ${commenterUsername} commented in "${spaceName}": ${commentText}`,
  });
};

const sendPasswordResetEmail = async ({ toEmail, username, resetUrl, expiresAt }) => {
  return sendEmail({
    to: toEmail,
    subject: 'Reset your MarkMind password',
    html: buildPasswordResetHTML({ username, resetUrl, expiresAt }),
    text: `Hi ${username}, reset your password at: ${resetUrl} (expires in 1 hour).`,
  });
};

const sendInvitationEmail = async ({ toEmail, inviterName, spaceName, spaceDescription, acceptUrl, expiresAt }) => {
  return sendEmail({
    to: toEmail,
    subject: `${inviterName} invited you to "${spaceName}" on MarkMind`,
    html: buildInviteEmailHTML({ inviterName, spaceName, spaceDescription, acceptUrl, expiresAt }),
    text: `${inviterName} invited you to "${spaceName}". Accept at: ${acceptUrl}`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendBookmarkAddedEmail,
  sendCollabBookmarkEmail,
  sendCollabCommentEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
};
