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
const adSpeedController = require('../controller/adSpeedController');

router.post('/video-upload', adSpeedController.videoUpload);
router.post('/create-video-ad', adSpeedController.create);
router.post('/create-wrappervideo-ad', adSpeedController.createWrapperAd);  
router.get('/get-all-ads/:zoneId/:zoneName',adSpeedController.getAdList)
router.post('/edit-ad',adSpeedController.editAd)
router.get('/get',adSpeedController.getAllAds)
router.get('/get/:id',adSpeedController.getAd)
router.post('/delete',adSpeedController.deleteAd)
// router.post('/zone/create-zone', adSpeedController.create);

module.exports = router