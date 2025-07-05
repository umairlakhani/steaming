var express = require('express');
var router = express.Router();

const liveStreamingController = require('../controller/liveStreamingController');
const { authorization } = require('../common/authentication');
router.get('/streaming/:id', liveStreamingController.getLiveStreaming);
router.get('/streamingrecord/:streamingId', liveStreamingController.getLiveStreamRecord);
router.get('/live-stream-download', liveStreamingController.downloadStream);
router.get('/live-stream-chunk', liveStreamingController.get_latest_chunk);
router.get('/live-stream-user-leave/:id', liveStreamingController.userLeft);
router.put('/live-stream-upload',authorization, liveStreamingController.uploadLiveStream);
router.post('/live-stream-create',authorization, liveStreamingController.createLiveStream);
router.post('/live-stream-endtime',authorization, liveStreamingController.terminateStream);
router.post('/live-stream-create-record',authorization, liveStreamingController.createLiveStreamRecord);
router.post('/update-live-stream-thumbnail',authorization, liveStreamingController.updateLiveStreamThumbnail);
router.get('/get-stream-key',authorization, liveStreamingController.getStreamKeyForUser);
router.post('/generate-stream-key',authorization, liveStreamingController.generateStreamKeyForUser);
router.get('/check-video-onair/:id',authorization, liveStreamingController.checkVideoOnAir);
router.get('/deleteLiveStream/:id',authorization, liveStreamingController.deleteLiveStreamById);
// Add this route to VOD_BE/routes/livestreaming.js
router.get('/stream-status/:streamId', async (req, res, next) => {
  try {
    const { streamId } = req.params;
    console.log("Checking stream status for:", streamId);
    
    // Check if stream exists in database
    const streamRecord = await prisma.liveStreaming.findUnique({
      where: { streamingId: streamId }
    });
    
    if (!streamRecord) {
      return res.status(404).json({ 
        active: false, 
        error: "Stream not found" 
      });
    }
    
    // Check if stream is still active (hasn't ended)
    const isActive = !streamRecord.endTime;
    
    res.json({
      active: isActive,
      streamId: streamId,
      title: streamRecord.Title,
      startTime: streamRecord.startTime,
      endTime: streamRecord.endTime,
      streamType: streamRecord.streamType || 'WEBRTC'
    });
    
  } catch (error) {
    console.error("Error checking stream status:", error);
    res.status(500).json({ 
      active: false, 
      error: "Server error" 
    });
  }
});

module.exports = router;
