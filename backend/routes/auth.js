const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getNotificationPreferences,
  updateNotificationPreferences,
} = require('../controllers/authController');

router.post('/register',        register);
router.post('/login',           login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Notification preferences (protected)
router.get('/notification-preferences',    auth, getNotificationPreferences);
router.put('/notification-preferences',    auth, updateNotificationPreferences);

module.exports = router;
