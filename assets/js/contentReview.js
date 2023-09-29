socket.on("hiddeContent", contentID=>{
    document.getElementById(contentID)?.remove()
    if(!document.querySelector(".to-select-content").children.length)
        document.querySelector(".to-select-content").innerHTML=
        "<h3 class='alert alert-secondary w-100 text-center'>No content waiting to review</h3>"
})

socket.on("showContent", content=>{
    if(document.querySelector(".to-select-content .alert"))
        document.querySelector(".to-select-content").innerHTML = content
    else
        document.querySelector(".to-select-content").innerHTML += content
})

const select = (e, contentID)=>{
    e.stopPropagation()
    fetch("/content/select",{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contentID})
    }).then(res=>{//update the DOM
        if(res.status === 201){
            const theContent = document.getElementById(contentID);
            theContent.remove()
            if(!document.querySelector(".to-select-content").children.length)
                document.querySelector(".to-select-content").innerHTML =
                "<h3 class='alert alert-secondary w-100 text-center'>No content waiting to review</h3>"

            const selectBtn = theContent.querySelector(".select")
            selectBtn.classList.replace("select","unselect")
            selectBtn.classList.replace("btn-outline-primary","btn-outline-danger")
            selectBtn.setAttribute("onclick",`unselect(event, "${contentID}")`)
            selectBtn.innerHTML = "Unselect"

            if(document.querySelector(".selected-content .alert"))
                document.querySelector(".selected-content").firstChild.remove()
            document.querySelector(".selected-content").appendChild(theContent)

            socket.emit("hiddeContent", contentID)// hidde content from other online reviewers 
        }
        else throw res.body;
    }).catch(err=>{
        console.error(err)
    })
}

const unselect = (e, contentID)=>{
    e.stopPropagation()
    fetch("/content/unselect",{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({contentID})
    }).then(res=>{//update the DOM
        if(res.status === 201){
            const theContent = document.getElementById(contentID);
            theContent.remove()
            if(!document.querySelector(".selected-content").children.length)
                document.querySelector(".selected-content").innerHTML =
                "<h3 class='alert alert-secondary w-100 text-center'>No content selected to review</h3>"

            const selectBtn = theContent.querySelector(".unselect")
            selectBtn.classList.replace("unselect","select")
            selectBtn.classList.replace("btn-outline-danger","btn-outline-primary")
            selectBtn.setAttribute("onclick",`select(event, "${contentID}")`)
            selectBtn.innerHTML = "Select"
            if(document.querySelector(".to-select-content .alert"))
                document.querySelector(".to-select-content").firstChild.remove()
            document.querySelector(".to-select-content").appendChild(theContent)

            socket.emit("showContent", theContent.outerHTML)// to allow other online reviewers to select it
        }
        else throw res.body;
    }).catch(err=>{
        console.error(err)
    })
}