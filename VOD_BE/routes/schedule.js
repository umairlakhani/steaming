var express = require('express');
var router = express.Router();

const scheduleController = require('../controller/scheduleController');
const { authorization } = require('../common/authentication');

router.post('/create', authorization, scheduleController.createSchedule);
router.put('/updateSchedule/:id', authorization, scheduleController.createSchedule);
router.post('/saveSchedule', authorization, scheduleController.saveSchedule);
router.put('/update/:id', authorization, scheduleController.updateSchedule);
router.delete('/delete/:id', authorization, scheduleController.deleteSchedule);
router.get('/get/:id', authorization, scheduleController.getSchedule);
router.get('/getByDate', scheduleController.getVideoByDateTime);
router.get('/all', authorization, scheduleController.getAllSchedules);
router.get('/scheduleData', scheduleController.scheduleDataGet);
router.put('/processSlots/:id',authorization,scheduleController.processSlots)
router.get('/public/all/:id', scheduleController.getAllPublicSchedules);
router.get('/public/livestream/:id', scheduleController.getUserPublicLiveStream);
router.get('/public/scheduleStatus/:id', scheduleController.getScheduleStatus);


module.exports = router;
