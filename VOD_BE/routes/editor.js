var express = require('express');
var router = express.Router();

const editorController = require('../controller/editorController');

router.post('/add', editorController.addEditorToChannel);
router.post('/remove', editorController.removeEditorToChannel);
router.get('/list', editorController.getEditorsPerChannel);

module.exports = router;
