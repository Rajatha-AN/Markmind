const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/spaceController');

router.use(auth);

router.get('/', c.getAll);
router.post('/', c.create);
router.get('/:id', c.getOne);
router.delete('/:id', c.deleteSpace);

// Invitations
router.post('/:id/invite', c.sendInvite);
router.get('/:id/invitations', c.getSpaceInvitations);
router.post('/:id/invitations/:invitationId/resend', c.resendInvite);

// Members
router.delete('/:id/members/:memberId', c.removeMember);

// Content
router.post('/:id/bookmarks', c.addBookmark);
router.post('/:id/comments', c.addComment);

module.exports = router;
