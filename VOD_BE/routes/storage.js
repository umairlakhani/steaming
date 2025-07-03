var express = require('express');
var router = express.Router();
const path = require('path');


const storageController = require('../controller/storageController');
const { authorization } = require('../common/authentication');

// router.get('/create-space',storageController.createSpacesBucket)
router.get('/bucket-space/:id',storageController.getBucketStorageUsage)
router.get('/presigned-url',storageController.createPreSignedUrl)

module.exports = router;
