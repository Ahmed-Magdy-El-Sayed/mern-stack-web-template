const express = require('express')
const router = express.Router();
const multer = require('multer');

const {
    getAccounts, getMoreAccounts, 
    getMatchedAccounts, getSignup, 
    getLogin, getProfile,
    getForgetPassPage,
    sendRestEmail, 
    getResetPage, resetPass, 
    deleteAccount, changeProfile, 
    changeAuthz, updateSessionNotif,
    clearNotif, readNotif, 
    banAccount, unbanAccount, warningAccount,
    postUser, checkUser, logout,
}= require('../controller/account.controller');

const {
    isLoggedOut, isLoggedIn, isAdmin
} = require('../controller/middelwares')


router.get('/signup', isLoggedOut, getSignup)
router.post('/signup', postUser)

router.get('/login', isLoggedOut, getLogin)
router.get('/password-forgot', getForgetPassPage)
router.post('/password-forgot/send-email', sendRestEmail)
router.get('/reset/:id/:resetCode', getResetPage)
router.post('/password-reset', resetPass)
router.post('/login', checkUser)
router.get('/profile/:id', getProfile)

router.post('/change-profile', multer({
    storage: multer.diskStorage({//to save new profile img in images folder
        destination:(req, file, cb)=>{
            cb(null, 'images');
        },
        filename:(req, file, cb)=>{
            cb(null, "/"+Date.now()+ '.' +file.originalname.split('.')[1])
        }
    })
}).single('img'), changeProfile)

router.get('/', isAdmin, getAccounts)
router.post('/', isAdmin, getMoreAccounts)
router.get('/search', isAdmin, getMatchedAccounts)
router.post("/authzs/change", isAdmin, changeAuthz)
router.post("/ban", isAdmin, banAccount)
router.post("/ban/delete", isAdmin, unbanAccount)
router.post("/warning", isAdmin, warningAccount)
router.post("/delete", isLoggedIn, deleteAccount)
router.post("/notif/update", isLoggedIn, updateSessionNotif)
router.post("/notif/read", isLoggedIn, readNotif)
router.post("/notif/clear", isLoggedIn, clearNotif)

router.get('/logout', isLoggedIn, logout)

module.exports = router