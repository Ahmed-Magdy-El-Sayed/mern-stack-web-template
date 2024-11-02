const express = require("express")
const passport = require("../passport")
const router = express.Router()

const {isLoggedIn} = require("../controllers/middelwares")
const { oauthCallback, postUsername } = require("../controllers/oauth.controller")

router.get("/google", passport.initialize(), passport.authenticate("google", {scope: ["profile", "email"], passReqToCallback: true, session: false}))
router.get("/google/callback", passport.authenticate("google"), oauthCallback)
router.post("/username/set", isLoggedIn, postUsername)

module.exports = router