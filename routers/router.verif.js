const express = require('express')
const router = express.Router();

const {
    verifyUser,
    generateCode,
    resendEmail
}= require('../controller/controller.verif');

router.post('/', verifyUser)
router.get('/new-code/:id', generateCode)
router.get('/resend-email/:id', resendEmail)

module.exports = router