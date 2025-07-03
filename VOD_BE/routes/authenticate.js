var express = require('express');
var router = express.Router();
const { authorization } = require('../common/authentication');

const usersController = require('../controller/usersController');

router.post('/signup', usersController.signup);
router.post('/verifyEmail', authorization, usersController.verifyEmail);
router.post('/login', usersController.login);

module.exports = router;
