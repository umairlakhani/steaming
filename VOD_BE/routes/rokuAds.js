var express = require('express');
var router = express.Router();
const rokuAdController = require('../controller/rokuAdController');
const { authorization } = require('../common/authentication');

// Generate VAST response for Roku ads
router.get('/vast', authorization, rokuAdController.generateVastResponse);

// Get ad configuration for a video
router.get('/config/:videoId', authorization, rokuAdController.getVideoAdConfig);

// Update ad configuration for a video
router.put('/config/:videoId', authorization, rokuAdController.updateVideoAdConfig);

module.exports = router; 