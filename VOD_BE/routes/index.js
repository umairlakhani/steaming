var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    module: "index reached",
    token: req.tokenData
  });
});

module.exports = router;
