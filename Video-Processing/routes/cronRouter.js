var express = require('express');
const {authorization} =require('../common/authentication');
const { startPaperSpaceCron, stopPaperSpaceCron } = require('../controller/cronController');
const { cronDeleteApi, cronAddApi } = require('../controller/queueController');
var router = express.Router();
// router.get('/stopcron', stopPaperSpaceCron);
router.get('/stopcron', cronDeleteApi);
router.get('/startcron',cronAddApi);

module.exports = router;
