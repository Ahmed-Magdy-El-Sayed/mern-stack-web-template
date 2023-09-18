const contentID = document.querySelector(".content-id").id
document.querySelector(".content-id").remove()

/* all following code is for update the page without need to reload it */

socket.on("addCommentIn"+contentID, content=>{//when their is new 
    const reachLastComment = document.querySelector(".show-comments")? false : true;
    if(reachLastComment){// check that the user clicked on "show more" until reach to the last comment
        if(document.querySelector(".no-comment")) document.querySelector(".no-comment").remove()
        
        fetch("/content/comments/comment-html",{
            method:'post',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(content)
        }).then(res=>{
            if(res.status === 200) return res.json()
            else throw res.body;
        }).then(comment=>{console.log(comment)
            document.querySelector(".comments").innerHTML+= comment.HTMLComment;
            const addTime = commentID=>{
                const timeEle = document.querySelector("#d"+commentID+" .comment-time")
                const {passedTime, nextInc} = calcPassedTime(parseInt(timeEle.dataset.timestamp))
                timeEle.innerText= passedTime
                nextInc?setTimeout(commentID=>{addTime(commentID)}, nextInc, commentID):null
            }
            addTime(comment.id)
        }).catch(err=>{
            console.error(err)
            document.querySelector(".comments").innerHTML+= 
                "<p class='alert alert-danger w-100'>failed to get a new comment, reload the page to show it</p>"
        })
        
    }
})

socket.on("addReplyIn"+contentID, content=>{//when their is new reply
    const comment = content.comments[0];
    const replyToComment = document.querySelector("#d"+comment.newReply.replyToID)
    if(!replyToComment) return null
    if(comment.replies.length == 1){//if it is the first reply on the comment
        replyToComment.insertAdjacentHTML("afterend",`
        <div class="comment-replies ms-3 mb-3">
            <div class="collapse replies ps-3 pt-3 pb-3 border-start border-2 border-secondary" id="replies${comment.newReply.replyToID}">
                <div class="spinner-border text-primary ms-3" role="status">
                    <span class="visually-hidden"> Loading... </span>
                </div>
            </div>
            <a class="mb-3 text-decoration-none" data-bs-toggle="collapse"
                href="#replies${comment.newReply.replyToID}" 
                onclick='getReplies(this, "${comment._id}", "${comment.newReply.replyToID}")'
                data-replies-num= "1"
            > show (1) new replies </a>
        </div>
        `)

    }else{//their is already replies on this comment
        const reachToLastReply = document.querySelector("#d"+comment.replies[0]._id)? true : false;
        if(reachToLastReply){//the user was opening the replies
            fetch("/content/comments/reply-html",{
                method:'post',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify(content)
            }).then(res=>{
                if(res.status === 200) return res.json()
                else throw res.body;
            }).then(reply=>{
                document.querySelector("#d"+reply.replyToID+" + .comment-replies > .replies").innerHTML+= reply.HTMLReply
                const addTime = commentID=>{
                    const timeEle = document.querySelector("#d"+commentID+" .comment-time")
                    const {passedTime, nextInc} = calcPassedTime(parseInt(timeEle.dataset.timestamp))
                    timeEle.innerText= passedTime
                    
                    nextInc?setTimeout(commentID=>{addTime(commentID)}, nextInc, commentID):null
                }
                addTime(reply.id)
                const repliesToggeler = document.querySelector("#d"+reply.replyToID+" + .comment-replies").lastElementChild;
                const repliesNum = document.querySelectorAll("#d"+reply.replyToID+" + .comment-replies > .replies .reply").length
                repliesToggeler.dataset.repliesNum = repliesNum
                if(repliesToggeler.innerHTML != "show less")// if the user open the replies then close it, so the replies is exist but closed
                    repliesToggeler.innerHTML = `show (${repliesNum}) new replies`
            }).catch(err=>{
                console.error(err)
                document.querySelector(".comments").innerHTML+= 
                    "<p class='alert alert-danger w-100'>failed to get a new reply, reload the page to show it</p>"
            })
            
        }else{//the user did not open the replies
            const showRepliesEle = replyToComment.nextElementSibling.lastElementChild
            showRepliesEle.dataset.repliesNum = parseInt(showRepliesEle.dataset.repliesNum) + 1
            showRepliesEle.innerText = `show (${showRepliesEle.dataset.repliesNum}) new replies`
        }
    }
})

socket.on("updateCommentIn"+contentID, comment=>{//the comment owner edit it
    const theComment = document.querySelector("#d"+comment.commentID);
    if(theComment){//check if exist
        theComment.querySelector(".content p").innerText = comment.body
        theComment.querySelector(".fa-pen-to-square")?.click()
    }
})

socket.on("updateReplyIn"+contentID, comment=>{//the reply owner edit it
    const theReply = document.querySelector("#d"+comment.replyID);
    if(theReply){//check if exist
        theReply.querySelector(".content p").innerText = comment.body
        theReply.querySelector(".fa-pen-to-square")?.click()
    }
})

socket.on("deleteCommentIn"+contentID, commentID=>{//the comment owner delete it
    const theComment = document.querySelector("#d"+commentID);
    if(theComment){//check if exist
        theComment.querySelector(".user-details img").src = "/user.jpg"
        theComment.querySelector(".details .username").innerText = "Deleted"
        theComment.querySelector(".details .username").classList.remove('btn-primary')
        theComment.querySelector(".details .author-mark")?.remove()
        theComment.querySelector(".content p").innerText = "Deleted Message"
        theComment.querySelector(".options").remove()
    }
})
socket.on("deleteReplyIn"+contentID, replyID=>{//the reply owner delete it
    const theComment = document.querySelector("#d"+replyID);
    if(theComment){//check if exist
        theComment.querySelector(".user-details img").src = "/user.jpg"
        theComment.querySelector(".details .username").innerText = "Deleted"
        theComment.querySelector(".details .username").classList.remove('btn-primary')
        theComment.querySelector(".details .author-mark")?.remove()
        theComment.querySelector(".content p").innerText = "Deleted Message"
        theComment.querySelector(".options").remove()
    }
})

socket.on("addLoveIn"+contentID, (commentID, authorImg)=>{//the Auther add love to a comment
    const theComment = document.querySelector("#d"+commentID);
    if(theComment){//check if exist
        if(theComment.querySelector(".author-react"))//check if the user is not the content auther
            theComment.querySelector(".author-react").innerHTML=`
                <span class="btn-danger ps-2 pe-2 pt-1 pb-1 me-3 rounded-pill">
                    <i class="fa-solid text-white fa-heart text-danger"></i>
                    <img class="img-icon mb-1 rounded-circle" style="width:20px; height:20px" src='${authorImg}'>
                </span>
            `
        else{// if the user is the author
            const loveIcon = theComment.querySelector(".fa-heart");
            loveIcon.classList.remove("fa-regular")
            loveIcon.classList.add("fa-solid")
            loveIcon.dataset.values = JSON.stringify({...JSON.parse(loveIcon.dataset.values), addLove: false})
        }
    }
})

socket.on("deleteLoveIn"+contentID, commentID=>{//the Auther delete the love on a comment
    const theComment = document.querySelector("#d"+commentID);
    if(theComment){//check if the user is not the content auther
        if(theComment.querySelector(".author-react"))
            theComment.querySelector(".author-react").innerHTML= ""
        else {// if the user is the author
            const loveIcon = theComment.querySelector(".fa-heart");
            loveIcon.classList.add("fa-regular")
            loveIcon.classList.remove("fa-solid")
            loveIcon.dataset.values = JSON.stringify({...JSON.parse(loveIcon.dataset.values), addLove: true})
        }
    }
})
socket.on("reactIn"+contentID, (commentID, react)=>{//their is new like or dislike on a comment/reply
    const theComment = document.querySelector("#d"+commentID);
    if(theComment){//check if exist
        const likeCounter = theComment.querySelector(".likes-counter");
        const likeIcon = likeCounter.nextElementSibling;
        //react.likes/dislikes values => ( - ) for reduce, ( + ) for incearse, ( 0 ) for nothing
        likeCounter.innerText = parseInt(likeCounter.innerText)+react.like
        if(react.like){// to change the icon, the react.like should be changing frist  
            likeIcon.classList.contains("fa-regular")? 
            likeIcon.classList.replace("fa-regular", "fa-solid"):
            likeIcon.classList.replace("fa-solid", "fa-regular")
        }
        const dislikeCounter = theComment.querySelector(".dislikes-counter");
        const dislikeIcon = dislikeCounter.nextElementSibling;
        dislikeCounter.innerText = parseInt(dislikeCounter.innerText)+react.dislike
        if(react.dislike){// to change the icon, the react.dislike should be changing frist  
            dislikeIcon.classList.contains("fa-regular")?
            dislikeIcon.classList.replace("fa-regular", "fa-solid"):
            dislikeIcon.classList.replace("fa-solid", "fa-regular")
        }
    }
})