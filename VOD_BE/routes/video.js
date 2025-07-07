var express = require('express');
var router = express.Router();
const path = require('path');
const multer = require('multer');
// const upload = multer({ dest: 'tempVideo/' });

const videoStorage = multer.diskStorage({
  destination: 'tempVideo',
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + path.extname(file.originalname),
    );
  },
});
const upload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 10000000000,
  },
  fileFilter(req, file, cb) {
    cb(undefined, true);
  },
});

const videoController = require('../controller/videoController');
const { authorization } = require('../common/authentication');

router.post('/create',authorization,videoController.create);
router.put('/', authorization,videoController.update);
router.post('/archive',authorization, videoController.archive);
router.post('/delete',authorization, videoController.remove);
router.get('/get/:id',authorization, videoController.getVideo);
router.get('/get/videoId/:id',authorization, videoController.getVideoByVideoId);
router.get('/owned/archived',authorization, videoController.ownedListArchived);
router.get('/owned/complete-published',authorization, videoController.ownedListCompletePublished);
router.get('/owned/publishedById/:id',authorization, videoController.ownedListSinglePublished);
router.get('/owned/complete-archived',authorization, videoController.ownedListCompleteArchived);
router.get('/owned/published',authorization, videoController.ownedListPublished);
router.get('/owned/published/processed',authorization, videoController.ownedListPublishedProcessed);
router.get('/roku/manifest',authorization, videoController.generateRokuManifest);
router.get('/livestreaming-videos',authorization, videoController.liveStreamingVideos);
router.get('/livestreaming/user',authorization, videoController.getLiveStreamingOnAir);
router.get('/public/:id', videoController.getUserPublicVideos);
router.put('/type/:id',authorization, videoController.changeType);
router.post('/video-upload',authorization, videoController.videoUpload);
router.get('/schedule',authorization, videoController.scheduleGet);
router.post('/schedule',authorization, videoController.schedule);
router.post('/scheduleDelete',authorization, videoController.scheduleDelete);
router.post('/scheduleEdit',authorization, videoController.scheduleEdit);
module.exports = router;
