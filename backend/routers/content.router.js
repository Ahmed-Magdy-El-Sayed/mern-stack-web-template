const express = require('express')
const router = express.Router();
const {getMoreContents,
    getContent, hideContent, 
    showContent, editContent, deleteContent, 
    addContent, getContentControl, 
    selectContent, unselectContent,
    searchContent, updateSlider,
    approveContent, rejectContent
}= require('../controllers/content.controller');

const {
    isLoggedIn, isReviewer, isAuthor, upload
} = require('../controllers/middelwares')

router.get('/id/:id', getContent)
router.post('/more', getMoreContents)
router.post('/add', isLoggedIn, isAuthor, (req, res, next)=>{ 
    upload.single('img')(req, res, err=>{ 
        if(err){console.log(err); return res.status(401).json({msg: "Internal Server Error"})} 
        next()
    })
}, addContent)
router.put('/hide', isLoggedIn, isAuthor, hideContent)
router.put('/show', isLoggedIn, isAuthor, showContent)
router.put('/edit', isLoggedIn, isAuthor, (req, res, next)=>{ 
    upload.single('img')(req, res, err=>{ 
        if(err){console.log(err); return res.status(401).json({msg: "Internal Server Error"})} 
        next()
    })
}, editContent)
router.delete('/delete', isLoggedIn, isAuthor, deleteContent)
router.get('/control', isLoggedIn, isReviewer, getContentControl)
router.put('/select', isLoggedIn, isReviewer, selectContent)
router.put('/unselect', isLoggedIn, isReviewer, unselectContent)
router.get('/search', searchContent)
router.put('/slider/update', isLoggedIn, isReviewer, (req, res, next)=>{ 
    upload.array('img')(req, res, err=>{ 
        if(err){console.log(err); return res.status(401).json({msg: "Internal Server Error"})} 
        next()
    })
}, updateSlider)
router.put('/approve', isLoggedIn, isReviewer, approveContent)
router.delete('/reject', isLoggedIn, isReviewer, rejectContent)

router.use('',require('./comment.router'))

module.exports = router