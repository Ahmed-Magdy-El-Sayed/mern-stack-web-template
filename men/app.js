const express = require('express')
const app = express();
const server = require("http").createServer(app)
const session = require('express-session')
const sessionStore = require('connect-mongodb-session')(session)
const port = process.env.PORT || 3000
require("dotenv").config()

const {getHome}= require('./controller/content.controller');

const STORE = new sessionStore({
    uri: process.env.MONGODB_URI,//change database name here and in dbConnect.js in models folder to your database name
    collection:"sessions"
})

app.use(express.static('./assets'))
app.use(express.static('./images'))
app.use(express.urlencoded({extended:false}))
app.use(express.json())
app.use(session({
    secret:'ghtf85b62k8n6b9uh8u6ghd468bv86zdvzx3bgew638g183xgrgr83xr8g4x128x',//change the secret string here
    cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 },
    resave: true,
    saveUninitialized: false,
    store:STORE
}))

/* set pugJS and the files path */
app.set('view engine','pug')
app.set('views','./views')

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
    /* start global events */
    socket.on('makeRoom',id=>{
        socket.join(id);
    })

    socket.on('changeOnlineUsers',id=>{
        io.onlineUsers[id] = true;
        socket.on("disconnect",()=>{
            delete io.onlineUsers[id];
            io.emit('onlineUsers',io.onlineUsers)// the listener in assets/js/mainForReviewers.js
        })
        io.emit('onlineUsers',io.onlineUsers)
    })

    socket.on('changeOnlineReviewers',id=>{
        io.onlineReviewers[id] = true; // add the reviewer to the object 
        socket.on("disconnect",()=>{
            delete io.onlineReviewers[id];
            io.emit('onlineReviewers',io.onlineReviewers)
        })
        io.emit('onlineUsers',io.onlineUsers) // send the new reviewer the onlineUsers.js
    })

    socket.on("notifyUser", (id, notif)=>{
        io.to(id).emit("noify", notif)// the listener in assets/js/mainForLoggedIn.js
    })

    /* end global events */
    
    /* start accounts control events */
    socket.on('applyWarning',(id, reason)=>{
        if(io.sockets.adapter.rooms.get(id)){
            io.to(id).emit("warning", reason)
            socket.emit("userOnline")// the listener in assets/js/accountControl.js
        }else
            socket.emit("userOffline")// the same
    })
    socket.on('logoutUser',(id)=>{// when ban or delect account
        io.to(id).emit("changesInAccount")// the listener in assets/js/mainForLoggedIn.js
    })
    socket.on('changeAuthorization',id=>{
        io.to(id).emit("changesInAccount")
    })
    /* end accounts control events */

    /* start review contents events */
    socket.on("confirmReviewers", ()=>{
        Object.keys(io.onlineReviewers).forEach(id=>{
            io.to(id).emit("newContent")// the listener in assets/js/mainForReviewers
        })
    })
    socket.on('hiddeContent', contentID=>{
        Object.keys(io.onlineReviewers).forEach(reviewer=>{
            socket.to(reviewer).emit("hiddeContent", contentID)// the listener in assets/js/contentReview.js
        })
    })
    socket.on('showContent', content=>{
        Object.keys(io.onlineReviewers).forEach(reviewer=>{
            socket.to(reviewer).emit("showContent", content)// the listener in assets/js/contentReview.js
        })
    })
    socket.on('sendApproval',(userID, contentID, contentName)=>{
        io.to(userID).emit("approveContent", contentID, contentName)// the listener in assets/js/content/contentUnderReview.js
    })
    socket.on('sendRejection',(userID, contentID, contentName, reason)=>{
        io.to(userID).emit("rejectContent", contentID, contentName, reason)// the listener in assets/js/content/contentUnderReview.js
    })
    /* end review contents events */

    /* start update comments events */
    // the listeners of all following events are in assets/js/content/commentSocket.js
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
    /* start update comments events */
})

/* start the server */
server.listen(port, err=>{
    err? console.log(err): console.log('server running on port '+port)
})