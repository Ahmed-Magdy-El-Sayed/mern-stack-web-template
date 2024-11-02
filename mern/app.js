const express = require('express')
const app = express();
const path = require('path')
const session = require('express-session')
const sessionStore = require('connect-mongodb-session')(session)
const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
require("dotenv").config()

/* create .env file and add the variables:
    MONGODB_URI

    SESSION_SECRET

    EMAIL_USER
    EMAIL_PASS

    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
*/
const STORE = new sessionStore({
    uri: process.env.MONGODB_URI,
    collection:"sessions"
})

app.use(express.static(path.join(__dirname, "build")));
app.use('/images', express.static('./images'))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(cookieParser())
app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: {
        /* sameSite: "none",
        secure: true, */
        maxAge: 3*24*60*60*1000 //changing the maxAge value requires changing in account.control line 83 & verif.control line 18 & oauth.controller line 9
    },
    resave: false,
    saveUninitialized: false,
    store:STORE
}))
app.use((err, req, res, next)=>{
    console.log(err);
    res.status(500).json({msg:"Internal server error"})
})

/* set the routs */
app.use('/api', require("./routers/index"))
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

const http = require("http");
const server = http.createServer(app)
/* set socket.io to update the pages without refresh it */
const Server = require("socket.io").Server
const io = new Server(server);

io.on("connection", socket=>{
    /* start global events */
    socket.on('makeRoom',(id, role)=>{
        socket.join(id);
        socket.join(role) // role: user || author || editor || admin
    })

    socket.on("notifyUser", id=>{
        io.to(id).emit("notify")
    })
    /* end global events */
    
    /* start accounts control events */
    socket.on('applyWarning',(id, reason)=>{
        io.to(id).emit("warning", reason)
    })
    socket.on('logoutUser',(id)=>{
        io.to(id).emit("forceLogout")
    })
    socket.on('changeAuthorization',id=>{
        io.to(id).emit("forceLogout")
    })
    /* end accounts control events */

    /* start review content events */
    socket.on("confirmReviewers", content=>{
        socket.to(["editor", "admin"]).emit("newContentToReview", content)
        socket.to(["editor", "admin"]).emit("notify", {msg: "there is new content to review", href:"/content/control", num: 1, isReaded: false})
    })
    socket.on('hiddeContent', contentID=>{
        socket.to(["editor", "admin"]).emit("hiddeContent", contentID)
    })
    socket.on('showContent', content=>{
        socket.to(["editor", "admin"]).emit("showContent", content)
    })
    socket.on('sendApproval',(userID, contentID)=>{
        io.to(userID).emit("approveContent", contentID)
    })
    socket.on('sendRejection',(userID, contentID)=>{
        io.to(userID).emit("rejectContent", contentID)
    })
    /* end review content events */

    /* start comment events */
    socket.on("addComment", (contentID, comment)=>{
        io.emit("addCommentIn"+contentID, comment)
    })
    socket.on("addReply", (data, newReply)=>{
        io.emit("addReplyIn"+data.contentID, data.commentID, newReply)
        io.to(newReply.replyToUserID).emit("notify")
    })

    socket.on("updateComment",data=>{
        io.emit("updateCommentIn"+data.contentID, data)
    })
    socket.on("updateReply", (data, reply)=>{
        io.emit("updateReplyIn"+data.contentID, data.commentID, data.replyToID, reply)
    })

    socket.on("deleteComment",data=>{
        io.emit("deleteCommentIn"+data.contentID, data.commentID)
    })
    socket.on("deleteReply",(data, replyID)=>{
        io.emit("deleteReplyIn"+data.contentID, data.commentID, data.replyToID, replyID)
    })

    socket.on("addLove", (data, replyID) =>{
        io.emit("addLoveIn"+data.contentID, data.commentID, data.replyToID, replyID)
    })
    socket.on("deleteLove",(data, replyID)=>{
        io.emit("deleteLoveIn"+data.contentID, data.commentID, data.replyToID, replyID)
    })

    socket.on("react",(data, updatedComment)=>{
        io.emit("reactIn"+data.contentID, data.commentID, data.replyToID, updatedComment)
    })
    /* end comment events */
})

/* start the server */
server.listen(port, err=>{
    err? console.log(err): console.log('server running on port '+port)
})