const express = require('express')
const router = express.Router();

const {
    setComment, getMoreComments,
    editComment, 
    removeComment, loveComment, replyComment, 
    removeReply, editReply, loveReply, 
    makeCommentReact, makeReplyReact, 
    getReplies
}= require('../controller/comment.controller');

const {isLoggedIn, isAuthor} = require('../controller/middelwares');

router.post('/comments', isLoggedIn, setComment)
router.get('/:id/comments/:start', getMoreComments)
router.put('/comments/edit', isLoggedIn, editComment)
router.delete('/comments/delete', isLoggedIn, removeComment)
router.post('/comments/love', isAuthor, loveComment)
router.post('/comments/react', isLoggedIn, makeCommentReact)
router.get('/:contentID/comment/:commentID/replies/:replyToID', getReplies)
router.post('/replies/add', isLoggedIn, replyComment)
router.delete('/replies/delete', isLoggedIn, removeReply)
router.post('/replies/love', isAuthor, loveReply)
router.put('/replies/edit', isLoggedIn, editReply)
router.post('/replies/react', isLoggedIn, makeReplyReact)


module.exports = router