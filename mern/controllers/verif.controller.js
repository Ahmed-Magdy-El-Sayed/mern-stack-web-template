const {verify, updateVerif, isVerified} = require("../models/users")
const { sendEmail } = require("./sendEmail");
const validateId = require("./validateId");

const verifyUser = (req, res, next) =>{
    const id = req.body.id;
    if(!validateId(id)) 
        return res.status(400).json({msg: "Bad Request! Try Again."})
    const code = req.body.code;
    verify(id, code).then(result=>{
        if(!result) return res.status(400).json({msg: "Bad Request! Try Again."})
        if(result.expired)
            res.status(410).json({msg:"The Code Is Expired"})
        else if(result.notTheCode)
            res.status(401).json({msg:"The Code Is Wrong"})
        else{
            req.session.user = result
            req.session.userSessionExp = new Date(Date.now()+3*24*60*60*1000)
            req.session.save();
            const user = {...req.session.user, role: result.authz.isAdmin? "admin" : result.authz.isEditor? "editor" : result.authz.isAuthor? "author" : "user"};
            delete user.authz
            res.cookie("user", JSON.stringify(user), {expires: req.session.userSessionExp, path: "/"})
            res.status(200).end()
        }
    }).catch(err=> next(err))
}

const generateCode =(req, res, next)=>{
    const id = req.params.id;
    if(!validateId(id))
        return res.status(400).json({msg: "Bad Request! Try Again."})
    updateVerif(id).then(result=>{
        const {email, verif} = result
        sendEmail(email, {
            title:"Email Verification",
            content:`
            <p>Your verification code is: <strong>${verif.code}</strong></p>
            <strong>Note: This code expire after 15 min of sending this code first time</strong>
            <p>If you did not sign up, please ignore this email.</p>
            `
        }).then(()=>{
            res.status(201).end()
        }).catch(err=> next(err))
    }).catch(err=> next(err))
}

const resendEmail = (req, res, next)=>{
    const id = req.params.id;
    if(!validateId(id)) 
        return res.status(400).json({msg: "Bad Request! Try Again."})
    isVerified(id).then(result=>{// returns string for verified accounts, object for not verified, or false for error
        if(result == "verified") res.status(400).json({msg: "Bad Request! The Account is already verified."})
        else{
            const {email, verif} = result
            sendEmail(email, {
                title:"Email Verification",
                content:`
                <p>Your verification code is: <strong>${verif.code}</strong></p>
                <strong>Note: This code expire after 15 min of sending this code first time</strong>
                <p>If you did not sign up, please ignore this email.</p>
                `
            }).then(()=>{
                res.status(201).json()
            }).catch(err=> next(err))
        }
    }).catch(err=> next(err))
}

module.exports= {
    verifyUser,
    generateCode,
    resendEmail
}