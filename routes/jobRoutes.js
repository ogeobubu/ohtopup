const router = require('express').Router();
const jobAuth = require('../middleware/jobAuth');
const controller = require('../controllers/jobController');

router.post('/run', jobAuth, controller.run);

module.exports = router;
