const {verify, updateVerif, isVerified} = require("../models/users")
const { sendEmail } = require("./sendEmail");

const verifyUser = (req, res) =>{
    const id = req.body.id;
    if(!id.match(/^[0-9a-fA-F]{24}$/)) 
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    const code = req.body.code;
    verify(id, code).then(result=>{
        if(!result) return res.status(400).render('error', {error: "Bad Request! Try again"})
        if(result.expired)
            res.render('verif' ,{id, err: `The Code Is Expired`})
        else if(result.notTheCode)
            res.render('verif' ,{id, err: `The Code Is Wrong`, expiration: result.expire})
        else{
            req.session.user = result
            res.redirect(301,'/')
        }
    }).catch(err=>{
        console.log(err)
        res.status(500).render('error', {error: "Internal server error"})
    })
}

const generateCode =(req, res)=>{
    const id = req.params.id;
    if(!id.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
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
            res.render('verif', {id, expiration: verif.expire})
        }).catch(err=>{
            console.error(err)
            res.status(500).render('error', {error: "Internal server error"})
        })
    }).catch(err=>{
        console.log(err)
        res.status(500).render('error', {error: "Internal server error"})
    })
}

const resendEmail = (req, res)=>{
    const id = req.params.id;
    if(!id.match(/^[0-9a-fA-F]{24}$/)) 
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    isVerified(id).then(result=>{// returns string for verified accounts, object for not verified, or false for error
        if(result == "verified") res.redirect(301,"/")
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
                res.render('verif', {id, expiration: verif.expire})
            }).catch(err=>{
                console.error(err)
                res.status(500).render('error', {error: "Internal server error"})
            })
        }
    }).catch(err=>{
        console.log(err)
        res.status(500).render('error', {error: "Internal server error"})
    })
}

module.exports= {
    verifyUser,
    generateCode,
    resendEmail
}