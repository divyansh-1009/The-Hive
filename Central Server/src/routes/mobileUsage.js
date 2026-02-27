const { Router } = require('express');
const authenticate = require('../middleware/auth');
const mobileUsageController = require('../controllers/mobileUsageController');

const router = Router();

router.post('/', authenticate, mobileUsageController.submit);

module.exports = router;
