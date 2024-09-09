const express = require('express')
const router = express.Router();

const {getContents}= require('../controller/content.controller');

router.get('/', getContents)
router.use('/account',require('./account.router'))
router.use('/verify',require('./verif.router'))
router.use('/content',require('./content.router'))

module.exports = router