var express = require('express');
const {authorization} =require('../common/authentication')
var router = express.Router();
const liveStreamingController = require('../controller/liveStreamingController');
router.get('/live-stream-create',authorization, liveStreamingController.createLiveStream);
router.get('/live-stream-end',authorization, liveStreamingController.endLiveStream);
router.post('/video-process', liveStreamingController.processVideo);
router.get('/stream-status/:streamId', liveStreamingController.getStreamStatus);
// Add this to your Video-Processing routes
router.get('/api/rtmp/status', (req, res) => {
  try {
    const sessions = nms.getSession();
    res.json({
      status: 'running',
      port: 1935,
      sessions: Object.keys(sessions || {}).length,
      config: {
        rtmp_port: 1935,
        http_port: process.env.HTTP_PORT || 8000
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});
// router.post('/live-stream-create-record',authorization, liveStreamingController.createLiveStreamRecord);

module.exports = router;
