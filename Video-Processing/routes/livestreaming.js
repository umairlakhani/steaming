var express = require('express');
const {authorization} =require('../common/authentication')
var router = express.Router();
const liveStreamingController = require('../controller/liveStreamingController');
router.get('/live-stream-create',authorization, liveStreamingController.createLiveStream);
router.get('/live-stream-end',authorization, liveStreamingController.endLiveStream);
router.post('/video-process', liveStreamingController.processVideo)
// router.post('/live-stream-create-record',authorization, liveStreamingController.createLiveStreamRecord);

module.exports = router;
