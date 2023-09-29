const { 
    createUser, authUser, createResetCode, resetAccountPass, 
    getAuthorData, getFrist10Accounts, getAccountsByRole, getAccountsByName, 
    banUser, unbanUser, warningUser, 
    changeUserAuthz, updateProfile, deleteUser, 
    clearUserNotif, deleteUserByAdmin, addNotif, updateNotif,
    getReviewersNotifs, markNotifReaded
} = require('../models/users');
const {getContentByAuthorId} = require("../models/contents")
const {sendEmail} = require('./sendEmail');

const crypto = require("crypto")

/* start the functions for signup page */
const getSignup =(req,res)=>{// load the page
    res.render('signup')
}

const postUser = (req,res) =>{//creat the account
    const user = req.body;
    const code = crypto.randomBytes(3).toString('hex');
    const expiration = new Date().getTime() + 15 * 60 * 1000; // make expiration 15 minute
    user.verification = {
        code: code,
        expire: expiration
    }
    user.img="/user.jpg"
    createUser(user).then(result=>{//the function returns object for the user id, string for already used name/email, or throw error
        if(result.id)
            sendEmail(user.email, {
                title:"Email Verification",
                content:`
                <p>Your verification code is: <strong>${code}</strong></p>
                <strong>Note: This code expire after 15 min of sending this code first time</strong>
                <p>If you did not sign up, please ignore this email.</p>
                `
            }).then(()=>{
                res.render('verif',{id: result.id, expiration})
            }).catch(err=>{
                console.error(err)
                res.status(500).render('error',{error: "internal server error"});
            })
        else
            res.status(400).render('signup', {error: result}) 
    }).catch(err=>{
        console.error(err)
        res.status(500).render('error',{error: "internal server error"});
    })
}
/* end the functions for signup page */

/* start the functions for login page */
let loginErr;
let ban;
const getLogin =(req,res)=>{//load the page
    res.render('login',{
        error: loginErr,
        ban
    })
    loginErr = null;
    ban = null;
}

const checkUser = async (req, res) =>{//log in the user
    const user = req.body;
    authUser(user).then(async account=>{
        if(typeof account === 'string') {// if get account failed
            loginErr = account;
            res.redirect(301,'/account/login');
        }else {// if get account success
            if(account.verif){// if the verification object not null, then the account is not verified
                if(account.resend) {// if need to resend the code
                    sendEmail(user.email, {
                        title:"Email Verification",
                        content:`
                        <p>Your verification code is: <strong>${account.verif.code}</strong></p>
                        <strong>Note: This code expire after 15 min of sending this code first time</strong>
                        <p>If you did not sign up, please ignore this email.</p>
                        `
                    }).then(()=>{
                        res.render('verif',{id: account.id, expiration: account.verif.expire});
                    }).catch(err=>{
                        console.error(err)
                        res.status(500).render('error', {error: "Internal server error"})
                    })
                }else res.render('verif',{id: account.id, expiration: account.verif.expire});
            }else{// if the account is verified
                if(account.deleteByAdmin){
                    if(account.error){
                        loginErr = "Something went wrong. Try again"
                        res.redirect(301,'/account/login');
                    }else{
                        loginErr = "Your account was deleted by the admin"
                        res.redirect(301,'/account/login');
                    }
                }else if(account.ban.ending){//check ban exist by check the value of one of ban object attributes as the account.ban is object contain by default two null values attributes, so in all cases the object retrun true
                    ban = account.ban // ban variable is added when login page is rendered so can alert the user that he is banned
                    res.redirect(301,'/account/login');
                }else{
                    req.session.warning = account.warning.length? account.warning : null// the same as ban variable but added to home page after login success
                    delete account.warning // as it will be shown once, so it shouldn't be stored in the user session
                    req.session.user = account
                    res.redirect(301,'/');
                }
            }
        }
    }).catch(err=>{
        console.error(err)
        res.status(500).render('error',{error: "internal server error"});
    })
}

let resetPageAlert;
const getForgetPassPage = (req, res)=>{
    res.render('forgetPass', {alert: resetPageAlert})
    resetPageAlert = null
}
const sendRestEmail =(req, res)=>{
    const email = req.body.email
    createResetCode(email).then((result)=>{
        if(typeof result == "string"){
            resetPageAlert = {msg: result, type: "danger"}
            res.redirect(req.get('Referrer'))
        }
        else{
            sendEmail(email, {
                title: "Reset Your Account Password",
                content: `
                <h4>If you forgot your password <a href="${req.protocol + '://' + req.get('host')}/account/reset/${result.id}/${result.resetCode}">click here</a> to reset it</h4>
                `
            })
            resetPageAlert = {msg: "The reset link sent to your email", type:"success"}
            res.redirect(req.get('Referrer'))
        }
    }).catch(err=>{
        console.error(err)
        res.status(500).render("error",{error:"Internal server error"})
    })
}

const getResetPage = (req, res)=>{
    res.render("resetPass", {...req.params})
}

const resetPass= (req, res)=>{
    resetAccountPass(req.body).then(result=>{
        result?
            res.redirect("/account/login")
        :
            res.status(400).render("error", {error: "Bad Request! Try Again"})
    }).catch(err=>{
        console.error(err)
        res.status(500).render('error',{error: "internal server error"});
    })
}
/* end the functions for login page */

/* start the function of the main bar */
const changeProfile = (req, res)=>{
    updateProfile({filename:req.file?.filename,...req.body, userID: req.session.user}).then(value=>{
        if(value){
            if(value.err){
                profileEditErr = value.err
                res.status(301).redirect("/") 
                return null
            }
            req.session.user = {...req.session.user, img: value};
            req.session.save(()=>{
                res.redirect(req.get('Referrer'))
            })
        }else res.redirect(req.get('Referrer'))
    }).catch(err=>{
        console.log(err)
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}

const logout =(req,res)=>{
    req.session.destroy(err=>{
        if(err) return console.error(err) 
    });
    res.status(301).redirect('/account/login')
}

const deleteAccount = (req, res)=>{// button in update profile option
    const user = req.session.user;
    if(req.body.userID && user.isAdmin){//if the admin who delete the account
        if(!req.body.userID.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
        deleteUserByAdmin(req.body.userID).then(()=>{
            res.status(201).end()
            sendEmail(req.body.email, {
                title:"Your Account Was Deleted",
                content:`
                <p>the admin deleted your account</p>
                `
            })
        }).catch(err=>{
            console.log(err)
            res.status(500).render("error",{user: req.session.user, error: "internal server error"})
        })
    }else{//the user who delete his account
        req.session.destroy(err=>{
            if(err){
                res.status(500).render("error",{user: req.session?.user, error: "internal server error"})
                return console.error(err)
            } 
            deleteUser(user._id).then(result=>{
            if(result == -1) res.status(400).render("error",{user: req.session?.user, error: "Account not found!"})
            else {
                res.redirect(301,"/")
                sendEmail(user.email, {
                    title:"Your Account Was Deleted",
                    content:`
                    <p>The account was deleted successfully</p>
                    `
                })
                }
            }).catch(err=>{
                console.log(err)
                res.status(500).render("error",{user: req.session?.user, error: "internal server error"})
            })
        });
    }
}
/* end the functions of main bar */

const getProfile = async (req, res)=>{//load myContent page
    const profileUserID = req.params.id;
    if(!(profileUserID.match(/^[0-9a-fA-F]{24}$/)))
        return res.status(400).render('error', {error: "Bad Request! try again."})
    
    const sessionUser = req.session.user;
    let contents;
    if(profileUserID == String(sessionUser?._id)){
        if(sessionUser.isAdmin || sessionUser.isEditor || sessionUser.isAuthor){
            contents = await getContentByAuthorId(sessionUser._id).then(contents=>{
                const groupedContents = {underReview:[], reviewed: []};
                contents.forEach(content => {
                    groupedContents[content.isUnderReview? "underReview" : "reviewed"].push(content)
                });
                return groupedContents
            }).catch(err=>{console.log(err);
                res.status(500).render("error",{user: req.session.user, error: "internal server error"})
                return "error"
            });
        }
        if(contents == "error")
            return null
        res.render('profile',{contents, user: sessionUser})
    }else{
        getAuthorData(profileUserID).then(async user=>{
            if(!user) return res.status(400).render('error', {error: "Bad Request! try again."})
            
            if(user.isAdmin || user.isEditor || user.isAuthor){
                contents = await getContentByAuthorId(profileUserID).then(contents=>{
                    let reviewedContents = [];
                    contents.forEach(content => {
                        if(!content.isUnderReview)
                            reviewedContents.push(content)
                    });
                    return reviewedContents
                }).catch(err=>{console.log(err);
                    res.status(500).render("error",{user: req.session.user, error: "internal server error"})
                    return "error"
                });
            }
            if(contents == "error")
                return null
            res.render('profile',{contents, author: user, user: sessionUser})
        }).catch(err=>{console.log(err);
            res.status(500).render("error",{user: req.session.user, error: "internal server error"})
        });
    }
}

/* start the functions of accountControl page */
const getAccounts = (req, res)=>{// load the page
    getFrist10Accounts().then(accounts=>{
        res.render('accountsControl', {accounts, user: req.session.user})
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "internal server error"})
    })
}


const getMoreAccounts = (req, res)=>{//when the admin click on show more under the accounts sections
    const skip = parseInt(req.body.skip)
    const accountType = req.body.accountType
    getAccountsByRole({accountType, skip}).then(accounts=>{
        res.status(200).json(accounts)
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "Internal server error"})
    })
}

const getMatchedAccounts =(req, res)=>{//when admin search for specific account
    getAccountsByName(req.query.name).then(accounts=>{
        if(req.query.name.length > 1){
            const matchedAccounts1 = accounts.filter(acc=>acc.name.match(new RegExp("^"+req.query.name,"gi")))
            const matchedAccounts2 = accounts.filter(acc=>acc.name.match(new RegExp(".+"+req.query.name,"gi")))
            const notMatchedAccounts = accounts.filter(acc=>!acc.name.match(new RegExp(req.query.name,"gi")))
            accounts = matchedAccounts1.concat(matchedAccounts2).concat(notMatchedAccounts)
        }
        res.status(200).json(accounts)
    }).catch(err=>{
        console.log(err);
        res.status(500).render("error",{user: req.session.user, error: "Internal server error"})
    })
}

const changeAuthz= (req, res)=>{
    if(!req.body.userID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    changeUserAuthz({...req.body, notif:{
            msg:"The admin change your authorization to be "+req.body.authz,
            href:""
        }
    }).then(()=>{
        res.status(201).end()
        sendEmail(req.body.email, {
            title:"Changing In The Authoriziation",
            content:`<p>The admin change your account authorization to be ${req.body.authz}</p>`
        })
    }).catch(err=>{
        console.log(err);
        res.status(500).end()
    })
}

const warningAccount = (req, res)=>{
    if(!req.body.userID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    warningUser(req.body).then(()=>{
        res.status(201).end()
        sendEmail(req.body.email, {
            title:"Admin Warning",
            content:`<h5>The admin sent warning that: ${req.body.reason}</h5>`
        })
    }).catch(err=>{
        console.log(err);
        res.status(500).end()
    })
}

const banAccount = (req, res)=>{
    if(!req.body.userID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    banUser(req.body).then(()=>{
        res.status(201).end()
        const banEndTime = new Date(new Date().getTime()+Math.floor(req.body.duration)*24*60*60*1000).toLocaleString("en")
        sendEmail(req.body.email, {
            title:"Your Account Is Banned",
            content:`
            <h5>your account is banned because: ${req.body.reason}</h5>
            <p>the ban ending in ${banEndTime}</p>
            `
        })
    }).catch(err=>{
        console.log(err);
        res.status(500).end()
    })
}

const unbanAccount = (req, res)=>{
    if(!req.body.userID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    unbanUser(req.body).then(()=>{
        res.status(201).end()
        sendEmail(req.body.email, {
            title:"Your Account Is Unbanned",
            content:`
            <h5>The admin unban your account and you can login now</h5>
            `
        })
    }).catch(err=>{
        console.log(err);
        res.status(500).end()
    })
}
/* end the functions of accountControl page */

/* start the functions for notifications */
const notifyReviewerWithoutRepeat = (notifMsg, data)=>{// notify the admins and the editors that there is new content to review when author submit content
    getReviewersNotifs().then(reviewers=>{
        reviewers.forEach(async reviewer=>{
            sendEmail(
                reviewer.email, 
                {
                    title:"New Content to review", 
                    content:`<p>${data.authorName} submit new content (${data.contentName}) that need to review <a href='${data.root}/content/review'>click here</a> to go to content review page</p>`
                }
            )
            if(reviewer.notifs.length){
                let notifyExist = false
                reviewer.notifs.forEach(async notif=>{
                    if(!notif.isReaded && notif.msg == notifMsg){
                        notifyExist = true;
                    }
                })
                if(notifyExist)
                    await updateNotif({userID: reviewer._id, notif:{msg: notifMsg}}).catch(err=>{
                        console.log(err);
                    })
                else
                    await addNotif({userID: reviewer._id, notif:{msg: notifMsg, href: "/content/review"}}).catch(err=>{
                        console.log(err);
                    })
            }else
                await addNotif({userID: reviewer._id, notif:{msg: notifMsg, href: "/content/review"}}).catch(err=>{
                    console.log(err);
                })
        })
    }).catch(err=>{
        console.log(err);
    })
}

const updateSessionNotif = (req, res)=>{//for online users, save the notification to the session. so no need to call the data from database
    const user =req.session.user;
    user.notifs = req.body.notifs
    user.notifsNotReaded++
    res.end()
}

const clearNotif = (req, res)=>{// if user click on clear notification option in the buttom of notification section
    clearUserNotif(req.session.user._id).then(()=>{
        req.session.user.notifs = []
        res.status(201).end()
    }).catch(err=>{console.log(err);
        res.status(500).end("internal server error")
    })
}

const readNotif = (req, res)=>{//when open the notifications
    const user = req.session.user;
    markNotifReaded(user._id).then(()=>{
        const readedNum = user.notifs.length - user.notifsNotReaded
        const editedNotif = user.notifs.splice(-readedNum).map(notif=>{notif.isReaded = true; return notif})
        user.notifsNotReaded = 0
        user.notifs= user.notifs.map(notif=>{
            notif.isReaded=true;
            return notif
        })
        user.notifs.push(...editedNotif)
        res.status(201).end()
    }).catch( err=>{
        console.log(err)
        res.status(500).end("internal server error")
    })
}
/* end the functions for notifications */

module.exports={
    getSignup, getLogin, 
    getProfile,
    getForgetPassPage, sendRestEmail,
    getResetPage, resetPass,
    postUser, checkUser,
    changeProfile, logout, 
    deleteAccount, getAccounts, getMoreAccounts, 
    getMatchedAccounts, banAccount, 
    unbanAccount, warningAccount, changeAuthz, 
    notifyReviewerWithoutRepeat,
    clearNotif, readNotif, updateSessionNotif
};