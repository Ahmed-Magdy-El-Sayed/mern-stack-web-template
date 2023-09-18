const user = document.querySelector(".user").dataset.value
const me = user? JSON.parse(user) : null
delete user

document.querySelector(".user").remove()

if(me && !me.isAdmine && !me.isEditor)
    socket.on('connect',()=>{
        socket.emit('makeRoom',me._id)//to can emit specific functions for each user
        socket.emit('changeOnlineUsers', me._id)// add the user to the online users to get global notifications
    })

/* all following code is for update the page without need to reload it */

/* if their is no notification, the notification will has one element (that is say that their is no notification) */
const applyTheNotify = notif=>{//appear the new notification to the user
    const notifNum = document.querySelector(".notif .icon span");
    const content = document.querySelector(".notif .notif-content");

    me.notifs.unshift(notif)

    notifNum.innerHTML = parseInt(notifNum.innerHTML) + 1;
    notifNum.classList.remove("d-none")// appear the new notification icon (that contain the number of new notifications)
    fetch("/account/notif/update",{//save the notification in user session
        method:"post",
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({notifs: me.notifs})
    })

    if(content.classList.contains("show")){
        if(content.children.length-1)//if there is old notification
            content.insertAdjacentHTML("afterbegin",`
            <li class="mb-2"> <a class="text-dark text-decoration-none" href="${notif.href}">${notif.msg}</a> </li>
            `)
        else{//their is on notification
            content.innerHTML = `
            <li class="mb-2"> <a class="text-dark text-decoration-none" href="${notif.href}">${notif.msg}</a> </li>
            `
        }
    }
}

socket.on("noify", applyTheNotify)

socket.on("approveContent", (contentID, contentName)=>{//notify the user that his content is approved
    const notif = {msg:"The "+contentName+" content was approved and added to the website content",
        href:"/content/my-content",
        num:1
    }
    
    applyTheNotify(notif)
    
    const theContentInReview = document.getElementById(contentID);// the content that approved
    if(theContentInReview){//check that the user is in the myContent page 
        document.querySelector(".reviewed .reviewed-content").innerHTML += `
        <div class="card text-center" style="width: 18rem; cursor:pointer" onclick="openContent('${contentID}')">
            <div class="card-body">
                <h3 class="card-text content-name text-primary"> ${contentName} </h3>
                <p> comments: 0 </p>
            </div>
        </div>
        `
        document.querySelector(".reviewed .reviewed-content alert")?.remove()
        theContentInReview.remove()
    }
})

socket.on("rejectContent", (contentID, contentName, reason)=>{//notify the user that his content is rejected
    const notif = {msg:`The ${contentName} content was rejected for: "${reason}"`,
        href:"/content/my-content",
        num:1
    }

    applyTheNotify(notif)

    const theContentInReview = document.getElementById(contentID);
    if(theContentInReview){//check that the user is in the myContent page 
        theContentInReview.innerHTML = `
        <div class="alert alert-secondary text-center w-100"> the content "${contentName}" is rejected</div>
        `
    }
})

socket.on('warning',reason=>{//show the warning from the 
    const warning = document.querySelector(".modal.warning")
    const warningTextEle = document.querySelector(".modal.warning .modal-body h6")
    if(warning?.classList.contains("show")){//if warning modal is opened
        warningTextEle.innerHTML += "\n"+(warningTextEle.innerHTML.split("/n").length+1)+". "+reason
    }else{// if warning modal exist but not opened
        warningTextEle.innerHTML = "1. "+reason
        document.body.innerHTML+=`<button hidden data-bs-toggle="modal" data-bs-target="#adminWarning"></button>`
        const traeger = document.querySelector("button[data-bs-target='#adminWarning']");
        traeger.click()
        traeger.remove()
    }
    document.querySelector("#adminWarning .modal-footer .btn").onclick=()=>{
        warningTextEle.innerHTML = "";
    }
})

const warningTraeger = document.querySelector("button[data-bs-target='#adminWarning']");
if(warningTraeger){ // if their is warning while the user was logged out
    warningTraeger.click()
    warningTraeger.remove()
}

socket.on('changesInAccount', ()=>{// for changes that need to make the user logout (like a ban or the account is deleted)
    window.location.href='/account/logout'
})

const changeProfile= e=>{//function for control inputs fields in update profile form
    const saveBtn = document.querySelector(".modal-footer button")
    if(e.target.value){//if the input not empty
        if(e.target.type == "password"){
            const changePassInputs = document.querySelectorAll('.modal-body input[type="password"]');//get two passwords fields (the new, and the repeat)
            if(e.target == changePassInputs[1])
                changePassInputs[2].pattern = changePassInputs[1].value; // force the two password to be matched
            changePassInputs.forEach(input=>{
                input.setAttribute('required',''); // make the two fields required
            })
        }else{//for the input fields that not password
            e.target.setAttribute('required','')
        }
        saveBtn.disabled = false
    }else{//if the input empty, undo the changes made above
        if(e.target.type == "password"){
            const changePassInputs = document.querySelectorAll('.modal-body input[type="password"]');
            if(e.target == changePassInputs[1])
                changePassInputs[2].pattern = changePassInputs[1].value;
            changePassInputs.forEach(input=>{input.removeAttribute('required')}) 
        }else{
            e.target.removeAttribute('required')
        }
        saveBtn.disabled = true
    }
}
if(document.querySelector(".modal-body .faild-edit")){ //for update profile modal, if the edit is failed, then reopen the modal
    document.querySelector(".edit-profile-toggler").click()
}


const clearNotif= target=>{ // when user click on clear notifications in the notifications section
    me.notifs = []
    fetch("/account/notif/clear", {method:"post"}).then(res=>{
        if(res.status === 201) target.parentElement.innerHTML = "<p> No notifications </p>"
        else throw res.body;
    }).catch(err=>{
        console.error(err)
    })
}
let notifOpened = false
const readNotif= target=>{ // when user open the notifications
    const notifContent = document.querySelector(".notif .notif-content")
    notifOpened = !notifOpened;
    if(notifOpened && me.notifs.length){
        notifContent.innerHTML = ""
        me.notifs.forEach(notif=>{
            notifContent.innerHTML += `
            <li class="mb-2">
                <a class="text-decoration-none ${notif.isReaded? "text-secondary" : "text-black"}" href="${notif.href}"> ${notif.msg} </a>
                ${!notif.isReaded?
                    `<span class="rounded-circle bg-primary text-white p-1 ps-2 pe-2 fs-6"> ${notif.num? notif.num : 1}</span>` :""
                }
            </li>`
            })    
        notifContent.innerHTML += `
            <a class="text-primary text-decoration-none" onclick="clearNotif(this)"> Clear Notifications </a>
        `
        if(parseInt(target.firstChild.innerText)){//if there is new notification --> mark the notifications readed in te session and remove the badge on the notif icon
            fetch("/account/notif/read", {method:"post"}).then(res=>{
                if(res.status === 201){
                    target.firstChild.classList.add("d-none")
                    target.firstChild.innerHTML="0"
                } 
                else throw res.body;
            }).catch(err=>{
                console.error(err)
            })
        }
    }else if(me.notifs.length){
        me.notifs=me.notifs.map(notif=>{notif.isReaded=true; return notif});
    }
}

const logout = ()=>{window.location.href='/account/logout'}// when user click on logout button

const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl)) // to allow bootstrap popover