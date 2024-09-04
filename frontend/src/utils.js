
const contentRoute = '/content/id/'
const profileRoute = '/account/profile/'
const accountImagesPath = process.env.REACT_APP_API_SERVER+'/account/'
const contentImagesPath = process.env.REACT_APP_API_SERVER+'/content/'


const calcPassedTime = timestamp=>{// calc the time that passed from post the comment
    const commentDate = new Date(timestamp);
    
    const commentYear = commentDate.getFullYear();
    const commentMonth = commentDate.getMonth()+1;
    let yearsNum = 1;// the number of the years that passed since the comment date
    while(true){
        let lessThanOrEqualNowDate = new Date(commentDate).setFullYear(commentYear + yearsNum) <= Date.now()
        if(lessThanOrEqualNowDate){
            yearsNum++
        }else break
    }
    yearsNum--

    let monthsNum = 1;// the number of the months that passed since the comment date
    while(true){
        let lessThanOrEqualNowDate = new Date(commentDate).setFullYear((commentYear+yearsNum), (commentMonth-1+monthsNum)) <= Date.now()
        if(lessThanOrEqualNowDate){
            monthsNum++
        }else break
    }
    monthsNum--

    const passedMS = Date.now() - commentDate.getTime()

    const passedYears = yearsNum;
    const passedMonths = monthsNum;
    const passedDays = Math.floor(passedMS / 1000 / 60 / 60 / 24)

    const passedHours = Math.floor(passedMS / 1000 / 60 / 60)
    const passedMins = Math.floor(passedMS / 1000 / 60)

    let nextInc; // the duration that after it the comment time will increase - if it more than 3h the setTimeout will not be created
    if(passedYears){
        nextInc = new Date(commentDate).setFullYear(commentYear+yearsNum, commentMonth+monthsNum) - Date.now()

        const remindedMonths = monthsNum;
        const remindedMonthsStr = remindedMonths >= 1? ("and "+(remindedMonths===1?"one month":remindedMonths+" month")):""; //reminded from years number ex: 1 year 8 months
        if(passedYears === 1) return {
            passedTime:"since one Year " + remindedMonthsStr, 
            nextInc: nextInc < 3*60*60*1000? nextInc : null
        }
        return {
            passedTime: `since ${passedYears} Years ${remindedMonthsStr}`, 
            nextInc: nextInc < 3*60*60*1000? nextInc : null
        }

    }else if(passedMonths){
        let remindedDays = 
           Date.now() - new Date(commentDate).setFullYear(commentYear + yearsNum, (commentMonth-1)+monthsNum); // reminded from months number ex: 5m 20d
        remindedDays = remindedDays/1000/60/60/24;
        nextInc = 24*60*60*1000 - (remindedDays%1)*24*60*60*1000;
        
        remindedDays = Math.floor(remindedDays);
        const remindedDaysStr = (remindedDays >= 1? `and ${remindedDays === 1? "one day": remindedDays+" days"}`:"");
        if(passedMonths === 1) return {
            passedTime:"since one Month "+ remindedDaysStr, 
            nextInc: nextInc < 3*60*60*1000? nextInc : null
        }
        return {
            passedTime: `since ${passedMonths} Months ${remindedDaysStr}`, 
            nextInc: nextInc < 3*60*60*1000? nextInc : null
        }

    }else if(passedDays){
        let remindedHours = ((passedMS/1000/60/60/24 %1)*24).toFixed(3);// if passed days is 3.5, then remindedHours is 0.5*24 = 12
        remindedHours = parseFloat(remindedHours)
        nextInc = 60*60*1000 - Math.floor((remindedHours %1)*60)*60*1000;
        remindedHours = Math.floor(remindedHours)
        if(passedDays >= 7){ 
            let remindedDays = ((passedMS / 1000 / 60 / 60 / 24/7)%1*7);
            remindedDays =parseFloat(remindedDays.toFixed(3))
            nextInc = 24*60*60*1000 - remindedDays%1*24*60*60*1000
            remindedDays = Math.floor(remindedDays)
            const remindedDaysStr = remindedDays>=1? `and ${remindedDays===1? "one day": remindedDays+" days"}` : "";
            return {
                passedTime:"since "+(Math.floor(passedDays/7) === 1? 
                    `one week ${remindedDaysStr}`
                    : 
                    Math.floor(passedDays/7) + " Weeks "+ remindedDaysStr), 
                nextInc: nextInc < 3*60*60*1000? nextInc : null
            }
        }else if(passedDays === 1) return {
            passedTime:"since one Day" + (remindedHours >= 1? ` and ${remindedHours} hr`:""), 
            nextInc: nextInc < 3*60*60*1000? nextInc : null
        }
        return {
            passedTime: "since "+passedDays + " Days" +(remindedHours >= 1? ` and ${remindedHours} hr`:""), 
            nextInc: nextInc < 3*60*60*1000? nextInc : null
        }

    }else if(passedHours){
        let remindedMins = (((passedMS/1000/60/60) %1) *60)
        nextInc = 60*1000 - Math.floor((remindedMins %1) *60)*1000
        remindedMins = parseFloat(remindedMins.toFixed(3))
        remindedMins = Math.floor(remindedMins)
        return{
            passedTime: "since "+passedHours + " hr" + (remindedMins >= 1? ` and ${remindedMins} min`:""), 
            nextInc
        }

    }else if(passedMins){
        const remindedSec = (passedMS/1000/60) %1 *60
        nextInc = 60*1000 - remindedSec*1000
        return {
            passedTime:"since "+passedMins + " min", 
            nextInc 
        }

    }else{
        const remindedSec = (passedMS/1000/60) %1 *60
        nextInc = 60*1000 - remindedSec*1000
        return {
            passedTime: "since Now", 
            nextInc
        }
    }
}

const addBsVal = e=>{
    e.currentTarget.form.classList.add('was-validated');
}

const passwordValidation = pass=>{
    let err = false;
    if(!/.*[a-z]/g.test(pass)) err = "password should contan at least one lowercase";
    else if(!/.*\d/g.test(pass)) err = "password should contan at least one number";
    else if(!/.*[A-Z]/g.test(pass)) err = "password should contan at least one uppercase";
    else if(!/.{8,}/g.test(pass))err = "password should be at least 8 or more characters";
    return err;
}

const defaultContentImg = e=>{
    e.currentTarget.src = contentImagesPath + "/content.png"
}

const defaultUserImg = e=>{
    e.currentTarget.src = accountImagesPath + "/user.jpg"
}

const URLSearchParamsData = form=>{
    const data = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
        data.append(key, value);
    }
    return data
}

export {contentRoute, profileRoute, 
    accountImagesPath, contentImagesPath,
    calcPassedTime, addBsVal,
    passwordValidation,
    defaultContentImg, defaultUserImg,
    URLSearchParamsData
}