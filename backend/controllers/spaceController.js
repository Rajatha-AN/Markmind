const Space = require('../models/Space');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const invCtrl = require('./invitationController');
const { sendCollabBookmarkEmail, sendCollabCommentEmail } = require('../services/emailService');

// Re-export invitation methods
exports.sendInvite = invCtrl.sendInvite;
exports.getSpaceInvitations = invCtrl.getSpaceInvitations;
exports.resendInvite = invCtrl.resendInvite;

// Helper: get member emails for collaboration notifications (excluding a userId)
const getMemberEmailsExcluding = async (space, excludeUserId) => {
  const memberIds = space.members.map(m => m._id || m).filter(id => id.toString() !== excludeUserId.toString());
  if (!memberIds.length) return [];
  const users = await User.find({ _id: { $in: memberIds } }).select('email username notificationPreferences');
  return users.filter(u => u.notificationPreferences?.collaborationEmails !== false);
};

// ======================
// CREATE SPACE
// ======================
exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    const space = await Space.create({
      name, description,
      createdBy: req.user.id,
      members: [req.user.id],
    });
    res.json(space);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// GET ALL SPACES
// ======================
exports.getAll = async (req, res) => {
  try {
    const spaces = await Space.find({ members: req.user.id })
      .populate('members', 'username email')
      .populate('createdBy', 'username');
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// GET SINGLE SPACE
// ======================
exports.getOne = async (req, res) => {
  try {
    const space = await Space.findOne({ _id: req.params.id, members: req.user.id })
      .populate('bookmarks')
      .populate('members', 'username email')
      .populate('createdBy', 'username')
      .populate('comments.user', 'username');
    if (!space) return res.status(404).json({ message: 'Space not found' });
    res.json(space);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// ADD BOOKMARK (realtime + email notifications)
// ======================
exports.addBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.body;
    const space = await Space.findOne({ _id: req.params.id, members: req.user.id });
    if (!space) return res.status(404).json({ message: 'Space not found' });

    if (!space.bookmarks.includes(bookmarkId)) {
      space.bookmarks.push(bookmarkId);
      await space.save();
    }

    const populated = await Space.findById(space._id).populate('bookmarks').populate('members', 'username email');
    const addedBookmark = populated.bookmarks.find(b => b._id.toString() === bookmarkId);

    const user = await User.findById(req.user.id, 'username');
    req.app.get('io').to(req.params.id).emit('bookmark-added', {
      bookmark: addedBookmark,
      addedBy: user.username,
    });

    // Email other members who want collab notifications
    const notifyMembers = await getMemberEmailsExcluding(populated, req.user.id);
    for (const member of notifyMembers) {
      sendCollabBookmarkEmail({
        toEmail:       member.email,
        memberName:    member.username,
        adderUsername: user.username,
        spaceName:     space.name,
        spaceId:       space._id,
        bookmark:      addedBookmark,
      }).catch(err => console.error('[addBookmark] email failed:', err.message));
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// ADD COMMENT (realtime + email notifications)
// ======================
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const space = await Space.findOne({ _id: req.params.id, members: req.user.id }).populate('members', 'username email');
    if (!space) return res.status(404).json({ message: 'Space not found' });

    const comment = {
      user: req.user.id,
      username: req.user.username,
      text: text.trim(),
    };

    space.comments.push(comment);
    await space.save();

    const addedComment = space.comments[space.comments.length - 1];

    req.app.get('io').to(req.params.id).emit('comment-added', {
      _id: addedComment._id,
      text: addedComment.text,
      username: req.user.username,
      userId: req.user.id,
      createdAt: addedComment.createdAt,
    });

    // Email other members (not the commenter)
    const notifyMembers = await getMemberEmailsExcluding(space, req.user.id);
    for (const member of notifyMembers) {
      sendCollabCommentEmail({
        toEmail:           member.email,
        memberName:        member.username,
        commenterUsername: req.user.username,
        spaceName:         space.name,
        spaceId:           space._id,
        commentText:       text.trim(),
      }).catch(err => console.error('[addComment] email failed:', err.message));
    }

    res.json(addedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// REMOVE MEMBER (creator only)
// ======================
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ message: 'Space not found' });
    if (space.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the space creator can remove members' });
    if (memberId === space.createdBy.toString())
      return res.status(400).json({ message: 'Cannot remove the space creator' });
    space.members = space.members.filter(m => m.toString() !== memberId);
    await space.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
// DELETE SPACE (creator only)
// ======================
exports.deleteSpace = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) return res.status(404).json({ message: 'Space not found' });
    if (space.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the creator can delete this space' });
    await Space.findByIdAndDelete(req.params.id);
    await Invitation.deleteMany({ space: req.params.id });
    res.json({ message: 'Space deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
