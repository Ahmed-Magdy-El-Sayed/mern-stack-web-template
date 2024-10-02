const express = require('express')
const router = express.Router();

const {
    setComment, getMoreComments,
    getCommentHTML, getReplyHTML, editComment, 
    removeComment, loveComment, replyComment, 
    removeReply, editReply, loveReply, 
    makeCommentReact, makeReplyReact, 
    getReplies
}= require('../controller/comment.controller');

const {isLoggedIn, isAuthor} = require('../controller/middelwares');

router.post('/comments', isLoggedIn, setComment)
router.get('/:id/comments/:start', getMoreComments)
router.post('/comments/comment-html', getCommentHTML)
router.post('/comments/edit', isLoggedIn, editComment)
router.post('/comments/delete', isLoggedIn, removeComment)
router.post('/comments/love', isAuthor, loveComment)
router.post('/comments/react', isLoggedIn, makeCommentReact)
router.get('/:contentID/comment/:commentID/replies/:replyToID', getReplies)
router.post('/comments/reply-html', getReplyHTML)
router.post('/replies/add', isLoggedIn, replyComment)
router.post('/replies/delete', isLoggedIn, removeReply)
router.post('/replies/love', isAuthor, loveReply)
router.post('/replies/edit', isLoggedIn, editReply)
router.post('/replies/react', isLoggedIn, makeReplyReact)


module.exports = router