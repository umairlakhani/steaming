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

// Add this route to test MediaSoup status
router.get('/mediasoup-status', (req, res) => {
  res.json({
    workerReady,
    hasWorker: !!worker,
    hasRouter: !!router,
    routerId: router?.id,
    rtpCapabilities: router?.rtpCapabilities ? 'Available' : 'Missing'
  });
});

// Add stream status endpoint
router.get('/stream-status/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    console.log("Checking stream status for:", streamId);
    
    // Check if producers exist for this stream
    const streamVideo = streamProducers[streamId]?.videoProducer;
    const streamAudio = streamProducers[streamId]?.audioProducer;
    const globalVideo = global.mediasoup?.webrtc?.videoProducer || videoProducer;
    const globalAudio = global.mediasoup?.webrtc?.audioProducer || audioProducer;
    
    const hasVideo = !!(streamVideo || globalVideo);
    const hasAudio = !!(streamAudio || globalAudio);
    const isActive = hasVideo || hasAudio;
    
    console.log("Stream status check result:", {
      streamId,
      hasVideo,
      hasAudio,
      isActive,
      availableStreams: Object.keys(streamProducers)
    });

    res.json({
      active: isActive,
      hasVideo,
      hasAudio,
      streamId: streamId,
      availableStreams: Object.keys(streamProducers),
      debug: {
        streamSpecific: { video: !!streamVideo, audio: !!streamAudio },
        global: { video: !!globalVideo, audio: !!globalAudio }
      }
    });
    
  } catch (error) {
    console.error("Error checking stream status:", error);
    res.status(500).json({ 
      active: false, 
      error: "Server error",
      message: error.message 
    });
  }
});

module.exports = router;
