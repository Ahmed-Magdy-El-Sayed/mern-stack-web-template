const  passport = require("passport");
const  {Strategy: GoogleStrategy} = require("passport-google-oauth20");
const  dotenv = require( "dotenv");
const { saveOauthUser } = require("./models/users");

dotenv.config()

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/account/oauth/google/callback",
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done)=>{
            saveOauthUser({
                firstName: profile._json.given_name,
                lastName: profile._json.family_name,
                email: profile._json.email,
                img: profile._json.picture,
                oauth:true
            }).then(user=>{
                done(null, user)
            }).catch(err=>
                done(err)
            )
        }
    )
)


passport.serializeUser((user, done)=>{
    done(null, user)
})

module.exports = passport;