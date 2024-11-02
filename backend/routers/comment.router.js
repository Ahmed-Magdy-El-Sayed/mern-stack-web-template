const express = require('express')
const router = express.Router();

const {
    setComment, getMoreComments,
    editComment, 
    removeComment, loveComment, replyComment, 
    removeReply, editReply, loveReply, 
    makeCommentReact, makeReplyReact, 
    getReplies
}= require('../controllers/comment.controller');

const {isLoggedIn, isAuthor} = require('../controllers/middelwares');

router.post('/comments/add', isLoggedIn, setComment)
router.get('/:id/comments/:start', getMoreComments)
router.put('/comments/edit', isLoggedIn, editComment)
router.delete('/comments/delete', isLoggedIn, removeComment)
router.post('/comments/love', isAuthor, loveComment)
router.post('/comments/react', isLoggedIn, makeCommentReact)

router.post('/replies/add', isLoggedIn, replyComment)
router.get('/:contentID/comment/:commentID/replies/:replyToID', getReplies)
router.put('/replies/edit', isLoggedIn, editReply)
router.delete('/replies/delete', isLoggedIn, removeReply)
router.post('/replies/love', isAuthor, loveReply)
router.post('/replies/react', isLoggedIn, makeReplyReact)


module.exports = router