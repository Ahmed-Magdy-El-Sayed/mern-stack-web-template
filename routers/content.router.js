const express = require('express')
const router = express.Router();
const {
    getContent, hideContent, 
    showContent, deleteContent, 
    addContent, reviewContent, 
    approveContent, rejectContent, 
    getContentsByAuthor
}= require('../controller/content.controller');

const {
    isReviewer, isAuthor
} = require('../controller/middelwares')

router.get('/id/:id', getContent)
router.post('/add', isAuthor, addContent)
router.post('/hide', isAuthor, hideContent)
router.post('/show', isAuthor, showContent)
router.post('/delete', isAuthor, deleteContent)
router.get('/review', isReviewer, reviewContent)
router.post('/approve', isReviewer, approveContent)
router.post('/reject', isReviewer, rejectContent)
router.get('/my-content', isAuthor, getContentsByAuthor)

router.use('',require('./comment.router'))

module.exports = router