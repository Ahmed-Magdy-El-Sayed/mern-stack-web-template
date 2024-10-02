const {
    getComments, addComment,
    updateComment, deleteComment, 
    setLoveComment, addReply, 
    deleteReply, updateReply, 
    setLoveReply, reactComment,
    reactReply, getRepliesByCommentID
} = require('../models/contents');
const { addNotif } = require('../models/users');

const { sendEmail } = require('./sendEmail');
const validateId = require('./validateId');

const setComment = (req, res, next)=>{
    const user = req.session.user
    const data = {
        ...req.body,
        username:user.name, 
        userID:user._id, 
        userImg:user.img,
        userIsAuthz: (user.authz.isAdmin || user.authz.isEditor || user.authz.isAuthor)
    }
    if(!validateId(req.body.contentID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    addComment(data).then(comment=>{
        res.status(201).json(comment)
    }).catch(()=> next(err))
}

const getMoreComments = (req, res, next)=>{
    if(!validateId(req.params.id))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    getComments(req.params).then( comments=>{
        res.status(200).json(comments)
    }).catch( err=> next(err))
}

const editComment = (req, res, next)=>{//by comment writer only
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    updateComment({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(()=> next(err))
}

const removeComment = (req, res, next)=>{// by the writer, author, editor, or admin
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    deleteComment({...req.body, user: req.session.user}).then(()=>{
        res.status(201).end()
    }).catch(()=> next(err))
}

const loveComment = (req, res, next)=>{//by content author
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    setLoveComment({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end();
    }).catch(()=> next(err))
}

const makeCommentReact = (req, res, next)=>{//make like or dislike on a comment by any login user except the content author
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    reactComment({...req.body, userID: req.session.user._id}).then( newComment=>{
        res.status(201).json(newComment)
    }).catch(()=> next(err))
}

const replyComment = (req, res, next)=>{
    const user = req.session.user
    const data = {
        ...req.body,
        replyOwnerName: user.name,
        replyOwnerID: user._id,
        replyOwnerImg: user.img,
        userIsAuthz: user.authz.isAdmin || user.authz.isEditor || user.authz.isAuthor
    }
    if(!validateId(data.contentID) && !validateId(data.commentID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    addReply(data).then(async result=>{
        if(!result) return res.status(500).end()
        const commentID = data.commentID
        result.comments = result.comments.find(comment=> comment._id==commentID)
        const newReply = result.comments[0].replies.pop()

        res.status(201).json(newReply)
        if(newReply.replyToUserID != String(user._id)){
            const email = await addNotif({userID: newReply.replyToUserID, notif:{msg:`There is new reply on your comment in the content ${result.name}`, href:'/content/id/'+result._id}})
            await sendEmail(email, {
                title: "New Reply In Your Comment",
                content:`
                <h5>There is new reply in your comment in the content ${result.name} <a href="${process.env.REACT_APP_URL}/content/id/${result._id}">click here</a> to go to the content</h5>
                <p style="white-space: pre-wrap;"><bold>The reply:</bold>\n "${newReply.body}"</p>
                `
            })
        }
    }).catch(err=> next(err))
}

const getReplies = (req, res, next)=>{
    if(!validateId(req.params.contentID) && !validateId(req.params.commentID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    getRepliesByCommentID(req.params).then( separetedRepliesComment=>{
        let replies = [];
        separetedRepliesComment.forEach(ele => {
            replies.push(ele.comments.replies)
        });
        res.status(200).json(replies)
    }).catch( err=> next(err))
}

const editReply = (req, res, next)=>{//by the reply writer only
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID) && !validateId(req.body.replyID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    updateReply({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(()=> next(err))
}

const removeReply = (req, res, next)=>{// by the writer, editor, or admin
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID) && !validateId(req.body.replyID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    deleteReply({...req.body, user: req.session.user}).then(()=>{
        res.status(201).end()
    }).catch(()=> next(err))
}

const loveReply = (req, res, next)=>{//by content author
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID) && !validateId(req.body.replyID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    setLoveReply({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(()=> next(err))
}

const makeReplyReact = (req, res, next)=>{//make like or dislike on a reply by any login user except the content author
    if(!validateId(req.body.contentID) && !validateId(req.body.commentID) && !validateId(req.body.replyID))
        return res.status(400).json({msg:"Bad Request! Try Again."})
    reactReply({...req.body, userID: req.session.user._id}).then( newReply=>{
        res.status(201).json(newReply)
    }).catch(()=> next(err))
}

module.exports={
    setComment, getMoreComments, 
    loveComment, makeCommentReact, 
    editComment, removeComment, 
    replyComment, getReplies,
    editReply, removeReply, loveReply, 
    makeReplyReact,
};