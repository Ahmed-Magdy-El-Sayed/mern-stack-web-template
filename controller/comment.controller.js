const {
    getComments, addComment,
    updateComment, deleteComment, 
    setLoveComment, addReply, 
    deleteReply, updateReply, 
    setLoveReply, reactComment,
    reactReply, getRepliesByCommentID
} = require('../models/contents');
const { addNotif } = require('../models/users');

const {
    createCommentHTML,
    createReplyHTML
} = require('./createCommentHTML');
const { sendEmail } = require('./sendEmail');

const setComment = (req, res)=>{//when add comment from content page
    const user = req.session.user
    const data = {
        ...req.body,
        username:user.name, 
        userID:user._id, 
        userImg:user.img,
        userIsAuthz: (user.isAdmin || user.isEditor || user.isAuthor)
    }
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    addComment(data).then(result=>{
        result.comments = result.comments.pop()
        res.status(201).json(result)
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const getMoreComments = (req, res)=>{// when user click on show more at the end of comments in the content page
    if(!req.params.id.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    getComments(req.params).then( result=>{
        result.comments = result.comments.map(comment=>createCommentHTML(result.author, comment, req.session.user))
        res.status(200).json(result)
    }).catch( err=>{console.log(err)
        res.status(500).end("internal server error")
    })
}

const getCommentHTML = (req, res)=>{
    const content = req.body
    res.status(200).json(createCommentHTML(
        content.author, 
        content.comments[0], 
        req.session.user, 
        true
    ))
}

const editComment = (req, res)=>{//by comment writer only
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    updateComment({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const removeComment = (req, res)=>{// by the writer, author, editor, or admin
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    deleteComment({...req.body, user: req.session.user}).then(()=>{
        res.status(201).end()
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const loveComment = (req, res)=>{//by content author
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    setLoveComment({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const makeCommentReact = (req, res)=>{//make like or dislike on a comment by any login user except the author, editor, and admin
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    reactComment({...req.body, userID: req.session.user._id}).then( react=>{
        res.status(201).json(react)
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const replyComment = (req, res)=>{
    const user = req.session.user
    const data = {
        ...req.body,
        replyOwnerName: user.name,
        replyOwnerID: user._id,
        replyOwnerImg: user.img,
        userIsAuthz: user.isAdmin || user.isEditor || user.isAuthor
    }
    const info = JSON.parse(req.body.info)
    if(!info.contentID.match(/^[0-9a-fA-F]{24}$/) && !info.commentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    addReply(data).then(async result=>{
        if(!result) return res.status(500).end()
        const commentID = info.commentID
        result.comments = result.comments.filter(comment=> comment._id==commentID)
        const repliesNum = result.comments[0].replies.length;
        const newReplyObj = result.comments[0].replies.slice(-1).pop()
        if(repliesNum){
            result.comments[0].replies = result.comments[0].replies.filter(reply=>newReplyObj.deepestTo?(newReplyObj.deepestTo==reply.deepestTo):(newReplyObj.replyToID==reply.replyToID)).slice(-2)
            result.comments[0].newReply = newReplyObj
        }else return res.status(500).end()

        res.status(201).json(result)
        if(newReplyObj.replyToUserID != String(user._id)){
            const email = await addNotif({userID: newReplyObj.replyToUserID, notif:{msg:`There is new reply on your comment in the content ${result.name}`, href:'/content/id/'+result._id}})
            await sendEmail(email, {
                title: "New Reply In Your Comment",
                content:`
                <h5>There is new reply in your comment in the content ${result.name} <a href="${req.protocol + '://' + req.get('host')}/content/id/${result._id}">click here</a> to go to the content</h5>
                <p style="white-space: pre-wrap;"><bold>The reply:</bold>\n "${newReplyObj.body}"</p>
                `
            })
        }
    }).catch(err=>{console.log(err)
        res.status(500).end("internal server error")
    })
}

const getReplies = (req, res)=>{//when click on show replies under a comment or anther reply
    if(!req.params.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.params.commentID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    getRepliesByCommentID(req.params).then( content=>{
        let result = content.map(ele=>{//I made $unwind to comments & replies, so the comments attribute here is now an single object contain replies that also single 
            return createReplyHTML(ele.author, ele.comments, req.session.user)
        })
        res.status(200).json(result)
    }).catch( err=>{console.error(err)
        res.status(500).end("internal server error")
    })
}

const getReplyHTML = (req, res)=>{
    const content = req.body;
    content.comments[0].replies = content.comments[0].replies.pop()
    res.status(200).json(createReplyHTML(
        content.author, 
        content.comments[0], 
        req.session.user, 
        true
    ))
}

const editReply = (req, res)=>{//by the comment writer only
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.replyID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    updateReply({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const removeReply = (req, res)=>{// by the writer, author, editor, or admin
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.replyID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    deleteReply({...req.body, user: req.session.user}).then(()=>{
        res.status(201).end()
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const loveReply = (req, res)=>{//by content author
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.replyID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    setLoveReply({...req.body, userID: req.session.user._id}).then(()=>{
        res.status(201).end()
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

const makeReplyReact = (req, res)=>{// same as makeCommentReact except that the react is on a reply
    if(!req.body.contentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.commentID.match(/^[0-9a-fA-F]{24}$/) && !req.body.replyID.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).render('error', {error: "Bad Request! try again."})//send error, if the recieved id is invaild
    reactReply({...req.body, userID: req.session.user._id}).then( react=>{
        res.status(201).json(react)
    }).catch(()=>{
        res.status(500).end("internal server error")
    })
}

module.exports={
    setComment, getMoreComments, 
    getCommentHTML, loveComment,
    makeCommentReact, editComment, removeComment, 
    replyComment, getReplies, getReplyHTML,
    editReply, removeReply, loveReply, 
    makeReplyReact,
};