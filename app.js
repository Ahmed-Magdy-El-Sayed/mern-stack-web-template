const express = require('express')
const app = express();
const server = require("http").createServer(app)
const session = require('express-session')
const sessionStore = require('connect-mongodb-session')(session)
const port = process.env.PORT || 3000

const {getHome}= require('./controller/content.controller');

const STORE = new sessionStore({
    uri:"mongodb://localhost:27017/comment",//change database name here and in dbConnect.js in models folder
    collection:"sessions"
})

app.use(express.static('./public'))
app.use(express.static('./images'))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(session({
    secret:'e9345b8aec6ba345ef3b5593c8e1ce397cdbfb901c36ab8766e5a0538b6ee8d3',//change the secret string here
    cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 },
    resave: true,
    saveUninitialized: false,
    store:STORE
}))

/* set pugJS and the files path */
app.set('view engine','pug')
app.set('views','./views/pages')

/* set the routs */
app.get('/', getHome)
app.use('/account',require('./routers/account.router'))
app.use('/verify',require('./routers/verif.router'))
app.use('/content',require('./routers/content.router'))

app.all('*',(req,res)=>{res.status(404).render("error",{err:'Page not found!'})})


/* set socket.io to update the pages without reload it */
const Server = require("socket.io").Server
const io = new Server(server)

io.onlineUsers = {}
io.onlineReviewers = {}

io.on("connection", socket=>{
    socket.on('makeRoom',id=>{
        socket.join(id);
    })

    socket.on('changeOnlineUsers',id=>{
        io.onlineUsers[id] = true;
        socket.on("disconnect",()=>{
            io.onlineUsers[id] = false;
            io.emit('onlineUsers',io.onlineUsers)
        })
        io.emit('onlineUsers',io.onlineUsers)
    })

    socket.on('changeOnlineReviewers',id=>{
        io.onlineReviewers[id] = true;
        socket.on("disconnect",()=>{
            io.onlineReviewers[id] = false;
            io.emit('onlineReviewers',io.onlineReviewers)
            
        })
        io.emit('onlineReviewers',io.onlineReviewers) // add the reviewer to thr object 
        io.emit('onlineUsers',io.onlineUsers) // send him the onlineUsers
    })

    socket.on("confirmReviewers", ()=>{
        Object.keys(io.onlineReviewers).forEach(id=>{
            io.to(id).emit("newContent")
        })
    })

    socket.on("notifyUser", (id, notif)=>{
        io.to(id).emit("noify", notif)
    })

    socket.on('applyWarning',(id, reason)=>{
        if(io.sockets.adapter.rooms.get(id)){
            io.to(id).emit("warning", reason)
            socket.emit("userOnline")
        }else
            socket.emit("userOffline")
    })
    socket.on('logoutUser',(id)=>{
        io.to(id).emit("changesInAccount")
    })
    socket.on('changeAuthorization',id=>{
        io.to(id).emit("changesInAccount")
    })
    socket.on('sendApproval',(userID, contentID, contentName)=>{
        io.to(userID).emit("approveContent", contentID, contentName)
    })
    socket.on('sendRejection',(userID, contentID, contentName, reason)=>{
        io.to(userID).emit("rejectContent", contentID, contentName, reason)
    })
    socket.on("addComment",content=>{
        io.emit("addCommentIn"+content._id, content)
    })
    socket.on("addReply",content=>{
        io.emit("addReplyIn"+content._id, content)
    })
    socket.on("updateComment",data=>{
        io.emit("updateCommentIn"+data.contentID, data)
    })
    socket.on("updateReply",data=>{
        io.emit("updateReplyIn"+data.contentID, data)
    })
    socket.on("deleteComment",data=>{
        io.emit("deleteCommentIn"+data.contentID, data.commentID)
    })
    socket.on("deleteReply",data=>{
        io.emit("deleteReplyIn"+data.contentID, data.replyID)
    })
    socket.on("addLove",(data, authorImg)=>{
        io.emit("addLoveIn"+data.contentID, data.replyID?data.replyID:data.commentID, authorImg)
    })
    socket.on("deleteLove",data=>{
        io.emit("deleteLoveIn"+data.contentID, data.replyID?data.replyID:data.commentID)
    })
    socket.on("react",(data, react)=>{
        io.emit("reactIn"+data.contentID, data.replyID?data.replyID:data.commentID, react)
    })
})
/* start the server */
server.listen(port, err=>{
    err? console.log(err): console.log('server running on port '+port)
})