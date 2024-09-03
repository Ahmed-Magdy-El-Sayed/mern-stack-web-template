const express = require('express')
const router = express.Router();

const {
    getAccounts,
    getMoreAccounts,
    updateSession,
    getMatchedAccounts,
    getProfile,
    sendRestEmail, 
    resetPass,
    deleteAccount, changeProfile, 
    changeAuthz,
    clearNotif, readNotif, 
    banAccount, unbanAccount, warningAccount,
    deleteWarning, postUser, checkUser, logout,
}= require('../controller/account.controller');

const {
    isLoggedIn, isAdmin, upload, isLoggedOut
} = require('../controller/middelwares')


router.post('/signup', isLoggedOut, postUser)

router.post('/password-forgot/send-email', sendRestEmail)
router.post('/password-reset', resetPass)
router.post('/login', isLoggedOut, checkUser)
router.get('/profile/:id', getProfile)

router.put('/profile/update', isLoggedIn, (req, res, next)=>{ 
    upload.single('profile-img')(req, res, err=>{ err? res.status(401).json({msg: err}) : next()})
}, changeProfile)

router.get('/', isLoggedIn, isAdmin, getAccounts)
router.post('/', isLoggedIn, isAdmin, getMoreAccounts)
router.put('/update', updateSession)
router.get('/search', isLoggedIn, isAdmin, getMatchedAccounts)
router.put("/authzs/change", isLoggedIn, isAdmin, changeAuthz)
router.post("/ban", isLoggedIn, isAdmin, banAccount)
router.delete("/ban/delete", isLoggedIn, isAdmin, unbanAccount)
router.post("/warning", isLoggedIn, isAdmin, warningAccount)
router.delete("/warning", isLoggedIn, deleteWarning)
router.delete("/delete", isLoggedIn, deleteAccount)
router.post("/notif/read", isLoggedIn, readNotif)
router.delete("/notif/clear", isLoggedIn, clearNotif)

router.get('/logout', isLoggedIn, logout)

module.exports = router