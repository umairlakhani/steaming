var express = require('express');
var router = express.Router();

const analyticsController = require('../controller/analyticsController');
const { authorization } = require('../common/authentication');

router.get('/get-analytics/:id',authorization,analyticsController.getData);
router.get('/get-periodic-analytics/:startDate/:endDate',authorization,analyticsController.getAnalyticsData);
module.exports = router;
