const crypto = require('crypto');
const User   = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
} = require('../services/emailService');

const sign = (user) =>
  jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Parse device/browser from User-Agent ─────────────────────────────────────
const parseUserAgent = (ua = '') => {
  if (!ua) return { browser: 'Unknown', device: 'Unknown' };

  let browser = 'Unknown';
  if (ua.includes('Edg/'))       browser = 'Microsoft Edge';
  else if (ua.includes('OPR/'))  browser = 'Opera';
  else if (ua.includes('Chrome'))browser = 'Google Chrome';
  else if (ua.includes('Firefox'))browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';

  let device = 'Desktop';
  if (/Mobile|Android|iPhone|iPad/.test(ua)) device = 'Mobile / Tablet';

  return { browser, device };
};

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ username, email, password });

    // Send welcome email (fire-and-forget, non-blocking)
    sendWelcomeEmail({ toEmail: user.email, username: user.username })
      .catch(err => console.error('[register] welcome email failed:', err.message));

    res.json({ token: sign(user), user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });

    // Send login alert if preference is on (default: true)
    const prefs = user.notificationPreferences || {};
    const wantsLoginAlert = prefs.loginAlerts !== false;

    if (wantsLoginAlert) {
      const ua = req.headers['user-agent'] || '';
      const { browser, device } = parseUserAgent(ua);
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'Unknown';

      sendLoginAlertEmail({
        toEmail:   user.email,
        username:  user.username,
        loginTime: new Date(),
        browser,
        device,
        ip,
      }).catch(err => console.error('[login] alert email failed:', err.message));
    }

    res.json({ token: sign(user), user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Notification Preferences ─────────────────────────────────────────────
exports.getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notificationPreferences || { loginAlerts: true, bookmarkEmails: true, collaborationEmails: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update Notification Preferences ──────────────────────────────────────────
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { loginAlerts, bookmarkEmails, collaborationEmails } = req.body;
    const update = {};
    if (typeof loginAlerts         === 'boolean') update['notificationPreferences.loginAlerts']         = loginAlerts;
    if (typeof bookmarkEmails      === 'boolean') update['notificationPreferences.bookmarkEmails']      = bookmarkEmails;
    if (typeof collaborationEmails === 'boolean') update['notificationPreferences.collaborationEmails'] = collaborationEmails;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true })
      .select('notificationPreferences');
    res.json(user.notificationPreferences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const genericResponse = { message: 'If an account with that email exists, a password reset link has been sent.' };
    if (!user) return res.json(genericResponse);

    const rawToken    = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl  = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl   = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({ toEmail: user.email, username: user.username, resetUrl, expiresAt: user.resetPasswordExpires });
    } catch (emailErr) {
      user.resetPasswordToken   = null;
      user.resetPasswordExpires = null;
      await user.save({ validateBeforeSave: false });
      console.error('[ForgotPassword] Email send failed:', emailErr.message);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    res.json(genericResponse);
  } catch (err) {
    console.error('[ForgotPassword] Error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    if (!token)    return res.status(400).json({ message: 'Reset token is required' });
    if (!password) return res.status(400).json({ message: 'New password is required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });

    user.password             = password;
    user.resetPasswordToken   = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('[ResetPassword] Error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};
