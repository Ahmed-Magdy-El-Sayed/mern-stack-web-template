const mongoose = require('mongoose');
const dbConnect = require('./dbConnect')
const bcrypt = require("bcrypt")
const crypto = require("crypto")

const uSchema = new mongoose.Schema({
    firstName:  {type: String, trim: true},
    lastName:  {type: String, trim: true},
    username: {type: String, trim: true},
    email: String,
    img:{type: String, default: "default.png"},
    registrationDate: {type: Number, default: Date.now()},
    birthdate: String,
    address: String,
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
    },
    favoriteList: {type: Array, default:[]},
    emailNotif: {type: Boolean, default: true},
    oauth: Boolean
})

const usersModel = new mongoose.model('user',uSchema)

module.exports ={
    userNameExist: username =>{
        try {
            return dbConnect(async ()=>{
                return await usersModel.findOne({username}, {_id:1}).then(user=>user?true:false);
            })
        } catch (err) {
            throw err
        }
    },
    getUser: userID =>{
        try {
            return dbConnect(async ()=>{
                return await usersModel.findById(userID, {notifs:0, favoriteList:0}).lean()
            })
        } catch (err) {
            throw err
        }
    },
    getUsersImgs:async comments =>{
        let commentsOwnersImages={};
        comments.forEach(comment=>{// to prevent the repetition
            if(comment.userID)
                commentsOwnersImages[comment.userID]=null;
        })
        try {
            return await dbConnect(async ()=>{
                return await usersModel.find({_id: {$in: Object.keys(commentsOwnersImages) }},{img:1}).lean().then(users=>{
                    users.forEach(user=>{
                        commentsOwnersImages[user._id] = user.img
                    })
                    return commentsOwnersImages
                })
            })
        } catch (err) {
            throw err
        }
    },
    createUser: async data =>{//for signup 
        if(!(/^[A-Za-z][a-zA-Z_]{1,}$/g.test(data.firstName)))
            return {err: "The first name should be 3 or more of alphabet characters only"}
        if(!(/^[A-Za-z][a-zA-Z_]{1,}$/g.test(data.lastName)))
            return {err: "The last name should be 3 or more of numbers, alphabet characters only"}
        
        if(!(/^[A-Za-z][0-9a-zA-Z_]{2,}$/g.test(data.username)))
            return {err: "The username should be 3 or more of numbers, upper or lower characters, or underscore only"}
        
        if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(data.email)) return {err: "Invalid Email"}

        if(!/.*[a-z]/g.test(data.password)) return {err: "Password should contan at least one lowercase"};
        if(!/.*\d/g.test(data.password)) return {err: "Password should contan at least one number"};
        if(!/.*[A-Z]/g.test(data.password)) return {err: "Password should contan at least one uppercase"};
        if(!/.{8,}/g.test(data.password)) return {err: "Password should be at least 8 or more characters"};
        
        if(!data.licenceAccept) return {err: "You must accept the licence"}
        delete data.licenceAccept

        try {
            await bcrypt.hash(data.password, 10).then( val=>{
                data.password = val;
            })
            return await dbConnect(async ()=>{
                return await usersModel.findOne({ username: data.username }).then(async exist=>{
                    if(exist) return {err: "the username is already used"}
                    return await usersModel.findOne({ email: data.email }).then(async exist=>{
                        if(exist) return {err: "the email is already used"}
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
    saveOauthUser: async user =>{//for signup 
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findOne({ email: user.email }, {notifs: 0, password: 0, favoriteList:0}).lean().then(async existUser=>{ 
                    if(existUser)
                        return {isNew: false, data: existUser}
                    
                    return {isNew: true, data: await new usersModel(user).save()}
                })
            })
        } catch (err) {
            throw err
        }
    },
    setUsername: async (userID, username) =>{//for signup 
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(userID, { $set:{username} })
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
                    user = await usersModel.findOne({email: data.nameOrEmail, oauth: {$not: {$eq: true}} }, {notifs:0, favoriteList:0}).lean()
                else
                    user = await usersModel.findOne({username: data.nameOrEmail, oauth: {$not: {$eq: true}}}, {notifs:0, favoriteList:0}).lean()
                if(!user) return {err: "invalid username/email or password"}
                else {
                    return await bcrypt.compare(data.password, user.password)// check the password
                    .then(async valid =>{
                        if(!valid) return {err: "invalid username/email or password"}
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
                const resetCode = crypto.randomBytes(12).toString('hex');
                return await usersModel.findOneAndUpdate(
                    {email}, 
                    {$set:{passwordResetCode: resetCode}}, 
                    {select: {_id:1}}
                ).lean().then( account=>{
                    if(!account)
                        return {err: "There is no account match this email"}
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
        if(!/.*[a-z]/g.test(data.password)) return {err: "Password should contan at least one lowercase"};
        if(!/.*\d/g.test(data.password)) return {err: "Password should contan at least one number"};
        if(!/.*[A-Z]/g.test(data.password)) return {err: "Password should contan at least one uppercase"};
        if(!/.{8,}/g.test(data.password)) return {err: "Password should be at least 8 or more characters"};
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
                ).lean().then( user=>{
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
                ).lean().then( user=>{
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
                let error = false;
                let setObj = {};
                if(data.imageName || data.birthdate || data.address){
                    if(data.imageName) setObj.img = data.imageName 
                    if(data.firstName) setObj.firstName = data.firstName 
                    if(data.lastName) setObj.lastName = data.lastName 
                    if(data.birthdate) setObj.birthdate = data.birthdate 
                    if(data.address) setObj.address = data.address 
                    await usersModel.updateOne({_id:data.userID}, {$set:setObj}).catch(err=>{
                        console.log(err)
                        error= "Something Went Wrong, Try Again!"
                    })
                }

                if(data.oldPass){
                    await usersModel.findById(data.userID,{password:1}).lean().then(async obj=>{
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
                if(Object.keys(setObj).length) return setObj
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
    getProfileData:async (userID, reqIsAdmin) =>{
        try {
            return await dbConnect(async ()=>{
                return reqIsAdmin? 
                    await usersModel.findById(userID,{password:0, notifs:0, favoriteList:0}).lean()
                :    await usersModel.findById(userID,{username:1, img:1, authz:1}).lean()
            })
        } catch (err) {
            throw err
        }
    },
    toggleEmailNotif: async (userID, val) =>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(userID,{$set:{emailNotif: val}})
            })
        } catch (err) {
            throw err
        }
    },
    /* end the function for profile page */
    
    /* start the function for accountsControl page */
    getfirst50Accounts: async ()=>{
        try {
            return await dbConnect(async ()=>
                await usersModel.find({"username": {$nin: ["Admin0", "User0"]}},
                    {password: 0, notifs: 0, notifsNotReaded: 0, favoriteList:0}, 
                    {sort:{username:1}, limit:10}
                ).lean().then(accounts=>
                    accounts.map(acc=>{
                        acc.role= acc.authz.isAdmin? "admin" : acc.authz.isEditor? "editor" : acc.authz.isAuthor? "author" : "user"
                        delete acc.authz
                        return acc
                    })
                )
            )
        } catch (err) {
            throw err
        }
    },
    getNextAccounts: async data=>{
        const query = data.accountType === 'user'?
            {$nor:[{"authz.isAdmin": true}, {"authz.isEditor": true}, {"authz.isAuthor": true}]}
        :data.accountType === 'author'?
            {"authz.isAuthor": true}
        :data.accountType === 'editor'?
            {"authz.isEditor": true}
        :data.accountType === 'admin'?
            {"authz.isAdmin": true}
        :{};
        query.username= {$nin: ["Admin0", "User0"]}
        
        if(data.searchVal)
            query[data.searchBy] = { "$regex": `.*${data.searchVal}.*`, "$options": "i" }
        
        try {
            return await dbConnect(async ()=>{
                return await usersModel.find(
                    query, 
                    {password: 0, notifs: 0, notifsNotReaded: 0, favoriteList:0}, 
                    {sort:{username:1}, skip:data.skip, limit:10}
                ).lean().then(accounts=>
                    accounts.map(acc=>{
                        acc.role= acc.authz.isAdmin? "admin" : acc.authz.isEditor? "editor" : acc.authz.isAuthor? "author" : "user"
                        delete acc.authz
                        return acc
                    })
                )
            })
        } catch (err) {
            throw err
        }
    },
    searchAccounts: async search=>{
        const query = search.accountType == 'user'?
            {$nor:[{"authz.isAdmin": true}, {"authz.isEditor": true}, {"authz.isAuthor": true}]}
        :search.accountType == 'author'?
            {"authz.isAuthor": true}
        :search.accountType == 'editor'?
            {"authz.isEditor": true}
        :search.accountType == 'admin'?
            {"authz.isAdmin": true}
        :{};

        query[search.by]= { "$regex": `.*${search.val}.*`, "$options": "i" };

        if(search.by == "username")
            query.username.$nin= ["Admin0", "User0"]
        else
            query.username= {$nin: ["Admin0", "User0"]}

        try {
            return await dbConnect(async ()=>{
                
                return await usersModel.find(query, 
                    {password: 0, notifs: 0, notifsNotReaded: 0, favoriteList:0},
                    {sort:{username:1}, limit:10}
                ).lean().then(accounts=>
                    accounts.map(acc=>{
                        acc.role= acc.authz.isAdmin? "admin" : acc.authz.isEditor? "editor" : acc.authz.isAuthor? "author" : "user"
                        delete acc.authz
                        return acc
                    })
                );
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
    getFavoriteList: async userID=>{
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findById(userID, {favoriteList:1}).lean().then(user=>user.favoriteList)
            })
        } catch (err) {
            throw err
        }
    },
    toggleFavoriteContent: async(userID, contentID)=>{
        try {
            return await dbConnect(async ()=>{
                const list = await usersModel.findById(userID, {favoriteList:1}).lean().then(user=>user.favoriteList); 
                list.includes(contentID)?
                    await usersModel.findByIdAndUpdate(userID, {$pull: {favoriteList: contentID}})
                :   await usersModel.findByIdAndUpdate(userID, {$push: {favoriteList: contentID}})
            })
        } catch (err) {
            throw err
        }
    },

    /* start the functions for notifications */
    getReviewersNotifs: async ()=>{// notify the admins and the editors that there is new content to review when author submit content
        try {
            return await dbConnect(async ()=>{
                return await usersModel.find({$or:[{"authz.isAdmin":true}, {"authz.isEditor":true}]}, {email:1, notifs:1, emailNotif:1}).lean()
            })
        } catch (err) {
            throw err
        }
    },
    addNotif: async data=>{// add a notification to specific user
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findByIdAndUpdate(data.userID, 
                    {$push:{
                        notifs:{ 
                            $each: [data.notif],
                            $position: 0
                        },
                        },$inc:{
                            notifsNotReaded: 1
                        }
                    },
                    {select:{email:1, emailNotif:1}
                }).lean()
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