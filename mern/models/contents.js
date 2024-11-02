const mongoose = require('mongoose');
const dbConnect = require('./dbConnect')

const { addNotif } = require("./users")

const contentSchema = new mongoose.Schema({
    name: {type: String, trim: true},
    img: {type: String, default: "default.png"},
    timestamp: Date,
    views: {type:Number, default: 0},
    hidden: {type:Boolean, default: false},
    commentsNum: {type:Number, default: 0},
    author: {id:String, username: String, img: String},
    isUnderReview:{type:Boolean, default:false},
    reviewer: String,
    comments:{type: Array, default: []}
})

const contentModel = new mongoose.model('content',contentSchema);

module.exports = {
    getLastAddedContents : async user=>{// get the content that reviewed only
        try{
            return dbConnect(async()=>{
                const query = user?.authz.isAdmin || user?.authz.isEditor?
                    {isUnderReview: {$not:{$eq:true}}}
                : user?.authz.isAuthor?
                    {isUnderReview: {$not:{$eq:true}}, 
                        $or:[
                            {hidden: {$not:{$eq:true}}},
                            {hidden: true, "author.id": String(user._id)}
                        ]
                    }
                :   {isUnderReview: {$not:{$eq:true}}, hidden: {$not:{$eq:true}}}
                
                return await contentModel.find(
                    query, 
                    {img:1, name:1, timestamp:1, author:1, hidden:1}, 
                    {sort:{timestamp: -1}, limit: 10}
                ).lean()
            })
        }catch(err){
            throw err
        }
    },
    getMoreLastContents : async (user, skip)=>{// get the content that reviewed only
        try{
            return dbConnect(async()=>{
                const query = (user?.authz.isAdmin || user?.authz.isEditor)?
                    {isUnderReview: {$not:{$eq:true}}}
                : (user?.authz.isAuthor)?
                    {isUnderReview: {$not:{$eq:true}}, 
                        $or:[
                            {hidden: {$not:{$eq:true}}},
                            {hidden: true, "author.id": String(user._id)}
                        ]
                    }
                :   {isUnderReview: {$not:{$eq:true}}, hidden: {$not:{$eq:true}}}

                return await contentModel.find(query, {img:1, name:1, timestamp:1, author:1, hidden:1}, {sort:{timestamp: -1}, skip, limit: 10}).lean()
            })
        }catch(err){
            throw err
        }
    },
    getContentById: async data=>{
        try{
            return dbConnect(async ()=>{
                if(data.normalUser){
                    return data.increaseViews?
                        await contentModel.findByIdAndUpdate(data.id, {$inc:{views: 1}}, {select:{comments:{replies:0}}}).lean().then(content=>{
                            if(content?.comments.length > 10)
                                content.comments = content.comments.slice(0, 10)
                            return content
                        }):
                        await contentModel.findByIdAndUpdate(data.id, null, {select:{comments:{replies:0}}}).lean().then(content=>{
                            if(content?.comments.length > 10)
                                content.comments = content.comments.slice(0, 10)
                            return content
                        })
                }else
                    return await contentModel.findById(data.id,{comments:{replies:0}}).lean().then(content=>{
                        if(content?.comments.length > 10)
                            content.comments = content.comments.slice(0, 10)
                        return content
                    })
            })
        }catch(err){
            throw err
        }
    },
    getContentsByIDs: async contentsIDs=>{
        try{
            return dbConnect(async ()=>{
                return await contentModel.find({_id:{$in: contentsIDs}}, {img:1, name:1, timestamp:1, author:1, hidden:1}).lean()
            })
        }catch(err){
            throw err
        }
    },

    /* start the functions for profile page */
    getContentByAuthorId: async id=>{
        try{
            return dbConnect(async ()=>{
                return await contentModel.find({"author.id":id}, {img:1, name:1, timestamp:1, author:1, hidden:1, isUnderReview:1}).lean()
            })
        }catch(err){
            throw err
        }
    },
    pushContent: async data=>{
        let isUnderReview;
        if(data.author.role == "author")
            isUnderReview = true 
        try{
            return dbConnect(async()=>{
                return await new contentModel({...data, timestamp: Date.now(), author: data.author, isUnderReview}).save()
            })
        }catch(err){
            throw err
        }
    },
    markUnvisiable: async data=>{
        try{
            return dbConnect(async()=>{
                await contentModel.updateOne({_id: data.contentID, "author.id": data.userID}, {hidden: true})
            })
        }catch(err){
            throw err
        }
    },
    markVisiable: async data=>{
        try{
            return dbConnect(async()=>{
                await contentModel.updateOne({_id: data.contentID, "author.id": data.userID}, {hidden: false})
            })
        }catch(err){
            throw err
        }
    },
    updateContent: async data=>{
        try{
            return dbConnect(async()=>{
                return {
                    oldImg: await contentModel.findOneAndUpdate({_id: data.contentID, "author.id": data.userID}, {...data.newContent}, {img: 1}).lean().then(content=>content.img),
                    newContent: await contentModel.findById(data.contentID).lean()
                } 
            })
        }catch(err){
            throw err
        }
    },
    updateContentAuthorImg: async (authorId, authorImg)=>{
        try{
            dbConnect(async()=>{
                await contentModel.updateMany({"author.id": authorId}, {"author.img": authorImg})
            })
        }catch(err){
            throw err
        }
    },
    removeContent: async (data, user)=>{
        try{
            return dbConnect(async()=>{
                if(user.authz.isAdmin || user.authz.isEditor)// if the request sender is admin or editor, then delete the account directly
                    return await contentModel.findByIdAndDelete({_id: data.contentID}, {author:1, img:1}).lean()
                // if not the apply the request if the sender is the content owner
                return await contentModel.findByIdAndDelete({_id: data.contentID, "author.id": user._id}, {author:1, img:1}).lean()
            })
        }catch(err){
            throw err
        }
    },
    /* end the functions for profile page */

    /* start the functions for contentControl page */
    getUnderReviewContents: async userID=>{
        try{
            return dbConnect(async()=>{
                const underReview = await contentModel.find({isUnderReview: true}).lean();
                return {
                    selectFrom: underReview.filter(content=>!content.reviewer),
                    selected: underReview.filter(content=>content.reviewer==userID)
                }
            })
        }catch(err){
            throw err
        }
    },
    selectToReview: async data=>{
        try{
            return dbConnect(async ()=>{
                await contentModel.findByIdAndUpdate(data.contentID, {$set:{
                    reviewer: data.userID, 
                }})
            })
        }catch(err){
            throw err
        }
    },
    unselectToReview: async data =>{
        try{
            return dbConnect(async ()=>{
                await contentModel.findByIdAndUpdate(data.contentID, {$set:{
                    reviewer: "", 
                }})
            })
        }catch(err){
            throw err
        }
    },
    getContentsByName: async contentName=>{
        try {
            return await dbConnect(async ()=>{
                return await contentModel.find(
                    {name: { "$regex": ".*"+contentName+".*", "$options": "i" }, isUnderReview: {$not:{$eq:true}}}, 
                    {img:1, name:1, timestamp:1, author:1}, 
                    {limit:20}
                ).lean()
            })
        } catch (err) {
            throw err
        }
    },
    setContentApproved: async data=>{
        try{
            return dbConnect(async ()=>{
                const content = await contentModel.findByIdAndUpdate(data.contentID, {$set:{
                    isUnderReview: false,
                    timestamp: Date.now()
                }},{select:{name:1, author:1, emailNotif:1}}).lean()
                if(!content) return false
                const notif = {msg: `Your content ${content.name} was approved and added to the website content`, href:"/content/id/"+String(content._id)}
                const email = await addNotif({userID: data.authorID, notif})// to notify the author
                return{email, notif, authorID: content.author.id}
            })
        }catch(err){
            throw err
        }
    },
    setContentRejected: async data=>{
        try{
            return dbConnect(async ()=>{
                const content = await contentModel.findByIdAndDelete(data.contentID, {select:{name:1, img:1, author:1}}).lean()
                if(!content) return false
                const notif = {msg: `Your content ${content.name} was rejected for: "${data.reason}"`, href:"/account/profile/"+content.author.id}
                const {email, emailNotif} =  await addNotif({userID: data.authorID, notif})// to notify the author
                return {img:content.img, email, emailNotif, notif}
            })
        }catch(err){
            throw err
        }
    },
    /* end the functions for contentControl page */

    /* start the functions for comments and replies in content page */
    addComment: async data=>{
        try {
            return dbConnect(async()=>{
                const comment = {
                    _id: new mongoose.Types.ObjectId(),
                    username:data.username,
                    userID:data.userID,
                    userIsAuthz: data.userIsAuthz,
                    timestamp: Date.now(),
                    body: data.body,
                    likes:[],
                    dislikes:[],
                    repliesNum:0,
                    replies: []
                }
                await contentModel.findByIdAndUpdate(data.contentID,{
                    $push:{
                        comments:comment
                    },
                    $inc:{
                        commentsNum: 1
                    }
                }, {new: true})
                return comment
            })
        } catch (err) {
            throw err
        }
    },
    getComments: async data=>{
        try{
            return dbConnect(async ()=>{
                return await contentModel.findById(data.id,{name:0, views:0, hidden:0, isUnderReview:0, comments:{replies:0}}).lean().then(content=>{
                    return content.comments.slice(parseInt(data.start), parseInt(data.start)+10)
                })
            })
        }catch(err){
            throw err
        }
    },
    updateComment: async data=>{
        try {
            const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID)
            return dbConnect(async()=>{
                await contentModel.findByIdAndUpdate(data.contentID, {$set:{
                    'comments.$[comment].body':data.body
                }},{
                    arrayFilters:[{'comment._id': commentID, "comment.userID": data.userID}]
                })
            })
        } catch (err) {
            throw err
        }
    },
    deleteComment: async data=>{
        try {
            const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID)
            return dbConnect(async ()=>{
                if(data.user.authz.isAdmin || data.user.authz.isEditor)
                    await contentModel.updateOne({_id: data.contentID, 'comments._id': commentID},{
                        $set:{
                            'comments.$.userID':null,
                            'comments.$.username':"User",
                            'comments.$.userIsAuthz':false,
                            'comments.$.body':"Deleted Message"
                        }
                    })
                else if( data.user.authz.isAuthor && String(data.user._id) == data.commentUserID)
                    await contentModel.updateOne({_id: data.contentID, comments:{$elemMatch:{_id: commentID, userID: data.user._id}}},{
                        $set:{
                            'comments.$.userID':null,
                            'comments.$.username':"User",
                            'comments.$.userIsAuthz':false,
                            'comments.$.body':"Deleted Message"
                        }
                    })
                else if( data.user.authz.isAuthor)
                    await contentModel.updateOne({_id: data.contentID, 'author.id': data.user._id, 'comments._id': commentID},{
                        $set:{
                            'comments.$.userID':null,
                            'comments.$.username':"User",
                            'comments.$.userIsAuthz':false,
                            'comments.$.body':"Deleted Message"
                        }
                    })
                else
                await contentModel.updateOne({_id: data.contentID, comments:{$elemMatch:{_id: commentID, userID: data.user._id}}},{
                    $set:{
                        'comments.$.userID':null,
                        'comments.$.username':"User",
                        'comments.$.body':"Deleted Message"
                    }
                })
            })
        } catch (err) {
            throw err
        }
    },
    setLoveComment: async data=>{// only by the author of the content
        try {
            const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID)
            return dbConnect(async ()=>{
                await contentModel.updateOne({_id: data.contentID, 'author.id': data.userID, 'comments._id': commentID},{
                    $set:{
                        'comments.$.loved': data.addLove? true:false
                    }
                })
            })
        } catch (err) {
            throw err
        }
    },
    reactComment: async data=>{// by any user except content author
        try {
            const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID)
            return dbConnect(async()=>{
                await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                    $pull:{
                        'comments.$.likes': String(data.userID)
                    }
                }).then(async result=>{
                    if(result.modifiedCount){
                        if(data.react == 'dislike'){
                            await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                $push:{
                                    'comments.$.dislikes': String(data.userID)
                                }
                            })
                        }
                    }else{
                        await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                            $pull:{
                                'comments.$.dislikes': String(data.userID)
                            }
                        }).then(async result=>{
                            if(result.modifiedCount){
                                if(data.react == 'like'){
                                    await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                        $push:{
                                            'comments.$.likes': String(data.userID)
                                        }
                                    })
                                }
                            }else{
                                await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                    $push:{
                                        ['comments.$.'+data.react+'s']: String(data.userID)
                                    }
                                })
                            }
                        })
                    }
                })
                return await contentModel.findById(data.contentID).lean()
                .then(content=>content.comments.find(comment=>String(comment._id) == String(commentID)))
            })
        } catch (err) {
            throw err
        }
    },
    addReply: async data=>{
        try {
            const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID)
            return dbConnect(async()=>{
                await contentModel.updateOne({_id: data.contentID, 'comments._id': commentID},{
                    $push:{
                    'comments.$.replies': {
                        _id: new mongoose.Types.ObjectId(),
                        username: data.replyOwnerName,
                        userID: data.replyOwnerID,
                        userIsAuthz: data.userIsAuthz,
                        replyToID: data.replyToID? data.replyToID : data.commentID,// the id of the comment/reply that user reply on it
                        replyToUserID: data.replyToUserID,
                        replyToUserName: data.replyToUserName,
                        timestamp: Date.now(),
                        body: data.body,
                        likes:[],
                        dislikes:[],
                        repliesNum:0
                    }}
                })
                if(data.replyToID) 
                    return await contentModel.findOneAndUpdate({_id: data.contentID, 'comments._id': commentID},{
                        $inc: {'comments.$.replies.$[reply].repliesNum':1, 'comments.$.repliesNum':1}
                    },{
                        arrayFilters:[{'reply._id': mongoose.Types.ObjectId.createFromHexString(data.replyToID)}],
                        new: true
                    }).lean()
                else 
                    return await contentModel.findOneAndUpdate({_id: data.contentID, 'comments._id': commentID},{
                        $inc: {'comments.$.repliesNum':1}
                    },{
                        new: true
                    }).lean()
            })
        } catch (err) {
            throw err
        }
    },
    getRepliesByCommentID: async data=>{
        try{
            const theMatching = {"comments.replies.replyToID": data.replyToID == "self"? data.commentID : data.replyToID}
            return dbConnect(async ()=>{
                return await contentModel.aggregate([
                    {
                        "$project": {
                            "comments": 1,
                            "author": 1
                        }
                    }, 
                    {
                        "$match": {
                            _id: mongoose.Types.ObjectId.createFromHexString(data.contentID),
                            "comments._id": mongoose.Types.ObjectId.createFromHexString(data.commentID)
                        }
                    },
                    {
                        "$unwind": "$comments"
                    },
                    {
                        "$unwind": "$comments.replies"
                    },
                    {
                        "$match": theMatching
                    }
                ])
            })
        }catch(err){
            throw err
        }
    },
    updateReply: async data=>{
        try {
            const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID);
            const replyID = mongoose.Types.ObjectId.createFromHexString(data.replyID);
            return dbConnect(async()=>{
                await contentModel.findOneAndUpdate({_id: data.contentID, 'comments._id': commentID},{$set:{
                    'comments.$.replies.$[reply].body': data.body
                }},{
                    arrayFilters:[{'reply._id': replyID, 'reply.userID': data.userID}]
                })
            })
        } catch (err) {
            throw err
        }
    },
    deleteReply: async data=>{
        try {
            return dbConnect(async ()=>{
                const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID);
                const replyID = mongoose.Types.ObjectId.createFromHexString(data.replyID);
                if(data.user.authz.isAdmin || data.user.authz.isEditor)
                    await contentModel.updateOne({_id:data.contentID, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "User",
                        'comments.$.replies.$[reply].userIsAuthz':false,
                        'comments.$.replies.$[reply].body': "Deleted Message"
                    }},{
                        arrayFilters:[{'reply._id': replyID}]
                    })
                else if( data.user.authz.isAuthor && String(data.user._id) == data.replyUserID)
                    await contentModel.updateOne({_id:data.contentID, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "User",
                        'comments.$.replies.$[reply].userIsAuthz':false,
                        'comments.$.replies.$[reply].body': "Deleted Message"
                    }},{
                        arrayFilters:[{'reply._id': replyID, 'reply.userID': data.user._id}]
                    })
                else if( data.user.authz.isAuthor)
                    await contentModel.updateOne({_id:data.contentID, 'author.id': data.user._id, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "User",
                        'comments.$.replies.$[reply].userIsAuthz':false,
                        'comments.$.replies.$[reply].body': "Deleted Message"
                    }},{
                        arrayFilters:[{'reply._id': replyID}]
                    })
                else
                    await contentModel.updateOne({_id:data.contentID, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "User",
                        'comments.$.replies.$[reply].body': "Deleted Message"
                    }},{
                        arrayFilters:[{'reply._id': replyID, 'reply.userID': data.user._id}]
                    })
            })
        } catch (err) {
            throw err
        }
    },
    setLoveReply: async data=>{//only by the author of the content 
        try {
            return dbConnect(async ()=>{
                const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID);
                const replyID = mongoose.Types.ObjectId.createFromHexString(data.replyID);
                await contentModel.updateOne({_id:data.contentID, 'author.id': data.userID, 'comments._id': commentID},{$set:{
                    'comments.$.replies.$[reply].loved': data.addLove? true:false,
                }},{
                    arrayFilters:[{'reply._id': replyID}]
                })
            })
        } catch (err) {
            throw err
        }
    },
    reactReply: async data=>{// by any user except content author
        try {
            const commentID = mongoose.Types.ObjectId.createFromHexString(data.commentID)
            const replyID = mongoose.Types.ObjectId.createFromHexString(data.replyID)
            return dbConnect(async()=>{
                await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                $pull:{
                    'comments.$.replies.$[reply].likes': String(data.userID)
                }},{
                    arrayFilters:[{'reply._id': replyID}]
                }).then(async result=>{
                    if(result.modifiedCount){
                        if(data.react == 'dislike'){
                            await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                $push:{
                                    'comments.$.replies.$[reply].dislikes': String(data.userID)
                                }},{
                                    arrayFilters:[{'reply._id': replyID}]
                            })
                            }
                    }else{
                        await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                            $pull:{
                                'comments.$.replies.$[reply].dislikes': String(data.userID)
                            }},{
                                arrayFilters:[{'reply._id': replyID}]
                        }).then(async result=>{
                            if(result.modifiedCount){
                                if(data.react == 'like'){
                                    await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                        $push:{
                                            'comments.$.replies.$[reply].likes': String(data.userID)
                                        }},{
                                            arrayFilters:[{'reply._id': replyID}]
                                    })
                                }
                            }else{
                                await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                    $push:{
                                        ['comments.$.replies.$[reply].'+data.react+'s']: String(data.userID)
                                    }},{
                                        arrayFilters:[{'reply._id': replyID}]
                                })
                            }
                        })
                    }
                })
                return await contentModel.findById(data.contentID).lean().then(content=> {
                    return content.comments.find(comment=> String(comment._id) == String(commentID))
                    ?.replies.find(reply=> String(reply._id) == String(replyID))}
                )
            })
        } catch (err) {
            throw err
        }
    }
    /* end the functions for comments and replies in specific content in content page */
}