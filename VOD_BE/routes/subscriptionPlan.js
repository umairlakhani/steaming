var express = require('express');
var router = express.Router();
const path = require('path');

const subscriptionPlanController = require('../controller/subscriptionPlanController');
router.get('/get/:id',subscriptionPlanController.getSubscriptionPlan)
router.get('/getAll',subscriptionPlanController.getAll)
router.post('/create',subscriptionPlanController.createSubscriptionPlan)
router.put('/update/:id',subscriptionPlanController.updateSubscriptionPlan)

module.exports = router