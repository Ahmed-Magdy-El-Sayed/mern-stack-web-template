
const commentOptions = (contentAuthor, comment, user) =>{
    if(!comment.userID) return ""
    const authorLoved = `
        <span class="author-react">
            ${comment.loved?`
            <span class="btn-danger ps-2 pe-2 pt-1 pb-1 me-3 rounded-pill">
                <i class="fa-solid text-white fa-heart text-danger"></i>
                <img class="mb-1 img-icon rounded-pill" style="width:20px; height:20px" src='${contentAuthor.img}'>
            </span>
            `:""}
        </span>
        `
    if(user){
        const commentIReply = `
        <i class="fa-solid fa-reply fs-5 text-secondary"
        data-values='${JSON.stringify({
            commentID:  comment._id,
            commentOwnerID: comment.userID,
            commentOwnerName: comment.username
        })}'
        onclick="replyComment(this)"></i>
        `
        
        if(String(comment.userID) === String(user._id)){
            return `
            <div class="edit-comment d-none mb-3">
                <textarea class='form-control mt-3 mb-3' name='body' placeholder='Enter comment' rows='2' required> ${comment.body} </textarea>
                <button class='btn btn-sm btn-primary me-3' onclick="saveCommentEdit(this)" value='${JSON.stringify({
                    commentID: comment._id,
                    body: comment.body,
                })}'> Edit </button>
            </div>
            <span  class="likes-counter me-2 text-primary"> ${comment.likes.length} </span>
            <i class="fa-regular fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="refuseAction(this, 'You wrote this comment')"></i>
            <span class="dislikes-counter me-2 text-danger"> ${comment.dislikes.length} </span>
            <i class="fa-regular fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="refuseAction(this, 'You wrote this comment')"></i>
            ${user._id == contentAuthor.id?"":authorLoved}
            <i class="fa-regular fa-pen-to-square fs-5 text-success me-3" onclick="openEditForm(this)"></i>
            <i class="fa-solid fa-trash fs-5 text-danger me-3" onclick="deleteComment(this)" data-values='${JSON.stringify({
                commentID: comment._id,
                commentUserID: comment.userID
            })}'></i>
            ${commentIReply}
            `
        }else{
            if(user.isAdmin || user.isEditor || user.isAuthor){
                return`
                ${String(user._id) == contentAuthor.id?
                    `
                    <span  class="likes-counter me-2 text-primary"> ${comment.likes.length} </span>
                    <i class="fa-regular fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="refuseAction(this, 'The Content Author can only react with love')"></i>
                    
                    <span class="dislikes-counter me-2 text-danger"> ${comment.dislikes.length} </span>
                    <i class="fa-regular fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="refuseAction(this, 'The Content Author can only react with love')"></i>     
                    
                    <i class="${comment.loved?"fa-solid":"fa-regular"} fa-heart me-3 text-danger fs-5" onclick="loveComment(this)" data-values='${JSON.stringify({
                        commentID: comment._id,
                        authorImg: contentAuthor.img,
                        addLove: !comment.loved
                    })}'></i>
                    ` 
                    : `
                    <span  class="likes-counter me-2 text-primary"> ${comment.likes.length} </span>
                    <i class="${comment.likes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="reactTheComment(this)" data-values='${JSON.stringify({
                        commentID: comment._id,
                        react: "like",
                    })}'></i>
                    
                    <span class="dislikes-counter me-2 text-danger"> ${comment.dislikes.length} </span>
                    <i class="${comment.dislikes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="reactTheComment(this)" 
                    data-values='${JSON.stringify({
                        commentID: comment._id,
                        react: "dislike",
                    })}'></i>
                    
                    ${authorLoved}                     
                    `
                }
                ${(!user.isAuthor || (user.isAuthor && String(user._id) == contentAuthor.id))?
                    `<i class="fa-solid fa-trash fs-5 text-danger me-3" onclick="deleteComment(this)" data-values='${JSON.stringify({
                    commentID: comment._id,
                    commentUserID: comment.userID
                    })}'></i>`
                :""}
                ${commentIReply}
                `
            }else
                return `
                <span  class="likes-counter me-2 text-primary"> ${comment.likes.length} </span>
                <i class="${comment.likes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="reactTheComment(this)" data-values='${JSON.stringify({
                    commentID: comment._id,
                    react: "like",
                })}'></i>
                <span class="dislikes-counter me-2 text-danger"> ${comment.dislikes.length} </span>
                <i class="${comment.dislikes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-down fs-5 dislike-comment text-danger me-3" 
                    onclick="reactTheComment(this)" 
                    data-values='${JSON.stringify({
                        commentID: comment._id,
                        react: "dislike",
                    })}'
                ></i>
                ${authorLoved}
                ${commentIReply}
            `
        }
    }else{
        return `
        <span class="likes-counter me-2 text-primary"> ${comment.likes.length} </span>
        <i class="fa-regular fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="refuseAction(this, 'login to react')"></i>
        <span class="dislikes-counter me-2 text-danger"> ${comment.dislikes.length} </span>
        <i class="fa-regular fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="refuseAction(this, 'login to react')"></i>
        ${authorLoved}
        <i class="fa-solid fa-reply fs-5 text-secondary" onclick="refuseAction(this, 'login to comment')"></i>
        `
    }
}

const createCommentHTML = (contentAuthor, comment, user, newAdd)=>{
    return {
        id: comment._id,
        HTMLComment:`
        <div class="comment p-2 w-75" id= 'd${comment._id}'>
            <div class="user-details d-flex gap-2 align-items-center">
                <img class="img-icon rounded-pill" src='${comment.userImg? comment.userImg : "/user.jpg"}'>
                <div class="details">
                    ${
                        comment.userIsAuthz?
                            `
                            <span class="username btn-primary rounded p-1 ps-2 pe-2">
                                <h5 class="d-inline m-0">${user? String(user._id)==comment.userID?"Me":comment.username:comment.username}</h5>
                                <i class="fa-solid fa-check ms-3"></i>
                            </span>
                            ${contentAuthor.id == comment.userID?'<p class="author-mark m-0 ms-2 d-inline text-secondary fw-bold"> "The Author" </p>':""}
                            ` 
                        :`<h5 class="username m-0"> ${user? String(user._id)==comment.userID?"Me":comment.username:comment.username} </h5>`
                    }
                    <p class="comment-time m-0" data-timestamp='${comment.timestamp}'></p>
                    ${newAdd? `<span class="btn-primary w-auto ps-2 pe-2 rounded-pill">New</span>`: ""}
                </div>
            </div>
            <div class="user-comment mt-3">
                <div class="content">
                    <p class="bg-light p-3 m-0 border rounded" style="white-space: pre-wrap;">${comment.body}</p>
                </div>
                <div class="options mt-2">
                    ${commentOptions(contentAuthor, comment, user)}
                </div>
            </div>
        </div>
        ${comment.repliesNum != "0"?
            `<div class="comment-replies w-75 ms-2 mb-3">
                <div class="collapse replies ps-3 pt-3 pb-3 border-start border-2 border-primary" id='replies${comment._id}'>
                    <div class="spinner-border text-primary ms-3" role="status">
                        <span class="visually-hidden"> Loading... </span>
                    </div>
                </div>
                <a class="mb-3 text-decoration-none" data-bs-toggle="collapse"
                    href="#replies${comment._id}" 
                    onclick='getReplies(this, "${comment._id}", "")'
                    data-replies-num= "${comment.repliesNum}"
                > show (${comment.repliesNum}) replies </a>
            </div>
            `
        : ""}
        `
    }
}

const replyOptions = (contentAuthor, commentID, reply, user) =>{
    if(!reply.userID) return ""
    const authorLoved = `
        <span class="author-react">
            ${reply.loved?`
            <span class="btn-danger ps-2 pe-2 pt-1 pb-1 me-3 rounded-pill">
                <i class="fa-solid text-white fa-heart text-danger"></i>
                <img class="mb-1 img-icon rounded-circle" style="width:20px; height:20px" src='${contentAuthor.img}'>
            </span>
            `:""}
        </span>
        `
    if(user){
        const replyI = `
        <i class="fa-solid fa-reply fs-5 text-secondary"
        data-values='${JSON.stringify({
            commentID:  commentID,
            replyID:  reply._id,
            replyOwnerID:  reply.userID,
            replyOwnerName:  reply.username,
        })}'
        onclick="replyComment(this)"></i>
        `
        if(String(reply.userID) === String(user._id)){
            return `
            <div class="edit-comment d-none mb-3">
                <textarea class='form-control mt-3 mb-3' name='body' placeholder='Enter comment' rows='2' required> ${reply.body} </textarea>
                <button class='btn btn-sm btn-primary me-3' onclick="saveReplyEdit(this)" value='${JSON.stringify({
                    commentID: commentID,
                    replyID: reply._id,
                    body: reply.body,
                })}'> Edit </button>
            </div>
            <span  class="likes-counter me-2 text-primary"> ${reply.likes.length} </span>
            <i class="fa-regular fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="refuseAction(this, 'You wrote this reply')"></i>
            <span class="dislikes-counter me-2 text-danger"> ${reply.dislikes.length} </span>
            <i class="fa-regular fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="refuseAction(this, 'You wrote this reply')"></i>
            ${user._id == contentAuthor.id?"":authorLoved}
            <i class="fa-regular fa-pen-to-square fs-5 text-success me-3" onclick="openEditForm(this)"></i>
            <i class="fa-solid fa-trash fs-5 text-danger me-3" onclick="deleteReply(this)" data-values='${JSON.stringify({
                commentID: commentID,
                replyID: reply._id,
                replyUserID: reply.userID
            })}'></i>
            ${replyI}
            `
        }else{
            if(user.isAdmin || user.isEditor || user.isAuthor){
                return`
                ${String(user._id) == contentAuthor.id?
                    `
                    <span  class="likes-counter me-2 text-primary"> ${reply.likes.length} </span>
                    <i class="fa-regular fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="refuseAction(this, 'The Content Author can only react with love')"></i>
                    
                    <span class="dislikes-counter me-2 text-danger"> ${reply.dislikes.length} </span>
                    <i class="fa-regular fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="refuseAction(this, 'The Content Author can only react with love')"></i>
                    
                    <i class="${reply.loved?"fa-solid":"fa-regular"} fa-heart text-danger me-3 fs-5" onclick="loveComment(this)" data-values='${JSON.stringify({
                        commentID: commentID,
                        replyID: reply._id,
                        authorImg: contentAuthor.img,
                        addLove: !reply.loved
                    })}'></i>` 
                : `
                    <span  class="likes-counter me-2 text-primary"> ${reply.likes.length} </span>
                    <i class="${reply.likes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="reactTheComment(this)" data-values='${JSON.stringify({
                        commentID: commentID,
                        replyID: reply._id,
                        react: "like",
                    })}'></i>
                    
                    <span class="dislikes-counter me-2 text-danger"> ${reply.dislikes.length} </span>
                    <i class="${reply.dislikes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="reactTheComment(this)" 
                    data-values='${JSON.stringify({
                        commentID: commentID,
                        replyID: reply._id,
                        react: "dislike",
                    })}'></i>
                    
                    ${authorLoved}
                    `
                }
                ${(!user.isAuthor || (user.isAuthor && String(user._id) == contentAuthor.id))?
                    `<i class="fa-solid fa-trash fs-5 text-danger me-3" onclick="deleteReply(this)" data-values='${JSON.stringify({
                        commentID: commentID,
                        replyID: reply._id,
                        replyUserID: reply.userID
                    })}'></i>`
                :""}
                ${replyI}
                `
            }else
                return `
                <span  class="likes-counter me-2 text-primary"> ${reply.likes.length} </span>
                <i class="${reply.likes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="reactTheComment(this)" data-values='${JSON.stringify({
                    commentID: commentID,
                    replyID: reply._id,
                    react: "like",
                })}'></i>
                <span class="dislikes-counter me-2 text-danger"> ${reply.dislikes.length} </span>
                <i class="${reply.dislikes.includes(String(user._id))? "fa-solid":"fa-regular"} fa-thumbs-down fs-5 dislike-comment text-danger me-3" 
                    onclick="reactTheComment(this)" 
                    data-values='${JSON.stringify({
                        commentID: commentID,
                        replyID: reply._id,
                        react: "dislike",
                    })}'
                ></i>
                ${authorLoved}
                ${replyI}
            `
        }
    }else{
        return `
        <span class="likes-counter me-2 text-primary"> ${reply.likes.length} </span>
        <i class="fa-regular fa-thumbs-up fs-5 like-comment text-primary me-3" onclick="refuseAction(this, 'login to react')"></i>
        <span class="dislikes-counter me-2 text-danger"> ${reply.dislikes.length} </span>
        <i class="fa-regular fa-thumbs-down fs-5 dislike-comment text-danger me-3" onclick="refuseAction(this, 'login to react')"></i>
        ${authorLoved}
        <i class="fa-solid fa-reply fs-5 text-secondary" onclick="refuseAction(this, 'login to reply')"></i>
        `
    }
}

const createReplyHTML = (contentAuthor, comment, user, newAdd)=>{
    // commnet.replies here contain single reply object. To know why this see the comment in getReplies() in comment.controller
    const reply = comment.replies;
    return {
        id: reply._id,
        replyToID: reply.replyToID,
        HTMLReply:`
        <div class="reply p-2" id="d${reply._id}">
            <div class="user-details d-flex gap-2 align-items-center">
                <img class="img-icon rounded-pill" src='${reply.userImg? reply.userImg : "/user.jpg"}'>
                <div class="details">
                    ${
                        reply.userIsAuthz?
                            `
                            <span class="username btn-primary rounded p-1 ps-2 pe-2"> 
                                <h6 class="d-inline m-0"> ${user? String(user._id)==reply.userID?"Me":reply.username:reply.username} </h6>
                                <i class="fa-solid fa-check ms-1"></i>
                            </span>
                            ${contentAuthor.id == reply.userID?'<p class="author-mark m-0 ms-2 d-inline text-secondary fw-bold"> "The Author" </p>':""}
                            `
                        :`<h6 class="username d-inline m-0"> ${user? String(user._id)==reply.userID?"Me":reply.username:reply.username} </h6>`
                    }
                    <i class="fa-solid fa-angles-right"></i>
                    <a class="text-decoration-none" href="#d${reply.replyToID}" onclick="getRepliedTo(this)")> ${user? String(user._id)==reply.replyToUserID?"Me":reply.replyToUserName : reply.replyToUserName}</a>
                    <p class="comment-time m-0" data-timestamp="${reply.timestamp}"></p>
                    ${newAdd? `<span class="btn-primary w-auto ps-2 pe-2 rounded-pill">New</span>`: ""}
                </div>
            </div>
            <div class="user-comment mt-3">
                <div class="content">
                    <p class="bg-light p-3 m-0 border rounded" style="white-space: pre-wrap;">${reply.body}</p>
                </div>
                <div class="options mt-2">
                    ${replyOptions(contentAuthor, comment._id, reply, user)}
                </div>
            </div>
        </div>
        ${reply.repliesNum != "0"?`
            <div class="comment-replies ms-2 mb-3">
                <div class="collapse replies ps-3 pt-3 pb-3 border-start border-2 border-secondary" id="replies${reply._id}">
                    <div class="spinner-border text-primary ms-3" role="status">
                        <span class="visually-hidden"> Loading... </span>
                    </div>
                </div>
                <a class="mb-3 text-decoration-none" data-bs-toggle="collapse"
                    href="#replies${reply._id}" 
                    onclick='getReplies(this, "${comment._id}", "${reply._id}")'
                    data-replies-num= "${reply.repliesNum}"
                > show (${reply.repliesNum}) replies </a>
            </div>
        `:""}
        `
    }
}

module.exports={
    createCommentHTML,
    createReplyHTML
}