var express = require('express');
var router = express.Router();

const usersController = require('../controller/usersController');
const { authorization } = require('../common/authentication');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.put('/', usersController.update);
router.post('/forgot', usersController.forgotPassword);
router.post('/reset', usersController.resetPassword);
router.post('/images', authorization,usersController.images);
router.get('/active-plan', authorization,usersController.getCurrentActivePlan);
router.get('/user-payments', authorization,usersController.getAllPayments);
router.get('/update-user', authorization,usersController.updateUser)
module.exports = router;
