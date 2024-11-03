const express = require('express')
const router = express.Router();

const {
    checkUsername,
    postUser, authUser,
    sendRestEmail, 
    resetPass,
    getProfile,
    getProfileContents,
    changeProfile,
    toggleUserEmailNotif,
    getAccounts,
    getMoreAccounts,
    getMatchedAccounts,
    changeAuthz,
    banAccount, unbanAccount,
    warningAccount, deleteWarning,
    deleteAccount,
    updateSession,
    readNotif, clearNotif,
    logout,
}= require('../controllers/account.controller');

const {
    isLoggedIn, isAdmin, upload, isLoggedOut
} = require('../controllers/middelwares')

// auth
router.post('/username/check', checkUsername)
router.post('/signup', isLoggedOut, postUser)
router.post('/login', isLoggedOut, authUser)
router.post('/password-forgot/send-email', sendRestEmail)
router.post('/password-reset', resetPass)
router.use("/oauth", require("./oauth.router"))

// profile
router.get('/profile/:id', getProfile)
router.get('/profile/:id/content', getProfileContents)
router.put('/profile/update', isLoggedIn, (req, res, next)=>{ 
    if(['66db3bc377c6ad39f86a330d', '66fd9be2c3497fc2d0797831', '66fd9c07c3497fc2d0797835', '66fd9c2fc3497fc2d0797839'].includes(String(req.session.user._id)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create another account to apply this change on'})
    upload.single('profile-img')(req, res, err=>{ err? res.status(401).json({msg: err}) : next()})
}, changeProfile)
router.get('/profile/email-notif/toggle', isLoggedIn, toggleUserEmailNotif)

// accounts control
router.get('/', isLoggedIn, isAdmin, getAccounts)
router.post('/', isLoggedIn, isAdmin, getMoreAccounts)
router.get('/search', isLoggedIn, isAdmin, getMatchedAccounts)
router.put("/authzs/change", isLoggedIn, isAdmin, (req, res, next)=>{ 
    if(['66db3bc377c6ad39f86a330d', '66fd9be2c3497fc2d0797831', '66fd9c07c3497fc2d0797835', '66fd9c2fc3497fc2d0797839'].includes(String(req.session.user._id)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create another account to apply this change on'})
    next()
}, changeAuthz)
router.post("/ban", isLoggedIn, isAdmin, (req, res, next)=>{ 
    if(['66db3bc377c6ad39f86a330d', '66fd9be2c3497fc2d0797831', '66fd9c07c3497fc2d0797835', '66fd9c2fc3497fc2d0797839'].includes(String(req.session.user._id)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create another account to apply this change on'})
    next()
}, banAccount)
router.delete("/ban/delete", isLoggedIn, isAdmin, unbanAccount)
router.post("/warning", isLoggedIn, isAdmin, warningAccount)
router.delete("/warning", isLoggedIn, deleteWarning)

router.delete("/delete", isLoggedIn, (req, res, next)=>{
    const usersArr = ['66db3bc377c6ad39f86a330d', '66fd9be2c3497fc2d0797831', '66fd9c07c3497fc2d0797835', '66fd9c2fc3497fc2d0797839']
    if(usersArr.includes(String((req.body.userID && user.authz.isAdmin)? req.body.userID : req.session.user._id)))
        return res.status(403).json({msg: 'Forbedden for this demo account. Create another account to apply this change on'})
    next()
}, deleteAccount)

// navbar
router.put('/session-update', isLoggedIn, updateSession)
router.post("/notif/read", isLoggedIn, readNotif)
router.delete("/notif/clear", isLoggedIn, clearNotif)
router.get('/logout', isLoggedIn, logout)

module.exports = router