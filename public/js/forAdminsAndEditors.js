let onlineUsers = {};

socket.on('connect',()=>{
    socket.emit('makeRoom',me._id) //to can emit specific functions for each user
    socket.emit('changeOnlineReviewers', me._id) // add the user to the online reviewers to get notifications of content to review
})

socket.on("onlineUsers", users=>{//get array of the online users ids
    onlineUsers = users
})
console.log(onlineUsers)
/* all following code is for update the page without need to reload it */

socket.on("newContent", ()=>{console.log("work")// is their is new content to review
    const notifContent = document.querySelector(".notif .notif-content");
    const notifNum = document.querySelector(".notif .icon span");
    const notif={msg: "there is new content to review", href:"/content/review"}
    notifNum.innerHTML = parseInt(notifNum.innerHTML) + 1;
    notifNum.classList.remove("d-none")

    /* if their is no notification, the notification will has one element (that is say that their is no notification) */
    if(notifContent.children.length-1)//if their is old notification
        notifContent.insertAdjacentHTML("afterbegin",`
        <li class="mb-2"> <a class="text-black text-decoration-none" href="${notif.href}">${notif.msg}</a> </li>
        `)
    else{//their is on notification
        notifContent.innerHTML = `
            <li  class="mb-2"> <a class="text-black text-decoration-none" href="${notif.href}">${notif.msg}</a> </li>
        `
    }

    if(document.querySelector(".nav-item .active").innerText == 'Content-Review' && !document.querySelector(".new-content-alert"))
        // if the reviewer is in the contentReview page
        document.querySelector(".container").insertAdjacentHTML("beforebegin",`
            <div class="new-content-alert alert alert-info w-100 text-center"> New content to review, refrech the page to show it </div>
        `)
        
    /* for the following part, if their is notification of new content to review and the user not read the old one that say the same, then their is no need to save the new one in the user session, else save it */
    if(me.notifs.length){//check that the notifications is not emty
        let notifyExist = false
        me.notifs.forEach(async notif=>{
            if(!notif.isReaded && notif.msg == "there is new content to review"){// if the notify already exist
                notifyExist = true;
            }
        })
        if(!notifyExist)// if not exist --> save it in the user session
            fetch("/account/notif/update",{
                method:"post",
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({notif})
            })
    }else // if the notifications is empty 
        fetch("/account/notif/update",{
            method:"post",
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({notif})
        })
            
})
