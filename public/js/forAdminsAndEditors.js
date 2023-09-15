let onlineUsers = {};

socket.on('connect',()=>{
    socket.emit('makeRoom',me._id) //to can emit specific functions for each user
    socket.emit('changeOnlineReviewers', me._id) // add the user to the online reviewers to get notifications of content to review
})

socket.on("onlineUsers", users=>{//get array of the online users ids
    onlineUsers = users
})

/* all following code is for update the page without need to reload it */

socket.on("newContent", ()=>{// is their is new content to review
    const notifContent = document.querySelector(".notif .notif-content");
    const notifNum = document.querySelector(".notif .icon span");
    const notif={msg: "there is new content to review", href:"/content/review", num: 1, isReaded: false}
    notifNum.innerHTML = parseInt(notifNum.innerHTML) + 1;
    notifNum.classList.remove("d-none")

    if(document.querySelector(".nav-item .active").innerText == 'Content-Review' && !document.querySelector(".new-content-alert"))
        // if the reviewer is in the contentReview page
        document.querySelector(".container").insertAdjacentHTML("beforebegin",`
            <div class="new-content-alert alert alert-info w-100 text-center"> New content to review, refrech the page to show it </div>
        `)
        
    /* for the following part, if their is notification of new content to review and the user not read the notif of previous new content, then increase the number of this notif without save new one in the user session, else add new notif and save it */
    let notifyExist = false
    // check that this notification exist
    me.notifs = me.notifs.map(obj=>{
        if(!obj.isReaded && obj.msg == "there is new content to review"){// if the notify already exist
            obj.num++
            notifyExist = true;
        }
        return obj
    })
    if(notifyExist && notifContent.classList.contains("show")){//if exist and the user open the notifications --> update the notifications
        notifContent.innerHTML = ""
        me.notifs.forEach(notif=>{
            notifContent.innerHTML += `
            <li class="mb-2">
                <a class="text-decoration-none ${notif.isReaded? "text-secondary" : "text-black"}" href="${notif.href}"> ${notif.msg} </a>
                ${!notif.isReaded?
                    `<span class="rounded-circle bg-primary text-white p-1 ps-2 pe-2 fs-6"> ${notif.num}</span>` :""
                }
            </li>`
            })    
        notifContent.innerHTML += `
            <a class="text-primary text-decoration-none" onclick="clearNotif(this)"> Clear Notifications </a>
        `
    }else if(!notifyExist) {// if not exist --> add the new notification and save it in the user notifications session
        me.notifs.unshift(notif)
        if(notifContent.classList.contains("show"))
            notifContent.insertAdjacentHTML("afterbegin",`
            <li class="mb-2"> 
                <a class="text-black text-decoration-none" href="${notif.href}">${notif.msg}</a> 
                <span class="rounded-circle bg-primary text-white p-1 ps-2 pe-2 fs-6"> ${notif.num}</span>
            </li>
        `)
    }
    fetch("/account/notif/update",{
        method:"post",
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({notifs: me.notifs})
    })
})
