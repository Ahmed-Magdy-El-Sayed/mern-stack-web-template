const userModel= require('../models/users');
const {getContentByAuthorId, updateContentAuthorImg} = require("../models/contents")
const {sendEmail} = require('./sendEmail');

const crypto = require("crypto");
const validateId = require('./validateId');
const sharp = require("sharp");
const path = require("path");
const { unlink, existsSync } = require('fs');

const updateSession = (req, res, next)=>{
    userModel.getUser(req.session.user._id).then(newUser=>{
        req.session.user = newUser;
        req.session.save();
        const user = {...newUser, role: newUser.authz.isAdmin? "admin" : newUser.authz.isEditor? "editor" : newUser.authz.isAuthor? "author" : "user"};
        delete user.authz;
        res.cookie("user", JSON.stringify(user), {expires: req.session.userSessionExp/* , secure: true, sameSite: "none" */, domain: new URL(process.env.REACT_APP_URL).hostname, path: "/"})
        res.status(200).end()
    }).catch(err=> next(err))
}

/* start the functions for signup page */
const postUser = (req,res) =>{//creat the account
    const user = req.body;
    const code = crypto.randomBytes(3).toString('hex');
    const expiration = new Date().getTime() + 15 * 60 * 1000; // make expiration 15 minute
    user.verification = {
        code: code,
        expire: expiration
    }
    userModel.createUser(user).then(result=>{//the function returns object for the user id, string for already used name/email, or throw error
        if(result.id)
            sendEmail(user.email, {
                title:"Email Verification",
                content:`
                <p>Your verification code is: <strong>${code}</strong></p>
                <strong>Note: This code expire after 15 min of sending this code first time</strong>
                <p>If you did not sign up, please ignore this email.</p>
                `
            }).then(()=>{
                res.status(201).json({id: result.id, expiration})
            }).catch(err=> next(err))
        else
            res.status(400).json({msg: result}) 
    }).catch(err=> next(err))
}
/* end the functions for signup page */

/* start the functions for login page */
const checkUser = async (req, res, next) =>{//log in the user
    const user = req.body;
    userModel.authUser(user).then(async account=>{
        if(typeof account === 'string') {// if get account failed
            res.status(401).json({msg: account});
        }else {// if get account success
            if(account.verif){// if the verification object not null, then the account is not verified
                if(account.resend) {// if need to resend the code
                    sendEmail(account.email, {
                        title:"Email Verification",
                        content:`
                        <p>Your verification code is: <strong>${account.verif.code}</strong></p>
                        <strong>Note: This code expire after 15 min of sending this code first time</strong>
                        <p>If you did not sign up, please ignore this email.</p>
                        `
                    }).then(()=>{
                        res.status(200).json({case:"verify", id: account.id, expiration: account.verif.expire});
                    }).catch(err=> next(err))
                }else res.status(200).json({case:"verify", id: account.id, expiration: account.verif.expire});

            }else{// if the account is verified
                if(account.ban.current?.ending){//check ban exist by check the value of one of ban object attributes, as the account.ban.current is object containing by default two null values attributes. so in all cases the object retrun true
                    res.status(200).json({case:"banned", ban:account.ban.current});
                }else{
                    const newWarning = account.warning.current.length? account.warning.current : null;
                    const authz = account.authz;
                    delete account.warning
                    req.session.user = {...account};
                    req.session.userSessionExp = new Date(Date.now()+3*24*60*60*1000)
                    req.session.save();
                    const user = {...req.session.user, role: authz.isAdmin? "admin" : authz.isEditor? "editor" : authz.isAuthor? "author" : "user"};
                    delete user.authz;
                    delete user.notifs
                    
                    res.cookie("user", JSON.stringify(user), {expires: req.session.userSessionExp/* , secure: true, sameSite: "none" */, domain: new URL(process.env.REACT_APP_URL).hostname, path: "/"})
                    res.status(200).json({
                        user,
                        warnings: newWarning
                    });
                }
            }
        }
    }).catch(err=> next(err))
}

const sendRestEmail =(req, res, next)=>{
    const email = req.body.email
    userModel.createResetCode(email).then((result)=>{
        if(typeof result == "string"){
            res.status(401).json({msg: result})
        }
        else{
            sendEmail(email, {
                title: "Reset Your Account Password",
                content: `
                <h4>If you forgot your password <a href="${req.get('origin')}/account/reset/${result.id}/${result.resetCode}">click here</a> to reset it</h4>
                `
            })
            res.status(201).end()
        }
    }).catch(err=> next(err))
}

const resetPass= (req, res, next)=>{
    userModel.resetAccountPass(req.body).then(result=>{
        result?
            res.status(201).end()
        :
            res.status(400).json({msg:"Bad Request! Try Again."})
    }).catch(err=> next(err))
}
/* end the functions for login page */

/* start the function of the mainbar */
const changeProfile = async (req, res, next)=>{
    const imageName = req.file?.originalname.split(".").slice(1).join(".");
    let continueToNext;
    if(imageName)//next resizing the image to remove malicious
        await sharp(req.file.path)
        .resize(500,500, {fit: "inside"}).toFile(path.join(__dirname, "..", "images", "account", imageName))
        .then(()=>{
            unlink(req.file.path, err=>{
                if(err)
                    throw err
            })
            continueToNext = true
        })
        .catch(err=>{
            next(err)
            continueToNext = false;
        })
    else continueToNext = true

    if(continueToNext)
        userModel.updateProfile({imageName: imageName, ...req.body, userID: req.session.user._id}).then(value=>{
            if(value){
                if(value.err){
                    res.status(401).json({msg: value.err}) 
                    return null
                }
                const imgPath = path.join(__dirname, "..", "images", "account", req.session.user.img);
                if(req.session.user.img !== "user.jpg" && existsSync(imgPath))
                    unlink(imgPath, err=>{
                        if(err)
                        throw err
                    })
                req.session.user = {...req.session.user, img: value};
                const authz = req.session.user.authz;
                if(Object.values(authz).includes(true))
                    updateContentAuthorImg(req.session.user._id, value)
                req.session.save(()=>{
                    const user = {...req.session.user, role: authz.isAdmin? "admin" : authz.isEditor? "editor" : authz.isAuthor? "author" : "user"};
                    delete user.authz;
                    delete user.notifs;
                    res.cookie("user", JSON.stringify(user), {expires: req.session.userSessionExp/* , secure: true, sameSite: "none" */, domain: new URL(process.env.REACT_APP_URL).hostname, path: "/"})
                    res.status(200).end()
                })
            }else res.status(200).end()
        }).catch(err=> next(err))
    
}

const logout =(req,res)=>{
    req.session.destroy(err=>{
        if(err) {
            console.error(err) 
            return res.status(500).json({msg:"Failed to logout"})
        }
        res.cookie("user", "", {expires: new Date("Thu, 01 Jan 1970 00:00:01 GMT")/* , secure: true, sameSite: "none" */, domain: new URL(process.env.REACT_APP_URL).hostname, path: "/"})
        res.status(201).end()
    });
}

const deleteAccount = (req, res, next)=>{
    const user = req.session.user;
    if(req.body.userID && user.authz.isAdmin){//if the admin request to delete the account
        if(!validateId(req.body.userID))
            return res.status(400).json({msg:"Bad Request! Try Again."})
        userModel.deleteUser(req.body.userID).then(user=>{
            if(!user){
                res.status(400).json({msg:"Account not found!"})
                return null
            }
            res.status(201).end()
            sendEmail(req.body.email, {
                title:"Your Account Was Deleted",
                content:`<p>The admin deleted your account</p>`
            })
            const imgPath = path.join(__dirname, "..", "images", "account", user.img);
            if(user.img !== "user.jpg" && existsSync(imgPath))
                unlink(imgPath, err=>{
                    if(err)
                        throw err
                })
        }).catch(err=> next(err))
    }else{//the user request to delete his account
        const oldImage = req.session.user.img;
        req.session.destroy(err=>{
            if(err){
                res.status(500).json({msg:"Internal server error"})
                return console.error(err)
            } 
            userModel.deleteUser(user._id).then(result=>{
                if(!result) res.status(400).json({msg:"Account not found!"})
                else{
                    res.cookie("user", "", {expires: new Date("Thu, 01 Jan 1970 00:00:01 GMT")/* , secure: true, sameSite: "none" */, domain: new URL(process.env.REACT_APP_URL).hostname, path: "/"})
                    res.status(201).end()
                    sendEmail(user.email, {
                        title:"Your Account Was Deleted",
                        content:`<p>The account was deleted successfully</p>`
                    })
                    const imgPath = path.join(__dirname, "..", "images", "account", oldImage);
                    if(oldImage !== "user.jpg" && existsSync(imgPath))
                        unlink(imgPath, err=>{
                            if(err)
                                throw err
                        })
                }
            }).catch(err=> next(err))
        });
    }
}
/* end the functions of mainbar */

const getProfile = async (req, res, next)=>{//get profile page data
    const profileUserID = req.params.id;
    if(!validateId(profileUserID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    
    const sessionUser = req.session.user;
    let contents;
    if(profileUserID == String(sessionUser?._id)){
        if(sessionUser.authz.isAdmin || sessionUser.authz.isEditor || sessionUser.authz.isAuthor){
            contents = await getContentByAuthorId(sessionUser._id).then(contents=>{
                const groupedContents = {underReview:[], reviewed: []};
                contents.forEach(content => {
                    groupedContents[content.isUnderReview? "underReview" : "reviewed"].push(content)
                });
                return groupedContents
            }).catch(err=>{
                next(err)
                return "error"
            });
        }
        if(contents == "error")
            return null
        res.status(200).json({contents})
    }else{
        userModel.getAuthorData(profileUserID).then(async user=>{
            if(!user) return res.status(400).json({msg:"Bad Request! Try Again."})
            
            if(user.authz.isAdmin || user.authz.isEditor || user.authz.isAuthor){
                contents = await getContentByAuthorId(profileUserID).then(contents=>{
                    let reviewedContents = [];
                    contents.forEach(content => {
                        if(!content.isUnderReview)
                            reviewedContents.push(content)
                    });
                    return reviewedContents
                }).catch(err=>{
                    next(err)
                    return "error"
                });
            }
            if(contents == "error")
                return null
            res.status(200).json({contents, profileOwner: user})
        }).catch(err=> next(err));
    }
}

/* start the functions of accountControl page */
const getAccounts = (req, res, next)=>{
    userModel.getFrist10Accounts().then(accounts=>{
        res.status(200).json(accounts)
    }).catch(err=> next(err))
}

const getMoreAccounts = (req, res, next)=>{
    const skip = parseInt(req.body.skip)
    const accountType = req.body.accountType
    userModel.getAccountsByRole({accountType, skip}).then(accounts=>{
        res.status(200).json(accounts)
    }).catch(err=> next(err))
}

const getMatchedAccounts =(req, res, next)=>{
    userModel.getAccountsByName(req.query.name).then(accounts=>{
        const groupedAccs = {users:[], authors:[], editors:[], admins:[]};
        if(req.query.name.length > 1){
            const mostMatched = accounts.filter(acc=>acc.name.match(new RegExp("^"+req.query.name,"gi")))
            const lessMatched = accounts.filter(acc=>acc.name.match(new RegExp(".+"+req.query.name,"gi")))
            const remindedAccounts = accounts.filter(acc=>!acc.name.match(new RegExp(req.query.name,"gi")))
            accounts = mostMatched.concat(lessMatched).concat(remindedAccounts)// we made 3 filters to make the most relevent accounts at the first
        }
        accounts.forEach(acc=>{
            if(acc.authz.isAdmin)
                groupedAccs.admins.push(acc)
            else if(acc.authz.isEditor)
                groupedAccs.editors.push(acc)
            else if(acc.authz.isAuthor)
                groupedAccs.authors.push(acc)
            else
                groupedAccs.users.push(acc)
        })
        res.status(200).json(groupedAccs)
    }).catch(err=> next(err))
}

const changeAuthz= (req, res, next)=>{
    if(!validateId(req.body.userID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    userModel.changeUserAuthz({...req.body, notif:{
            msg:"The admin change your authorization to be "+req.body.authz,
            href:""
        }
    }).then(()=>{
        res.status(201).end()
        sendEmail(req.body.email, {
            title:"Changing In The Authoriziation",
            content:`<p>The admin changed your account authorization to be ${req.body.authz}</p>`
        })
    }).catch(err=> next(err))
}

const warningAccount = (req, res, next)=>{
    if(!validateId(req.body.userID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    userModel.warningUser(req.body).then(()=>{
        res.status(201).end()
        sendEmail(req.body.email, {
            title:"Admin Warning",
            content:`<h5>The admin sent warning that: ${req.body.reason}</h5>`
        })
    }).catch(err=> next(err))
}

const deleteWarning = (req, res, next)=>{
    userModel.removeWarning({userID: req.session.user._id, warning: req.body.warning}).then(()=>{
        res.status(201).end()
    }).catch(err=> next(err))
}

const banAccount = (req, res, next)=>{
    if(!validateId(req.body.userID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    userModel.banUser(req.body).then(()=>{
        res.status(201).end()
        const banEndTime = new Date(new Date().getTime()+Math.floor(req.body.duration)*24*60*60*1000).toLocaleString("en")
        sendEmail(req.body.email, {
            title:"Your Account Is Banned",
            content:`
            <h5>Your account is banned because: ${req.body.reason}</h5>
            <p>the ban ending in ${banEndTime}</p>
            `
        })
    }).catch(err=> next(err))
}

const unbanAccount = (req, res, next)=>{
    if(!validateId(req.body.userID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    userModel.unbanUser(req.body).then(()=>{
        res.status(201).end()
        sendEmail(req.body.email, {
            title:"Your Account Is Unbanned",
            content:`
            <h5>The admin unbanned your account and you can login now</h5>
            `
        })
    }).catch(err=> next(err))
}
/* end the functions of accountControl page */

/* start the functions for notifications */
const uniqueNotifyReviewers = (notifMsg, data)=>{
    userModel.getReviewersNotifs().then(reviewers=>{
        reviewers.forEach(async reviewer=>{
            sendEmail(
                reviewer.email, 
                {
                    title:"New Content to review", 
                    content:`<p>${data.authorName} submit new content (${data.contentName}) that need to review <a href='${data.root}/content/control'>click here</a> to go to content review page</p>`
                }
            )
            try {
                if(reviewer.notifs.length){
                    let notifyExist = false
                    reviewer.notifs.forEach(async notif=>{
                        if(!notif.isReaded && notif.msg == notifMsg){
                            notifyExist = true;
                        }
                    })
                    if(notifyExist)
                        await userModel.updateNotif({userID: reviewer._id, notif:{msg: notifMsg}})
                    else
                        await userModel.addNotif({userID: reviewer._id, notif:{msg: notifMsg, href: "/content/control"}})
                }else
                    await userModel.addNotif({userID: reviewer._id, notif:{msg: notifMsg, href: "/content/control"}})
                    
            } catch(err){
                console.log(err);
            }
        })
    }).catch(err=> next(err))
}

const clearNotif = (req, res, next)=>{
    const user = req.session.user;
    userModel.clearUserNotif(user._id).then(()=>{
        res.status(201).end()
    }).catch(err=> next(err))
}

const readNotif = (req, res, next)=>{//when open the notifications
    userModel.markNotifReaded(req.session.user._id).then(({notifs})=>{
        req.session.user.notifsNotReaded = 0
        const authz = req.session.user.authz;
        req.session.save(()=>{
            const user = {...req.session.user, role: authz.isAdmin? "admin" : authz.isEditor? "editor" : authz.isAuthor? "author" : "user"};
            delete user.authz;
            res.cookie("user", JSON.stringify(user), {expires: req.session.userSessionExp/* , secure: true, sameSite: "none" */, domain: new URL(process.env.REACT_APP_URL).hostname, path: "/"})
            res.status(201).json(notifs)
        })
    }).catch( err=> next(err))
}
/* end the functions for notifications */

module.exports={
    updateSession,
    getProfile,
    sendRestEmail,
    resetPass, postUser, checkUser,
    changeProfile, logout, 
    deleteAccount, getAccounts, getMoreAccounts, 
    getMatchedAccounts, banAccount, 
    unbanAccount, warningAccount, deleteWarning,
    changeAuthz, uniqueNotifyReviewers,
    clearNotif, readNotif
};