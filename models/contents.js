const mongoose = require('mongoose');
const dbConnect = require('./dbConnect')

const {addNotif} = require("./users")

const contentSchema = new mongoose.Schema({
    name: String,
    views: {type:Number, default: 0},
    hidden: {type:Boolean, default: false},
    commentsNum: {type:Number, default: 0},
    author: {id:String, name: String, img: String},
    isUnderReview:{type:Boolean, default:false},
    comments:{type: Array, default: []}
})

const contentModel = new mongoose.model('content',contentSchema);

module.exports = {
    /*--> start the functions in content.controller */
    getReviewedContents : async ()=>{// get the content that reviewed for the home page 
        try{
            return dbConnect(async()=>{
                return await contentModel.find({isUnderReview: {$not:{$eq:true}}}, {comments:{replies:0}}).limit(10)
            })
        }catch(err){
            throw err
        }
    },
    getMoreReviewedContents : async (user, skip)=>{// get the content that reviewed for the home page 
        try{
            return dbConnect(async()=>{
                if(user?.isAdmin || user?.isEditor)
                    return await contentModel.find({isUnderReview: {$not:{$eq:true}}}, {comments:{replies:0}}).skip(skip).limit(10)
                else if(user?.isAuthor)
                    return await contentModel.find({isUnderReview: {$not:{$eq:true}}, 
                        $or:[
                            {hidden: {$not:{$eq:true}}},
                            {hidden: true, "author.id": String(user._id)}
                        ]
                    }, {comments:{replies:0}}).skip(skip).limit(10)
                else
                    return await contentModel.find({isUnderReview: {$not:{$eq:true}}, hidden: {$not:{$eq:true}}}, {comments:{replies:0}}).skip(skip).limit(10)
            })
        }catch(err){
            throw err
        }
    },
    getContentById: async data=>{// when click on one of the content in the home, myContent, or contentReview page 
        try{
            return dbConnect(async ()=>{
                if(data.normalUser)
                    return await contentModel.findByIdAndUpdate(data.id, {$inc:{views: 1}}, {select:{comments:{replies:0}}}).then(content=>{
                        if(content?.comments.length > 10)
                            content.comments = content.comments.slice(0, 10)
                        return content
                    })
                else
                    return await contentModel.findById(data.id,{comments:{replies:0}}).then(content=>{
                        if(content?.comments.length > 10)
                            content.comments = content.comments.slice(0, 10)
                        return content
                    })
            })
        }catch(err){
            throw err
        }
    },

    /* start the functions for myContent page */
    getContentByAuthorId: async id=>{// when open myContent page
        try{
            return dbConnect(async ()=>{
                return await contentModel.find({"author.id":id})
            })
        }catch(err){
            throw err
        }
    },
    pushContent: async data=>{// add content from myContent page
        let isUnderReview;
        if(data.author.role == "author")
            isUnderReview = true 
        try{
            return dbConnect(async()=>{
                await new contentModel({name: data.name, author: data.author, isUnderReview}).save()
            })
        }catch(err){
            throw err
        }
    },
    markUnvisiable: async data=>{// hide content
        try{
            return dbConnect(async()=>{
                await contentModel.updateOne({_id: data.contentID, "author.id": data.userID}, {hidden: true})
            })
        }catch(err){
            throw err
        }
    },
    markVisiable: async data=>{// show content
        try{
            return dbConnect(async()=>{
                await contentModel.updateOne({_id: data.contentID, "author.id": data.userID}, {hidden: false})
            })
        }catch(err){
            throw err
        }
    },
    removeContent: async (data, user)=>{// delete content
        try{
            return dbConnect(async()=>{
                if(user.isAdmin || user.isEditor)
                    await contentModel.deleteOne({_id: data.contentID})
                else
                    await contentModel.deleteOne({_id: data.contentID, "author.id": user._id})
            })
        }catch(err){
            throw err
        }
    },
    /* end the functions for myContent page */

    /* start the functions for contentReview page */
    getUnderReviewContents: async ()=>{// when admin or the editor open accountsControl page to review the contents
        try{
            return dbConnect(async()=>{
                return await contentModel.find({isUnderReview: true})
            })
        }catch(err){
            throw err
        }
    },
    setContentApproved: async data=>{// when the reviewer (admin or editor) approve the content
        try{
            return dbConnect(async ()=>{
                const content = await contentModel.findByIdAndUpdate(data.contentID, {$set:{
                    isUnderReview: false, 
                }},{select:{name:1}})
                if(!content) return false
                const notif = {msg: `Your content ${content.name} was approved and added to the website content`, href:"/content/id/"+String(content._id)}
                const email = await addNotif({userID: data.authorID, notif})// to notify the author
                return{email, notif}
            })
        }catch(err){
            throw err
        }
    },
    setContentRejected: async data=>{// when the reviewer reject the content
        try{
            return dbConnect(async ()=>{
                const content = await contentModel.findByIdAndDelete(data.contentID, {select:{name:1}})
                if(!content) return false
                const notif = {msg: `Your content ${content.name} was rejected for: "${data.reason}"`, href:"/content/my-content"}
                const email =  await addNotif({userID: data.authorID, notif})// to notify the author
                return {email, notif}
            })
        }catch(err){
            throw err
        }
    },
    /* end the functions for contentReview page */
    /*--> end the functions in content.controller */

    /* start the functions in comment.controller for comments and replies in content page */
    addComment: async data=>{//add comment to specific content
        try {
            return dbConnect(async()=>{
                return await contentModel.findByIdAndUpdate(data.contentID,{
                    $push:{
                        comments:{
                            _id: new mongoose.Types.ObjectId(),
                            username:data.username,
                            userID:data.userID,
                            userImg: data.userImg,
                            userIsAuthz: data.userIsAuthz,
                            timestamp: new Date().getTime(),
                            body: data.body,
                            likes:[],
                            dislikes:[],
                            repliesNum:0,
                            replies: []
                        }
                    },
                    $inc:{
                        commentsNum: 1
                    }
                },{
                    new: true
                })
            })
        } catch (err) {
            throw err
        }
    },
    getComments: async data=>{//when user click on show more at the end of content page 
        try{
            return dbConnect(async ()=>{
                return await contentModel.findById(data.id,{name:0, views:0, hidden:0, isUnderReview:0, comments:{replies:0}}).then(content=>{
                    content.comments = content.comments.slice(parseInt(data.start), parseInt(data.start)+10)
                    return content
                })
            })
        }catch(err){
            throw err
        }
    },
    updateComment: async data=>{
        try {
            const commentID = new mongoose.Types.ObjectId(data.commentID)
            return dbConnect(async()=>{
                await contentModel.findOneAndUpdate({_id: data.contentID, 'comments.userID': data.userID, 'comments._id': commentID},{$set:{
                    'comments.$.body':data.body
                }})
            })
        } catch (err) {
            throw err
        }
    },
    deleteComment: async data=>{
        try {
            const commentID = new mongoose.Types.ObjectId(data.commentID)
            return dbConnect(async ()=>{
                if(data.user.isAdmin || data.user.isEditor)
                    await contentModel.updateOne({_id: data.contentID, 'comments._id': commentID},{
                        $set:{
                            'comments.$.userID':null,
                            'comments.$.username':"Deleted",
                            'comments.$.userImg':"/user.jpg",
                            'comments.$.userIsAuthz':false,
                            'comments.$.body':"Deleted Message"
                        }
                    })
                else if( data.user.isAuthor && String(data.user._id) == data.commentUserID)
                    await contentModel.updateOne({_id: data.contentID, comments:{$elemMatch:{_id: commentID, userID: data.user._id}}},{
                        $set:{
                            'comments.$.userID':null,
                            'comments.$.username':"Deleted",
                            'comments.$.userImg':"/user.jpg",
                            'comments.$.userIsAuthz':false,
                            'comments.$.body':"Deleted Message"
                        }
                    })
                else if( data.user.isAuthor)
                    await contentModel.updateOne({_id: data.contentID, 'author.id': data.user._id, 'comments._id': commentID},{
                        $set:{
                            'comments.$.userID':null,
                            'comments.$.username':"Deleted",
                            'comments.$.userImg':"/user.jpg",
                            'comments.$.userIsAuthz':false,
                            'comments.$.body':"Deleted Message"
                        }
                    })
                else
                await contentModel.updateOne({_id: data.contentID, comments:{$elemMatch:{_id: commentID, userID: data.user._id}}},{
                    $set:{
                        'comments.$.userID':null,
                        'comments.$.username':"Deleted",
                        'comments.$.userImg':"/user.jpg",
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
            const commentID = new mongoose.Types.ObjectId(data.commentID)
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
    reactComment: async data=>{//add or remove like or dislike by the normal user accounts (not allowed for admins, editors, or authors) 
        try {
            const commentID = new mongoose.Types.ObjectId(data.commentID)
            return dbConnect(async()=>{
                return await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
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
                            return {like:-1, dislike:1}
                        }
                        return {like:-1, dislike:0}
                    }else{
                        return await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
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
                                    return {like:1, dislike:-1}
                                }
                                return {like:0, dislike:-1}
                            }else{
                                await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                    $push:{
                                        ['comments.$.'+data.react+'s']: String(data.userID)
                                    }
                                })
                                return {like:0, dislike:0, [data.react]:1}
                            }
                        })
                    }
                })
            })
        } catch (err) {
            throw err
        }
    },
    addReply: async data=>{
        try {
            const info = JSON.parse(data.info)
            const commentID = new mongoose.Types.ObjectId(info.commentID)
            const repliesNum = info.replyID? 'comments.$.replies.$[reply].repliesNum' : 'comments.$.repliesNum'
            return dbConnect(async()=>{
                await contentModel.updateOne({_id: info.contentID, 'comments._id': commentID},{
                    $push:{
                    'comments.$.replies': {
                        _id: new mongoose.Types.ObjectId(),
                        username: data.replyOwnerName,
                        userID: data.replyOwnerID,
                        userImg: data.replyOwnerImg,
                        userIsAuthz: data.userIsAuthz,
                        replyToID: info.replyID? info.replyID : info.commentID,// the id of the comment/reply that user reply on it
                        replyToUserID: info.commentOwnerID? info.commentOwnerID : info.replyOwnerID,
                        replyToUserName: info.commentOwnerName? info.commentOwnerName : info.replyOwnerName,
                        timestamp: new Date().getTime(),
                        body: data.body,
                        likes:[],
                        dislikes:[],
                        repliesNum:0
                    }}
                })
                return await contentModel.findOneAndUpdate({_id: info.contentID, 'comments._id': commentID},{
                    $inc:{
                        [repliesNum]:1
                    }
                },{
                    arrayFilters:[{'reply._id': new mongoose.Types.ObjectId(info.replyID)}],
                    new: true
                })
            })
        } catch (err) {
            throw err
        }
    },
    getRepliesByCommentID: async data=>{// when user click on show replies under the comemnts or anthor replies
        try{
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
                            _id: new mongoose.Types.ObjectId(data.contentID),
                            "comments._id": new mongoose.Types.ObjectId(data.commentID)
                        }
                    },
                    {
                        "$unwind": "$comments"
                    },
                    {
                        "$unwind": "$comments.replies"
                    },
                    {
                        "$match": {
                            "comments.replies.replyToID": data.replyToID == "none"? data.commentID : data.replyToID
                        }
                    }
                ])
            })
        }catch(err){
            throw err
        }
    },
    updateReply: async data=>{
        try {
            const commentID = new mongoose.Types.ObjectId(data.commentID);
            const replyID = new mongoose.Types.ObjectId(data.replyID);
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
                const commentID = new mongoose.Types.ObjectId(data.commentID);
                const replyID = new mongoose.Types.ObjectId(data.replyID);
                if(data.user.isAdmin || data.user.isEditor)
                    await contentModel.updateOne({_id:data.contentID, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "Deleted",
                        'comments.$.replies.$[reply].userImg': "/user.jpg",
                        'comments.$.replies.$[reply].userIsAuthz':false,
                        'comments.$.replies.$[reply].body': "Deleted Message"
                    }},{
                        arrayFilters:[{'reply._id': replyID}]
                    })
                else if( data.user.isAuthor && String(data.user._id) == data.replyUserID)
                    await contentModel.updateOne({_id:data.contentID, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "Deleted",
                        'comments.$.replies.$[reply].userImg': "/user.jpg",
                        'comments.$.replies.$[reply].userIsAuthz':false,
                        'comments.$.replies.$[reply].body': "Deleted Message"
                    }},{
                        arrayFilters:[{'reply._id': replyID, 'reply.userID': data.user._id}]
                    })
                else if( data.user.isAuthor)
                    await contentModel.updateOne({_id:data.contentID, 'author.id': data.user._id, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "Deleted",
                        'comments.$.replies.$[reply].userImg': "/user.jpg",
                        'comments.$.replies.$[reply].userIsAuthz':false,
                        'comments.$.replies.$[reply].body': "Deleted Message"
                    }},{
                        arrayFilters:[{'reply._id': replyID}]
                    })
                else
                    await contentModel.updateOne({_id:data.contentID, 'comments._id': commentID},{$set:{
                        'comments.$.replies.$[reply].userID':null,
                        'comments.$.replies.$[reply].username': "Deleted",
                        'comments.$.replies.$[reply].userImg': "/user.jpg",
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
                const commentID = new mongoose.Types.ObjectId(data.commentID);
                const replyID = new mongoose.Types.ObjectId(data.replyID);
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
    reactReply: async data=>{// same as reactComment
        try {
            const commentID = new mongoose.Types.ObjectId(data.commentID)
            const replyID = new mongoose.Types.ObjectId(data.replyID)
            return dbConnect(async()=>{
                return await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
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
                                return {like:-1, dislike:1}
                            }
                            return {like:-1, dislike:0}
                    }else{
                        return await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
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
                                    return {like:1, dislike:-1}
                                }
                                return {like:0, dislike:-1}
                            }else{
                                await contentModel.updateMany({_id: data.contentID,'comments._id': commentID},{
                                    $push:{
                                        ['comments.$.replies.$[reply].'+data.react+'s']: String(data.userID)
                                    }},{
                                        arrayFilters:[{'reply._id': replyID}]
                                })
                                return {like:0, dislike:0, [data.react]:1}
                            }
                        })
                    }
                })
            })
        } catch (err) {
            throw err
        }
    }
    /* end the functions in comment.controller for comments and replies in specific content in content page */
}