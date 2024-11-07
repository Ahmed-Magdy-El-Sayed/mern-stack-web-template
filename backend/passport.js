const  passport = require("passport");
const  {Strategy: GoogleStrategy} = require("passport-google-oauth20");
const  dotenv = require( "dotenv");
const { saveOauthUser } = require("./models/users");

dotenv.config()

/*
    OAuth Integration Guide

    This template includes Google OAuth integration using Passport.js.
    To add another third-party OAuth provider, follow these steps:

    1. Install the necessary Passport strategy for the desired provider.
        For example, to add GitHub OAuth, run:
        npm install passport-github

    2. Require the strategy in your application: as the google strategy in the passport.js file

    3. Configure the strategy with your client ID, client secret, and callback URL: as the google strategy in the passport.js file

    4. Set up the authentication routes: as the two google routes below.

    6. add the link to the client login and signup pages

    For more information on integrating other OAuth providers, refer to the
    Passport.js documentation: https://www.passportjs.org/packages/
 */

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