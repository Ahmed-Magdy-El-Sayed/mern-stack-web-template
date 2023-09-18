
document.querySelector("form.write-comment").onsubmit = e=>{//onclick on send button in add comment section
    e.preventDefault();
    const form = e.target;
    const submitter = e.submitter;
    const formData = new FormData(form, submitter);
    const data = new URLSearchParams();
    for (const [key, value] of formData) {
        data.append(key, value);
    }
    
    fetch(form.action,{
        method:'post',
        body: data
    }).then(res=>{
        if(res.status === 201) return res.json() 
        else throw res.body;
    }).then(content=>{
        form.body.value = null;
        socket.emit("addComment", content)
    }).catch( err=>{
        console.error(err)
    })
}

let editOpened = false; // to handle opening edit form while the form opened for another comment/reply
const openEditForm= target=>{//open edit form by click on pen icon in the buttom of a comment/reply by the comment/reply owner
    const comment = target.parentElement.parentElement.querySelector(".content");
    const editForm = target.parentElement.querySelector(".edit-comment");
    const theSameEle = document.querySelector(".edit-comment:not(.d-none)") == editForm
    if(editOpened && theSameEle){//if the form opened and the comment/reply that it opened for is the same comment/reply to be opened it for 
        editForm.classList.add("d-none")
        comment.classList.remove("d-none")
        editOpened = false;
    }else if(editOpened){//the form opened and the comment/reply that it opened for is not the same comment/reply to be opened it for
        document.querySelector(".edit-comment:not(.d-none)").classList.add("d-none")
        document.querySelector(".user-comment .content.d-none").classList.remove("d-none")
        editForm.classList.remove("d-none")
        comment.classList.add("d-none")
        editOpened = true;
    }else{// the form not opened
        editForm.classList.remove("d-none")
        comment.classList.add("d-none")
        editOpened = true;
    }
}

const saveCommentEdit = target=>{//onclick on save button in the edit comment form after open it from openEditForm()
    let data = JSON.parse(target.value);
    data.contentID = contentID;
    const body = target.parentElement.children.body.value;
    if(data.body !== body){
        data.body = body
        fetch('/content/comments/edit',{
            method:'post',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(data)
        }).then(res=>{
            if(res.status === 201) socket.emit("updateComment", data)
            else throw res.body;
        }).catch(err=>{
            console.error(err)
        })
    }
};

const deleteComment = target =>{//onclick on trash icon at the bottom of a comment by comment owner, admin, editor, this content author
    const data = JSON.parse(target.dataset.values);
    data.contentID = contentID;
    fetch('/content/comments/delete',{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
    }).then(res=>{
        if(res.status === 201) socket.emit("deleteComment", data)
        else throw res.body;
    }).catch(err=>{
        console.error(err)
    })
}
let replyFormOpened={}
const replyComment = target =>{//onclick on reply icon in the buttom of comment/reply elements by any logged in users except admins, editors, and authors
    const data = JSON.parse(target.dataset.values);
    const replyOnID = data.commentID?data.commentID:data.replyID;
    if(!replyFormOpened[replyOnID]){
        replyFormOpened[replyOnID]=true
        data.contentID = contentID;
        target.parentElement.innerHTML += `
        <form class='reply-comment m-0 mt-2 alert alert-secondary' id="${replyOnID}" method='post' action='/content/replies/add' onsubmit="addReply(event)"">
            <span class="btn btn-close me-3 position-absolute end-0" onclick="closeReply(this)"></span>
            <div class="user-details mb-2 d-flex gap-2 align-items-center">
                <img class="img-icon rounded-circle" src='${me.img}'>
                ${
                    me.isAdmin || me.isEditor || me.isAuthor?
                        `<span class="username btn-primary rounded ps-2 pe-2"> 
                            <h6 class="d-inline m-0">${me.name}</h6>
                            <i class="fa-solid fa-check ms-1"></i>
                        </span>`
                    :`<h6 class="m-0">${me.name}</h6>`
                }
                <i class="fa-solid fa-angles-right"></i> 
                <a class="text-decoration-none" href="#d${replyOnID}" onclick="getRepliedTo(this)")> ${data.commentOwnerName? data.commentOwnerName : data.replyOwnerName}</a></p>
            </div>
            <textarea class='form-control mb-3' rows="5" name='body' placeholder='Enter comment' required></textarea>
            <button class='btn btn-primary btn-sm' type='submit' name='info' value=${JSON.stringify(data)}> Reply </button>
        </form>
        `
    }
} 
const closeReply = target =>{//onclick on close button in the form in the previous function
    replyFormOpened[target.parentElement.id] = false
    target.parentElement.remove()
}

const addReply = e=>{//onclick on reply button in the add reply form after 
    e.preventDefault();
    const form = e.target;
    const submitter = e.submitter
    const formData = new FormData(form, submitter)
    const data = new URLSearchParams()
    for (const [key, value] of formData) {
        data.append(key, value)
    }
    fetch(form.action,{
        method:'post',
        body: data
    }).then(res=>{
        if(res.status === 201) return res.json() 
        else throw res.body;
    }).then(content=>{
        const info = JSON.parse(data.get("info"))
        const userIDToNotif= info.replyOwnerID? info.replyOwnerID : info.commentOwnerID
        if(userIDToNotif != String(me._id))
            socket.emit("notifyUser", userIDToNotif, {msg:`There is new reply on your comment in the content ${content.name}`, href:'/content/id/'+content._id})
        socket.emit("addReply", content)
    }).catch(err=>{
        console.error(err)
    })
    replyFormOpened[form.id]= false
    form.remove()
}

const saveReplyEdit = target=>{//onclick on save button in the edit reply form after open it from openEditForm()
    let data = JSON.parse(target.value);
    const body = target.parentElement.children.body.value;
    data.contentID = contentID;
    if(data.body !== body){
        data.body = body
        fetch('/content/replies/edit',{
            method:'post',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(data)
        }).then(res=>{
            if(res.status === 201) socket.emit("updateReply", data)
            else throw res.body;
        }).catch(err=>{
            console.error(err)
        })
    }
};

const deleteReply = target =>{//onclick on trash icon at the bottom of a reply by reply owner, admin, editor, this content author
    const data = JSON.parse(target.dataset.values);
    data.contentID = contentID;
    fetch('/content/replies/delete',{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
    }).then(res=>{
        if(res.status === 201) socket.emit("deleteReply", data)
        else throw res.body;
    }).catch(err=>{
        console.error(err)
    })
}

let reactClicked = false; // prevend run the function while it is already run, so not react the comment/reply twice
const reactTheComment = target=>{// send the comment/reply like and dislike react
    if(reactClicked) return null;
    reactClicked = true;
    const data = JSON.parse(target.dataset.values)
    data.contentID = contentID
    const fetchURL = data.replyID ? '/content/replies/react' : '/content/comments/react'
    fetch(fetchURL,{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
    }).then(async res=>{
        if(res.status === 201){
            socket.emit('react', data, await res.json())
        }else throw res.body;
    }).catch(err=>{
        console.error(err)
    }).finally(()=>{
        reactClicked = false;
    })
}

const loveComment = target=>{// send the comment/reply love react that applied by the content author only
    const data = JSON.parse(target.dataset.values);
    const authorImg = data.authorImg;
    delete data.authorImg
    data.contentID = contentID;
    const fetchURL = data.replyID ? '/content/replies/love' : '/content/comments/love'
    fetch(fetchURL,{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
    }).then(res=>{
        if(res.status === 201) data.addLove?socket.emit("addLove", data, authorImg):socket.emit("deleteLove", data)
        else throw res.body;
    }).catch(err=>{
        console.error(err)
    })
}


