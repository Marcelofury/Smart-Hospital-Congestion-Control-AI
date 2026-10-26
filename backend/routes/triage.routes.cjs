const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triage.controller.cjs');

router.post('/triage', triageController.evaluateTriage.bind(triageController));
router.get('/health', triageController.healthCheck.bind(triageController));

module.exports = router;
