const express = require('express')
const router = express.Router();
const {getMoreContents,
    getContent, hideContent, 
    showContent, editContent, deleteContent,
    getFavoriteContents ,toggleFavorite,
    addContent, getContentControl, 
    selectContent, unselectContent,
    searchContent, updateSlider,
    approveContent, rejectContent
}= require('../controllers/content.controller');

const {
    isLoggedIn, isReviewer, isAuthor, upload
} = require('../controllers/middelwares')

// Home -note: the function that get the 10 contents in the app.js
router.get('/search', searchContent)
router.post('/more', getMoreContents)

// profile
router.get('/favorite/account/:id', isLoggedIn, getFavoriteContents)
router.put('/favorite/toggle', isLoggedIn, toggleFavorite)
router.post('/add', isLoggedIn, isAuthor, (req, res, next)=>{ 
    upload.single('img')(req, res, err=>{ 
        if(err){console.log(err); return res.status(401).json({msg: "Internal Server Error"})} 
        next()
    })
}, addContent)

// content
router.get('/id/:id', getContent)
router.put('/hide', isLoggedIn, isAuthor, (req, res, next)=>{ 
    if(['66db515dccfccd7677107197', '66db51d9ccfccd76771071a5', '670149744226ccf5903c434d', '6701497a4226ccf5903c4357', '670149814226ccf5903c4364'].includes(String(req.body.contentID)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create your own account to apply this change on'})
    next()
}, hideContent)
router.put('/show', isLoggedIn, isAuthor, (req, res, next)=>{ 
    if(['66db515dccfccd7677107197', '66db51d9ccfccd76771071a5', '670149744226ccf5903c434d', '6701497a4226ccf5903c4357', '670149814226ccf5903c4364'].includes(String(req.body.contentID)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create your own account to apply this change on'})
    next()
}, showContent)
router.put('/edit', isLoggedIn, isAuthor, (req, res, next)=>{ 
    if(['66db515dccfccd7677107197', '66db51d9ccfccd76771071a5', '670149744226ccf5903c434d', '6701497a4226ccf5903c4357', '670149814226ccf5903c4364'].includes(String(req.body.contentID)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create your own account to apply this change on'})
    
    upload.single('img')(req, res, err=>{ 
        if(err){console.log(err); return res.status(401).json({msg: "Internal Server Error"})} 
        next()
    })
}, editContent)
router.delete('/delete', isLoggedIn, isAuthor, (req, res, next)=>{ 
    if(['66db515dccfccd7677107197', '66db51d9ccfccd76771071a5', '670149744226ccf5903c434d', '6701497a4226ccf5903c4357', '670149814226ccf5903c4364'].includes(String(req.body.contentID)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create your own account to apply this change on'})
    next()
}, deleteContent)

//content control
router.get('/control', isLoggedIn, isReviewer, getContentControl)
router.put('/select', isLoggedIn, isReviewer, selectContent)
router.put('/unselect', isLoggedIn, isReviewer, unselectContent)
router.put('/approve', isLoggedIn, isReviewer, approveContent)
router.delete('/reject', isLoggedIn, isReviewer, rejectContent)
router.put('/slider/update', isLoggedIn, isReviewer, (req, res, next)=>{ 
    return res.status(403).json({msg: "Change slider not allowed in the demo"})
    /* upload.array('img')(req, res, err=>{ 
        if(err){console.log(err); return res.status(401).json({msg: "Internal Server Error"})} 
        next()
    }) */
}, updateSlider)

router.use('',require('./comment.router'))

module.exports = router