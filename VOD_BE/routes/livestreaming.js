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

module.exports = router;
