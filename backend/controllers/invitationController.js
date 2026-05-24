const Invitation = require('../models/Invitation');
const Space = require('../models/Space');
const User = require('../models/User');
const { sendInvitationEmail } = require('../services/emailService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ========================
// SEND INVITATION
// ========================
exports.sendInvite = async (req, res) => {
  try {
    const { email } = req.body;
    const spaceId = req.params.id;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Verify space exists and requester is a member
    const space = await Space.findOne({ _id: spaceId, members: req.user.id })
      .populate('createdBy', 'username');

    if (!space) {
      return res.status(404).json({ message: 'Space not found or access denied' });
    }

    // Only the creator (or members, your call) can invite — we allow any member
    const normalizedEmail = email.toLowerCase().trim();

    // Check if invitee is already a member
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && space.members.some(m => m.toString() === existingUser._id.toString())) {
      return res.status(400).json({ message: 'This user is already a member of this space' });
    }

    // Prevent duplicate pending invites
    const existingInvite = await Invitation.findOne({
      space: spaceId,
      email: normalizedEmail,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email' });
    }

    // Create invitation
    const invitation = await Invitation.create({
      space: spaceId,
      invitedBy: req.user.id,
      email: normalizedEmail,
    });

    const acceptUrl = `${FRONTEND_URL}/invite/accept?token=${invitation.token}`;

    // Send email
    const inviter = await User.findById(req.user.id);
    const emailResult = await sendInvitationEmail({
      toEmail: normalizedEmail,
      inviterName: inviter.username,
      spaceName: space.name,
      spaceDescription: space.description,
      acceptUrl,
      expiresAt: invitation.expiresAt,
    });

    res.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
      // Return preview URL in dev so frontend can show it
      ...(emailResult.previewUrl && { emailPreviewUrl: emailResult.previewUrl }),
    });

  } catch (err) {
    console.error('[sendInvite]', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// GET INVITATION BY TOKEN (preview before accepting)
// ========================
exports.getInviteByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate('space', 'name description members')
      .populate('invitedBy', 'username email');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.isExpired()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(410).json({ message: 'This invitation has expired' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `This invitation has already been ${invitation.status}` });
    }

    res.json({
      invitation: {
        id: invitation._id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        space: {
          id: invitation.space._id,
          name: invitation.space.name,
          description: invitation.space.description,
          memberCount: invitation.space.members.length,
        },
        invitedBy: {
          username: invitation.invitedBy.username,
        },
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================
// ACCEPT INVITATION
// ========================
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const invitation = await Invitation.findOne({ token })
      .populate('space');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.isExpired()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(410).json({ message: 'This invitation has expired' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `This invitation has already been ${invitation.status}` });
    }

    // Ensure the logged-in user's email matches the invited email
    const acceptingUser = await User.findById(req.user.id);
    if (acceptingUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invitation was sent to ${invitation.email}. Please log in with that account.`,
      });
    }

    const space = await Space.findById(invitation.space._id);

    // Add member if not already in
    if (!space.members.some(m => m.toString() === req.user.id)) {
      space.members.push(req.user.id);
      await space.save();
    }

    // Mark invitation accepted
    invitation.status = 'accepted';
    await invitation.save();

    // Populate for response
    const updatedSpace = await Space.findById(space._id)
      .populate('members', 'username email')
      .populate('bookmarks');

    res.json({
      message: 'You have joined the space!',
      space: updatedSpace,
    });

  } catch (err) {
    console.error('[acceptInvite]', err);
    res.status(500).json({ message: err.message });
  }
};

// ========================
// REJECT INVITATION
// ========================
exports.rejectInvite = async (req, res) => {
  try {
    const { token } = req.body;

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Invitation already ${invitation.status}` });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json({ message: 'Invitation declined' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================
// GET PENDING INVITATIONS FOR A SPACE (owner view)
// ========================
exports.getSpaceInvitations = async (req, res) => {
  try {
    const spaceId = req.params.id;

    // Verify access
    const space = await Space.findOne({ _id: spaceId, members: req.user.id });
    if (!space) {
      return res.status(404).json({ message: 'Space not found' });
    }

    const invitations = await Invitation.find({ space: spaceId })
      .populate('invitedBy', 'username')
      .sort({ createdAt: -1 });

    // Mark expired ones
    const now = new Date();
    const result = invitations.map(inv => ({
      id: inv._id,
      email: inv.email,
      status: inv.expiresAt < now && inv.status === 'pending' ? 'expired' : inv.status,
      expiresAt: inv.expiresAt,
      invitedBy: inv.invitedBy?.username,
      createdAt: inv.createdAt,
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================
// RESEND INVITATION
// ========================
exports.resendInvite = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId)
      .populate('space', 'name description');

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Reset expiry and token
    const crypto = require('crypto');
    invitation.token = crypto.randomBytes(32).toString('hex');
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invitation.status = 'pending';
    await invitation.save();

    const inviter = await User.findById(req.user.id);
    const acceptUrl = `${FRONTEND_URL}/invite/accept?token=${invitation.token}`;

    const emailResult = await sendInvitationEmail({
      toEmail: invitation.email,
      inviterName: inviter.username,
      spaceName: invitation.space.name,
      spaceDescription: invitation.space.description,
      acceptUrl,
      expiresAt: invitation.expiresAt,
    });

    res.json({
      message: 'Invitation resent',
      ...(emailResult.previewUrl && { emailPreviewUrl: emailResult.previewUrl }),
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
