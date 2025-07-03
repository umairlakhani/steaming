var express = require('express');
var router = express.Router();

const channelController = require('../controller/channelController');
const { startAnalytic } = require('../controller/bandwidthController');

router.post('/startvideo',startAnalytic);

module.exports = router;
