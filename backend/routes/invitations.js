const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/invitationController');

// Public: view invite details before deciding (token in URL)
router.get('/token/:token', c.getInviteByToken);

// Protected: all below require JWT
router.use(auth);

// Accept / reject (user must be logged in, email must match)
router.post('/accept', c.acceptInvite);
router.post('/reject', c.rejectInvite);

module.exports = router;
