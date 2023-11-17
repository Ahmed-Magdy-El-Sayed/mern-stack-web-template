const entries = performance.getEntriesByType("navigation");
if(entries[0].type == "back_forward")
    window.location.reload()

const contentID = document.querySelector(".content-id").id
document.querySelector(".content-id").remove()
const contentAuthor = JSON.parse(document.querySelector(".content-author").dataset.author)
document.querySelector(".content-author").remove()
const contentName = document.querySelector(".content-name").innerHTML 

const sendApproval = target=>{
    if(onlineUsers[contentAuthor.id]){ // if user is online confirm him directly
        socket.emit("sendApproval", contentAuthor.id,target.value, contentName)
    }
    target.type="submit";
    target.onclick = ""
    target.click();
}

const sendRejection = target=>{
    const reason = target.parentElement.children.reason.value
    if(onlineUsers[contentAuthor.id]){ // if user is online confirm him directly
        socket.emit("sendRejection", contentAuthor.id, target.value, contentName, reason)
    }
    target.type="submit";
    target.onclick = ""
    target.click();
}
