var express = require('express');
var router = express.Router();

const zoneController = require('../controller/zoneController');
const { authorization } = require('../common/authentication');

router.get('/zone/:id',authorization,zoneController.checkZoneExists);
router.post('/create',authorization,zoneController.createAdSpeedZone);
router.get('/user',authorization,zoneController.getUserZones);
router.get('/:id',authorization,zoneController.getZoneById);
router.put('/:id',authorization,zoneController.EditZones);
// router.get('zone-tag/:id',authorization,zoneController.EditZones);
router.post('/link-adToZone',authorization,zoneController.linkAdToZone);
router.get('/tag/:id',authorization,zoneController.ZoneTag);
router.get('/livestream/tag/:id',authorization,zoneController.getUserLiveStreamTag);


module.exports = router