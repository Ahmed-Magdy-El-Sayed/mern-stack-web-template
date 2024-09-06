const express = require('express')
const app = express();
const session = require('express-session')
const sessionStore = require('connect-mongodb-session')(session)
const port = process.env.PORT || 4000;
const cookieParser = require('cookie-parser');
const {getContents}= require('./controller/content.controller');
require("dotenv").config()

const STORE = new sessionStore({
    uri: process.env.MONGODB_URI,// create .env file and add the variable
    collection:"sessions"
})

app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", process.env.REACT_APP_URL)
    res.header('Access-Control-Allow-Headers', "Content-Type");
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE");
    next();
})

app.use(express.static('./images'))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(cookieParser())
app.use(session({
    secret:'ed0d1d5cbbb81661fd20d8e8994238d6f3baa419bddbaa6d1bbe3aa9f78b6f2e',//change the secret string here
    cookie: {maxAge: 3*24*60*60*1000},//changing the maxAge value requires changing in account.control line 83 & verif.control line 18
    resave: true,
    saveUninitialized: false,
    store:STORE
}))
app.use((err, req, res, next)=>{
    console.log(err);
    res.status(500).json({msg:"Internal server error"})
})

/* set the routs */
app.get('/', getContents)
app.use('/account',require('./routers/account.router'))
app.use('/verify',require('./routers/verif.router'))
app.use('/content',require('./routers/content.router'))

app.all('*',(req,res)=>{res.status(404).json({msg:'Route Not Found!'})})

const http = require("http");
const server = http.createServer(app)
/* set socket.io to update the pages without refresh it */
const Server = require("socket.io").Server
const io = new Server(server,{
    cors: {
        origin: process.env.REACT_APP_URL,
        methods: ["GET", "POST"],
        credentials: true,
        transports: ['websocket', 'polling'],
    },
    allowEIO3: true
});

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
    socket.on("addReply", (data, newReply)=>{console.log("tessttt")
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