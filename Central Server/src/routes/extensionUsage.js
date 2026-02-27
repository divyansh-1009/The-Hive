const { Router } = require('express');
const authenticate = require('../middleware/auth');
const extensionUsageController = require('../controllers/extensionUsageController');

const router = Router();

router.post('/', authenticate, extensionUsageController.submit);

module.exports = router;
