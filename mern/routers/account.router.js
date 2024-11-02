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
    upload.single('profile-img')(req, res, err=>{ err? res.status(401).json({msg: err}) : next()})
}, changeProfile)
router.get('/profile/email-notif/toggle', isLoggedIn, toggleUserEmailNotif)

// accounts control
router.get('/', isLoggedIn, isAdmin, getAccounts)
router.post('/', isLoggedIn, isAdmin, getMoreAccounts)
router.get('/search', isLoggedIn, isAdmin, getMatchedAccounts)
router.put("/authzs/change", isLoggedIn, isAdmin, changeAuthz)
router.post("/ban", isLoggedIn, isAdmin, banAccount)
router.delete("/ban/delete", isLoggedIn, isAdmin, unbanAccount)
router.post("/warning", isLoggedIn, isAdmin, warningAccount)
router.delete("/warning", isLoggedIn, deleteWarning)


// navbar
router.put('/session-update', isLoggedIn, updateSession)
router.post("/notif/read", isLoggedIn, readNotif)
router.delete("/notif/clear", isLoggedIn, clearNotif)
router.delete("/delete", isLoggedIn, deleteAccount)
router.get('/logout', isLoggedIn, logout)

module.exports = router