var express = require('express');
var router = express.Router();

const channelController = require('../controller/channelController');

router.post('/create', channelController.create);
router.post('/update', channelController.update);
router.post('/images', channelController.images);
router.get('/owned', channelController.ownedList);
router.get('/dashboardInfo', channelController.dashboardInfo);

module.exports = router;
