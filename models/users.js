const mongoose = require('mongoose');
const dbConnect = require('./dbConnect')
const bcrypt = require("bcrypt")

const uSchema = new mongoose.Schema({
    name: String,
    email: String,
    img:{type: String, default: "/user.jpg"},
    password: String,
    verification: {
        code: String,
        expire: String
    },
    notifs:[{msg: String, href: String, num:{type: Number, default:1}, isReaded: Boolean}],
    notifsNotReaded:{type: Number, default: 0},
    isAdmin:{type: Boolean, default: false},
    isEditor:{type: Boolean, default: false},
    isAuthor:{type: Boolean, default: false},
    ban: {reason: String, ending: String},
    bansNum:{type: Number, default: 0},
    warning: [String],
    warningsNum:{type: Number, default: 0},
    deleteByAdmin: Boolean
})

const usersModel = new mongoose.model('user',uSchema)

module.exports ={
    createUser: async data =>{//for signup 
        data.name = data.name.replaceAll(" ","")
        await bcrypt.hash(data.password, 10).then( val=>{
            data.password = val;
            hashed = true;
        }).catch(err=>{
            console.error('hashing error : ', err);
            hashed= false;
        })
        if(hashed){
            try {
                return await dbConnect(async ()=>{
                    return await usersModel.findOne({ name: data.name }).then(async exist=>{
                        if(exist) return "the name already used"
                        await usersModel.findOne({ email: data.email }).then(async exist=>{
                            if(exist) return "the email already used"
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
        }else return false
    },
    authUser: async data =>{//for login 
        let user; 
        try {
            return dbConnect(async ()=>{
                user = await usersModel.findOne({ name: data.name })
                if(!user) return "there is no account match this name"
                else {
                    return await bcrypt.compare(data.password, user.password)// check the password
                    .then(async valid =>{
                        if(!valid) return "email and password are not matched"
                        delete user.password;
                        if(user.verification?.code){// check if the email is verified
                            // if it is not verified
                            if(user.verification.expire <= new Date().getTime()){//if not verified, generate new verif code if it expired and redirect the user to verif page
                                const code = crypto.randomBytes(3).toString('hex');
                                user = await usersModel.findByIdAndUpdate(
                                    user._id, 
                                    {verification:{
                                        code: code,
                                        expire: new Date().getTime() + 15 * 60 * 1000 // make expiration 15 minute
                                    }}, 
                                    {new: true}
                                )
                                return {id: user._id, verif:user.verification, resend:true}
                            }
                            return {id: user._id, verif:user.verification}
                        }else{// if it is verified
                            delete user.verification
                            if(user.deleteByAdmin){// when admin delete an account, it not deleted until the user try to login, so can show him error msg that his account is deleted by admin
                               return await usersModel.findByIdAndDelete(user._id).then( deleted=>{
                                    if(!deleted) user.error  = true
                                    return user
                                })
                            }
                            else if(user.warning.length)//remove the warning from database as it will be shown now
                                await usersModel.findByIdAndUpdate(user._id, {$set:{
                                    warning: []
                                }})
                            else if(user.ban.ending < new Date().getTime()){// remove the ban if it ended
                                console.log(await usersModel.findByIdAndUpdate(user._id, {$set:{
                                    ban: null
                                }}))
                                user.ban = null
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
    verify: async (id, code)=>{//verify the verif code
        try {
            return await dbConnect(async ()=>{
                return await usersModel.findOne({_id: id, verification: { $exists: true }}, {verification: 1}).then(async user=>{
                    if(!user) return false
                    const {verification: verif} = user
                    if(verif.expire <= new Date().getTime()) return {expired:true};
                    if(verif.code == code){
                        const user = await usersModel.findByIdAndUpdate(id, {$unset: {verification: 1}}, {new: true})
                        return {id: user._id, name: user.name, email: user.email, image: user.image}
                    }else return {notTheCode:true, expire:verif.expire};
                })
            })
        } catch (err) {
            console.log(err);
            return false
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
                        expire: new Date().getTime() + 15 * 60 * 1000 // make expiration 15 minute
                    }}, 
                    {new : true}
                ).then( user=>{
                    return user? {email:user.email, verif:user.verification} : false
                })
            })
        } catch (err) {
            console.log(err);
            return false
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
            console.log(err);
            return false
        }
    },
    updateProfile: async data=>{// change user data from the main bar
        try {
            return dbConnect(async()=>{
                let changedImg;
                let error = false;
                if(data.filename){
                    await usersModel.updateOne({_id:data.userID}, {$set:{img:data.filename}}).then(()=>{
                        changedImg = data.filename
                    })
                }
                if(data.oldPass){
                    await usersModel.findById(data.userID,{password:true}).then(async obj=>{
                        await bcrypt.compare(data.oldPass, obj.password).then(async matched=>{
                            if(matched){
                                let newPass = data.newPass1;
                                await bcrypt.hash(newPass, 10).then(async password=>{
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
            throw null
        }
    },
    deleteUser: async id=>{// delete the user account when he click on delete account button in update profile in the main bar
        try {
            return await usersModel.findByIdAndDelete(id).then( deleted=>{
                return deleted? true : -1
            })
        } catch (err) {
            console.log(err);
            return false
        }
    },
    deleteUserByAdmin: async id=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(id, {$set:{
                    deleteByAdmin: true
                }})
            })
        } catch (err) {
            throw err
        }
    },
    
    /* start the function for accountsControl page */
    getFrist10Accounts: async ()=>{//when admin open the page
        try {
            return await dbConnect(async ()=>{
                const users = await usersModel.find(
                    {$nor:[{isAdmin: true}, {isEditor: true}, {isAuthor: true}]}, 
                    {password: 0, notifs: 0, notifsNotReaded: 0}, 
                    {sort:{name:1}, limit:10}
                )
                const authors = await usersModel.find(
                    {isAuthor: true}, 
                    {password: 0, notifs: 0, notifsNotReaded: 0}, 
                    {sort:{name:1}, limit:10}
                )
                const editors = await usersModel.find(
                    {isEditor: true}, 
                    {password: 0, notifs: 0, notifsNotReaded: 0}, 
                    {sort:{name:1}, limit:10}
                )
                const admins = await usersModel.find(
                    {isAdmin: true}, 
                    {password: 0, notifs: 0, notifsNotReaded: 0}, 
                    {sort:{name:1}, limit:10}
                )
                return {users, authors, editors, admins}
            })
        } catch (err) {
            throw err
        }
    },
    getAccountsByRole: async data=>{// when admin click show more
        try {
            return await dbConnect(async ()=>{
                if(data.accountType == 'users')
                    return await usersModel.find(
                        {$nor:[{isAdmin: true}, {isEditor: true}, {isAuthor: true}]}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
                else if(data.accountType == 'authors')
                    return await usersModel.find(
                        {isAuthor: true}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
                else if(data.accountType == 'editors')
                    return await usersModel.find(
                        {isEditor: true}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
                else
                    return await usersModel.find(
                        {isAdmin: true}, 
                        {password: 0, notifs: 0, notifsNotReaded: 0}, 
                        {sort:{name:1}, skip:data.skip, limit: 10}
                    )
            })
        } catch (err) {
            throw err
        }
    },
    getAccountsByName: async accountName=>{// when admin search for specific user
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
                {isAuthor: true, isEditor: false, isAdmin: false}:
                data.authz == "editor"?
                {isAuthor: false, isEditor: true, isAdmin: false}:
                data.authz == "admin"?
                {isAuthor: false, isEditor: false, isAdmin: true}:
                {isAuthor: false, isEditor: false, isAdmin: false};

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
                if(data.reason?.trim())
                    await usersModel.findByIdAndUpdate(data.userID, {$push:{
                        warning: data.reason
                    },$inc:{
                        warningsNum: 1
                    }})
                else if(!data.reason){
                    await usersModel.findByIdAndUpdate(data.userID, {$inc:{
                        warningsNum: 1
                    }})
                }
            })
        } catch (err) {
            throw err
        }
    },
    banUser: async data=>{
        try {
            return await dbConnect(async ()=>{
                await usersModel.findByIdAndUpdate(data.userID, {$set:{
                    ban: {reason: data.reason, ending: new Date().getTime()+Math.floor(data.ending)*24*60*60*1000}
                },$inc:{
                    bansNum: 1
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
                    ban: {reason: null, ending: null}
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
                return await usersModel.find({$or:[{isAdmin:true}, {isEditor:true}]}, {email:1, notifs:1})
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
    clearUserNotif: async id=>{// if user click on clear notification option in the buttom of notification section
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
                await usersModel.findByIdAndUpdate(id, {$set:{
                    notifsNotReaded: 0,
                    "notifs.$[].isReaded": true
                }})
            })
        } catch (err) {
            throw err
        }
    }
    /* end the functions for notifications */
}