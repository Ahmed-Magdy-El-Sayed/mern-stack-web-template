const mongoose = require('mongoose');
const dbConnect = require('./dbConnect')
const bcrypt = require("bcrypt")
const crypto = require("crypto")

const uSchema = new mongoose.Schema({
    name: {type: String, trim: true},
    email: String,
    img:{type: String, default: "user.jpg"},
    password: String,
    passwordResetCode: String,
    verification: {
        code: String,
        expire: String
    },
    notifs:[{msg: String, href: String, num:{type: Number, default:1}, isReaded: Boolean}],
    notifsNotReaded:{type: Number, default: 0},
    authz:{
        isAuthor:{type: Boolean, default: false},
        isEditor:{type: Boolean, default: false},
        isAdmin:{type: Boolean, default: false}
    },
    totalReviews:Number,
    contentsNum:Number,
    ban: {
        current: {reason: String, ending: String},
        all: [String],
    },
    warning: {
        current:[String],
        all: [String],
    }
})

const usersModel = new mongoose.model('user',uSchema)

module.exports ={
    getUser: userID =>{
        try {
            return dbConnect(async ()=>{
                return await usersModel.findById(userID, {notifs:0}).lean()
            })
        } catch (err) {
            throw err
        }
    },
    createUser: async data =>{//for signup 
        if(!(/^[0-9a-zA-Z_]{3,}$/g.test(data.name)))
            return "The name should be 3 or more of numbers, upper or lower characters, or underscore only"
        
        if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(data.email)) return "Invalid Email"

        if(!/.*[a-z]/g.test(data.password)) return "Password should contan at least one lowercase";
        if(!/.*\d/g.test(data.password)) return "Password should contan at least one number";
        if(!/.*[A-Z]/g.test(data.password)) return "Password should contan at least one uppercase";
        if(!/.{8,}/g.test(data.password)) return "Password should be at least 8 or more characters";
        
        if(!data.licenceAccept) return "You must accept the licence"
        delete data.licenceAccept

        try {
            await bcrypt.hash(data.password, 10).then( val=>{
                data.password = val;
            })
            return await dbConnect(async ()=>{
                return await usersModel.findOne({ name: data.name }).then(async exist=>{
                    if(exist) return "the name is already used"
                    return await usersModel.findOne({ email: data.email }).then(async exist=>{
                        if(exist) return "the email is already used"
                        else {
                            const {_id: id} = await new usersModel(data).save()
                            return {id: id.toString()}
                        }
                    })
                })
            })
        } catch (err) {
            throw err
        }
    },
    authUser: async data =>{//for login 
        let user; 
        try {
            return dbConnect(async ()=>{
                if(data.nameOrEmail.includes("@"))
                    user = await usersModel.findOne({email: data.nameOrEmail}, {notifs:0}).lean()
                else
                    user = await usersModel.findOne({name: data.nameOrEmail}, {notifs:0}).lean()
                if(!user) return "invalid name/email or password"
                else {
                    return await bcrypt.compare(data.password, user.password)// check the password
                    .then(async valid =>{
                        if(!valid) return "invalid name/email or password"
                        if(user.passwordResetCode)// if the user made request to reset password, then remember it
                            await usersModel.findByIdAndUpdate(user._id, {$set:{passwordResetCode: null}})
                        delete user.password;
                        delete user.passwordResetCode;
                        if(user.verification?.code){// check if the email is verified
                            // if it is not verified
                            if(user.verification.expire <= Date.now()){//if not verified, generate new verif code if it expired and redirect the user to verif page
                                const code = crypto.randomBytes(3).toString('hex');
                                user = await usersModel.findByIdAndUpdate(
                                    user._id, 
                                    {verification:{
                                        code: code,
                                        expire: Date.now() + 15 * 60 * 1000 // make expiration 15 minute
                                    }}, 
                                    {new: true}
                                ).lean()
                                return {id: user._id, email: user.email, verif:user.verification, resend:true}
                            }
                            return {id: user._id, verif:user.verification}
                        }else{// if it is verified
                            delete user.verification
                            if(user.ban.current?.ending < Date.now()){// remove the ban if it ended
                                await usersModel.findByIdAndUpdate(user._id, {$set:{
                                    "ban.current": null
                                }})
                                user.ban.current = null
                            }
                            return user;
                        }
                    })
                }
            })
        } catch (err) {
            throw err
        }
    },
    createResetCode: async email=>{
        try {
            return await dbConnect(async ()=>{
                const resetCode = crypto.randomBytes(6).toString('hex');
                return await usersModel.findOneAndUpdate(
                    {email}, 
                    {$set:{passwordResetCode: resetCode}}, 
                    {select: {_id:1}}
                ).then( account=>{
                    if(!account)
                        return "There is no account match this email"
                    return {
                        id: account._id,
                        resetCode: resetCode
                    }
                })
            })
        } catch (err) {
            throw err
        }
    },
    resetAccountPass: async data=>{
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findOne({_id: data.id, passwordResetCode: data.resetCode}, {select: {_id: 1}}).then(async account=>{
                    if(!account)
                        return false
                    
                    return await bcrypt.hash(data.password, 10).then(async val=>{
                        return await usersModel.updateOne({_id: data.id}, {
                            $set:{
                                password: val,
                                passwordResetCode: null
                            }
                        })
                    })
                })
            })
        } catch (err) {
            throw err
        }
    },
    verify: async (id, code)=>{//verify the verif code
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findOne({_id: id, verification: { $exists: true }}, {verification: 1}).then(async user=>{
                    if(!user) return false
                    const {verification: verif} = user
                    if(verif.expire <= Date.now()) return {expired:true};
                    if(verif.code == code){
                        const user = await usersModel.findByIdAndUpdate(id, {$unset: {verification: 1}}, {new: true}).lean()
                        delete user.password
                        delete user.passwordResetCode
                        delete user.notifs
                        return user
                    }else return {notTheCode:true, expire:verif.expire};
                })
            })
        } catch (err) {
            throw err
        }
    },
    updateVerif: async id=>{// generate new verif code
        const code = crypto.randomBytes(3).toString('hex');
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findOneAndUpdate(
                    {_id: id, verification: { $exists: true }}, 
                    {verification:{
                        code: code,
                        expire: Date.now() + 15 * 60 * 1000 // make expiration 15 minute
                    }}, 
                    {new : true}
                ).then( user=>{
                    return user? {email:user.email, verif:user.verification} : false
                })
            })
        } catch (err) {
            throw err
        }
    },
    isVerified: async id=>{// check if the account email verified
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findOne(
                    {_id: id, verification: { $exists: true }}, 
                    {email: 1,verification: 1}
                ).then( user=>{
                    return user? {email:user.email, verif:user.verification} : "verified"
                })
            })
        } catch (err) {
            throw err
        }
    },
    updateProfile: async data=>{
        try {
            return dbConnect(async()=>{
                let changedImg;
                let error = false;
                if(data.imageName){
                    await usersModel.updateOne({_id:data.userID}, {$set:{img:data.imageName}}).then(()=>{
                        changedImg = data.imageName
                    })
                }
                if(data.oldPass){
                    await usersModel.findById(data.userID,{password:true}).then(async obj=>{
                        await bcrypt.compare(data.oldPass, obj.password).then(async matched=>{
                            if(matched){
                                await bcrypt.hash(data.newPass, 10).then(async password=>{
                                    await usersModel.updateOne({_id:data.userID}, {$set:{password}})
                                })
                            }else {
                                error = 'the password is wrong';
                            }
                        })
                    })
                }
                if(error) return {err: error};
                if(changedImg) return changedImg
            })
        } catch (err) {
            throw err
        }
    },
    deleteUser: async id=>{
        try {
            return await usersModel.findByIdAndDelete(id, {img:1}).lean()
        } catch (err) {
            throw err
        }
    },
    incTotleReviews: async userID=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.updateOne({_id: userID}, {$inc:{
                    totalReviews: 1
                }})
            })
        } catch (err) {
            throw err
        }
    },
    incAuthorContentNum: async userID=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.updateOne({_id: userID}, {$inc:{
                    contentsNum: 1
                }})
            })
        } catch (err) {
            throw err
        }
    },
    decAuthorContentNum: async userID=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.updateOne({_id: userID}, {$inc:{
                    contentsNum: -1
                }})
            })
        } catch (err) {
            throw err
        }
    },
    
    /* start the function for profile page */
    getAuthorData:async userID =>{
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findById(userID,{name:1, img:1, authz:1})
            })
        } catch (err) {
            throw err
        }
    },
    /* end the function for profile page */
    
    /* start the function for accountsControl page */
    getFrist10Accounts: async ()=>{
        try {
            return await dbConnect(async ()=>
                await usersModel.find({},
                    {password: 0, notifs: 0, notifsNotReaded: 0}, 
                    {sort:{name:1}, limit:10}
                ).then(accounts=>{
                    const groupedAccs = {users:[], authors:[], editors:[], admins:[]};
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
                    return groupedAccs
                })
            )
        } catch (err) {
            throw err
        }
    },
    getAccountsByRole: async data=>{
        try {
            return await dbConnect(async ()=>{
                if(data.accountType == 'users')
                    return await usersModel.find(
                        {$nor:[{"authz.isAdmin": true}, {"authz.isEditor": true}, {"authz.isAuthor": true}]}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
                else if(data.accountType == 'authors')
                    return await usersModel.find(
                        {"authz.isAuthor": true}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
                else if(data.accountType == 'editors')
                    return await usersModel.find(
                        {"authz.isEditor": true}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
                else
                    return await usersModel.find(
                        {"authz.isAdmin": true}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
            })
        } catch (err) {
            throw err
        }
    },
    getAccountsByName: async accountName=>{
        try {
            return await dbConnect(async ()=>{
                return await usersModel.find({name: { "$regex": accountName.split("").join(".*")+".*", "$options": "i" }}, null, {limit:100})
            })
        } catch (err) {
            throw err
        }
    },
    changeUserAuthz: async data=>{
        try {
            return await dbConnect(async ()=>{
                const objectToSet = data.authz == "author"? 
                {"authz.isAuthor": true, "authz.isEditor": false, "authz.isAdmin": false}:
                data.authz == "editor"?
                {"authz.isAuthor": false, "authz.isEditor": true, "authz.isAdmin": false}:
                data.authz == "admin"?
                {"authz.isAuthor": false, "authz.isEditor": false, "authz.isAdmin": true}:
                {"authz.isAuthor": false, "authz.isEditor": false, "authz.isAdmin": false};

                await usersModel.findByIdAndUpdate(data.userID, {
                    $set: objectToSet,
                    $push:{
                        notifs:{ 
                            $each: [data.notif],
                            $position: 0
                        },
                    },$inc:{
                        notifsNotReaded: 1
                    }
                })
            })
        } catch (err) {
            throw err
        }
    },
    warningUser: async data=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(data.userID, {$push:{
                    "warning.current": data.reason,
                    "warning.all": data.reason
                }})
            })
        } catch (err) {
            throw err
        }
    },
    removeWarning: async data=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(data.userID, {$pull:{
                    "warning.current": data.warning
                }})
            })
        } catch (err) {
            throw err
        }
    },
    banUser: async data=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(data.userID, {$set:{
                    "ban.current": {reason: data.reason, ending: Date.now()+Math.floor(data.duration)*24*60*60*1000}
                },$push:{
                    "ban.all": data.reason
                }})
            })
        } catch (err) {
            throw err
        }
    },
    unbanUser: async data=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(data.userID, {$set:{
                    "ban.current": {reason: null, ending: null}
                }})
            })
        } catch (err) {
            throw err
        }
    },
    /* end the function for accountsControl page */

    /* start the functions for notifications */
    getReviewersNotifs: async ()=>{// notify the admins and the editors that there is new content to review when author submit content
        try {
            return await dbConnect(async ()=>{
                return await usersModel.find({$or:[{"authz.isAdmin":true}, {"authz.isEditor":true}]}, {email:1, notifs:1})
            })
        } catch (err) {
            throw err
        }
    },
    addNotif: async data=>{// add a notification to specific user
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findByIdAndUpdate(data.userID, {$push:{
                    notifs:{ 
                        $each: [data.notif],
                        $position: 0
                    },
                    },$inc:{
                        notifsNotReaded: 1
                    }
                },
                {select:{email:1}})
            })
        } catch (err) {
            throw err
        }
    },
    updateNotif:async data=>{// add a notification to specific user
        try {
            await dbConnect(async ()=>{
                await usersModel.findOneAndUpdate({_id: data.userID, notifs:{msg: data.notifMsg, isReaded: false}}, {$inc:{
                        'notifs.$.num':1,
                        notifsNotReaded: 1
                    }
                })
            })
        } catch (err) {
            throw err
        }
    },
    clearUserNotif: async id=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(id, {$set:{
                    notifs: []
                }})
            })
        } catch (err) {
            throw err
        }
    },
    markNotifReaded: async id=>{// work when user open the notification
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findByIdAndUpdate(id, {$set:{
                    notifsNotReaded: 0,
                    "notifs.$[].isReaded": true
                }}, {notifs:1}).lean()
            })
        } catch (err) {
            throw err
        }
    }
    /* end the functions for notifications */
}