const contentAuthor = JSON.parse(document.querySelector(".content-author").dataset.author)
document.querySelector(".content-author").remove()

const calcPassedTime = timestamp =>{// calc the time that passed from post the comment
    const commentDate = new Date(timestamp);

    const commentDateArray = commentDate.toLocaleDateString("en-GB").split("/").map(item=>parseInt(item));
    const nowDateArray = new Date().toLocaleDateString("en-GB").split("/").map(item=>parseInt(item));

    let yearsNum = 1;// the number of the years that passed since the comment date
    while(true){
        let reachToTheDate = new Date(new Date(commentDate).setFullYear(commentDateArray[2] + yearsNum)).getTime() < new Date().getTime()
        if(reachToTheDate){
            yearsNum++
        }else break
    }
    yearsNum--

    let monthsNum = 1;// the number of the months that passed since the comment date
    if(yearsNum == 0){
        while(true){
            let reachToTheDate = new Date(new Date(commentDate).setMonth( (commentDateArray[1]-1) + monthsNum)).getTime() < new Date().getTime()
            if(reachToTheDate){
                monthsNum++
            }else break
        }
    }
    monthsNum--

    const passedMS = new Date().getTime() - timestamp

    const passedYears = yearsNum;
    const passedMonths = monthsNum;
    const passedDays = Math.floor(passedMS / 1000 / 60 / 60 / 24)

    const passedHours = Math.floor(passedMS / 1000 / 60 / 60)
    const passedMins = Math.floor(passedMS / 1000 / 60)

    let nextInc; // the duration that after it the comment passed time will increase - if it more than 1h the setTimeout will not be created
    if(passedYears){
        nextInc = new Date(new Date(commentDate).setFullYear(commentDateArray[2] + yearsNum +1)).getTime() - new Date().getTime()
        const daysToNextInc = Math.round(nextInc/1000/60/60/24); // reminded days
        if(passedYears == 1) return {
            passedTime:"since 1 Year" + (daysToNextInc < 182? " and half":""), 
            nextInc: nextInc < 3*60*60*1000? daysToNextInc < 182? nextInc: daysToNextInc*60*60*1000 : null
        }
        return {
            passedTime: "since "+passedYears + " Years"+ (daysToNextInc < 182? " and half":""), 
            nextInc: nextInc < 3*60*60*1000? daysToNextInc < 182? nextInc: daysToNextInc*60*60*1000 : null
        }
    }else if(passedMonths){
        nextInc = new Date(new Date(commentDate).setMonth( (commentDateArray[1]) + monthsNum)).getTime() - new Date().getTime()
        const daysToNextInc = Math.round(nextInc/1000/60/60/24); // reminded days
        if(passedMonths == 1) return {
            passedTime:"since 1 Month"+ (daysToNextInc < 15? " and half":""), 
            nextInc: nextInc < 3*60*60*1000? daysToNextInc < 15? nextInc: daysToNextInc*60*60*1000 : null
        }
        return {
            passedTime: "since "+passedMonths + " Months"+ (daysToNextInc < 15? " and half":""), 
            nextInc: nextInc < 3*60*60*1000? daysToNextInc < 15? nextInc: daysToNextInc*60*60*1000 : null
        }
    }else if(passedDays){
        const theReminded = parseFloat(((passedMS / 1000 / 60 / 60 / 24)%1).toFixed(1))// if passed days is 3.5, then theReminded is 0.5
        nextInc = 24*60*60*1000 - Math.floor(theReminded *24*60*60*1000)
        // nextInc = new Date(commentDate.setFullYear(nowDateArray[2],nowDateArray[1]-1,nowDateArray[0]+1)).getTime() - new Date().getTime()
        if(passedDays >= 7) return {
            passedTime:"since "+(Math.floor(passedDays/7) == 1? 
                "one week"+ ((passedDays/7)%1>0.5?" and half":"") : 
                Math.floor(passedDays/7) + " Weeks"+ ((passedDays/7)%1>0.5?" and half":"")), 
            nextInc: nextInc < 3*60*60*1000? (passedDays/7)%1>0.5? nextInc:(1-((passedDays/7)%1))*24*60*60*1000 : null
        }
        else if(passedDays == 1) return {
            passedTime:"since 1 Day" + (theReminded >= 0.5? " and half" : ""), 
            nextInc: nextInc < 3*60*60*1000? theReminded >= 0.5? nextInc:(1-theReminded)*24*60*60*1000 : null
        }
        return {
            passedTime: "since "+passedDays + " Days" + (theReminded >= 0.5? " and half" : ""), 
            nextInc: nextInc < 3*60*60*1000? theReminded >= 0.5? nextInc:(1-theReminded)*24*60*60*1000 : null
        }
    }else if(passedHours){
        const theReminded = parseFloat(((passedMS / 1000 / 60 / 60)%1).toFixed(1))
        nextInc = 60*60*1000 - Math.floor(theReminded *60*60*1000)
        // nextInc = new Date(new Date().setHours(nowTimeArray[0]+1, commentTimeArray[1], commentTimeArray[2])).getTime() - new Date().getTime()
        console.log(new Date(new Date().getTime()+nextInc).toLocaleTimeString("en"))
        return{
            passedTime: "since "+passedHours + " hr" + (theReminded >= 0.5? " and half" : ""), 
            nextInc: theReminded>=0.5? nextInc : (1-theReminded)*60*60*1000
        }
    }else if(passedMins){
        const theReminded = parseFloat(((passedMS / 1000 / 60 )%1).toFixed(1))
        nextInc = 60*1000 - Math.floor(theReminded *60*1000)
        // nextInc = new Date(new Date().setMinutes(nowTimeArray[1]+1, commentTimeArray[2])).getTime() - new Date().getTime()
        console.log(new Date(new Date().getTime()+nextInc).toLocaleTimeString("en"),theReminded  )
        return {
            passedTime:"since "+passedMins + " min", 
            nextInc 
        }
    }else{
        const theReminded = parseFloat(((passedMS / 1000 / 60)%1).toFixed(1))
        nextInc = 60*1000 - Math.floor(theReminded *60*1000)
        // nextInc = new Date(new Date().setMinutes(nowTimeArray[1]+1, commentTimeArray[2])).getTime() - new Date().getTime()
        // nextInc = new Date(new Date().setSeconds(nowTimeArray[2]+1)).getTime() - new Date().getTime()
        return {
            passedTime: "since Now", 
            nextInc
        }
    }
}


document.querySelectorAll(".comment").forEach(ele=>{// add the time to each comment in the DOM
    
    const addTime = commentID=>{
        const timeEle = document.querySelector("#"+commentID+" .comment-time")
        const {passedTime, nextInc} = calcPassedTime(parseInt(timeEle.dataset.timestamp))
        console.log(passedTime)
        timeEle.innerText= passedTime
        // console.log(nextInc)
        nextInc?setTimeout(commentID=>{addTime(commentID)}, nextInc, commentID):null
    }
    addTime(ele.id)
})

let isGetCommentRunning = false; // prevend run the function while it is already run, so not return the same comments twice
const getMoreComments = (target, start)=>{//onclick on (show more) element at the end of the comments
    if(isGetCommentRunning)
        return null
    isGetCommentRunning = true;
    fetch(`/content/${contentID}/comments/${start}`).then(res=>{ 
        if(res.status === 200) return res.json()
        throw res.body
    }).then(data=>{
        target.parentElement.remove()
        data.comments.forEach(comment=>{
            document.querySelector(".comments").innerHTML+= comment.HTMLComment
            const addTime = commentID=>{
                const timeEle = document.querySelector("#d"+commentID+" .comment-time")
                const {passedTime, nextInc} = calcPassedTime(parseInt(timeEle.dataset.timestamp))
                timeEle.innerText= passedTime
                nextInc?setTimeout(commentID=>{addTime(commentID)}, nextInc, commentID):null
            }
            addTime(comment.id)
        })
        if(data.commentsNum > parseInt(start)+10)
            document.querySelector(".comments").innerHTML += 
            `<div class="show-comments text-center fs-5">
                <a class="text-decoration-none" onclick='getMoreComments(this, ${parseInt(start)+10})'> show more </a>
            </div>`
        
    }).catch(err=>{
        console.error(err)
    }).finally(()=>{
        isGetCommentRunning = false;
    })
}


let isGetRepliesRunning = false; // prevend run the function while it is already run, so not return the same replies twice
const getReplies = (target, commentID, replyToID) =>{//onclick on show (number) replies element after a comment element that has replies
    if(isGetRepliesRunning)
        return null
    isGetRepliesRunning = true
    if(target.innerText == "show less") {
        target.innerText = `show (${target.dataset.repliesNum}) replies`
        isGetRepliesRunning = false;
        return null;
    }
    if(!target.previousElementSibling.firstElementChild.classList.contains("spinner-border")){
        target.innerText = "show less"
        isGetRepliesRunning = false;
        return null
    }
    fetch(`/content/${contentID}/comment/${commentID}/replies/${replyToID? replyToID : "none"}`)
    .then(res=>{ 
            if(res.status === 200) return res.json()
            throw res.body
    }).then(data=>{
        target.parentElement.querySelector(".replies").innerHTML=""
        data.forEach( reply=>{
            document.querySelector("#d"+reply.replyToID+" + .comment-replies > .replies").innerHTML+= reply.HTMLReply
            target.innerText = "show less"
            const addTime = commentID=>{
                const timeEle = document.querySelector("#d"+commentID+" .comment-time")
                const {passedTime, nextInc} = calcPassedTime(parseInt(timeEle.dataset.timestamp))
                timeEle.innerText= passedTime

                nextInc?setTimeout(commentID=>{addTime(commentID)}, nextInc, commentID):null
            }
            addTime(reply.id)
            
        })
    }).catch(err=>{
        console.error(err)
    }).finally(()=>{
        isGetRepliesRunning = false;
    })
}

const getRepliedTo = target=>{//onclick on the user name that the reply reply to. -- it marks the comment that this reply reply to
    const selector = "#"+target.href.split("#")[1];
    document.querySelector(selector).classList.add("bg-dark", "text-white")
    setTimeout(() => {
        document.querySelector(selector).classList.remove("bg-dark", "text-white")
    }, 1000);
}

const refuseAction = (target, msg) =>{//confirm the user with the previenting reason of use comments/replies options
    if(!document.querySelector(".refuse-action")){
        target.parentElement.innerHTML += `<p class='refuse-action text-danger'>${msg}</p>`
        setTimeout(() => {
            document.querySelector(".refuse-action").remove()
        }, 1000);
    }
}
