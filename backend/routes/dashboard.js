const router = require('express').Router();
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');
router.get('/', auth, getStats);
module.exports = router;
