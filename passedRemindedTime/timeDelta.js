/**
 * The value should be acceptable as the Date() constructor.
 * @param {String | Number} timestamp1 The timestamp to calc the time from.
 * @param {String | Number =} timestamp2 **Optional** The timestamp to calc the time to. defualt value Date.now().
 * @returns {Object} Object contains attrbutes years, months, days, hours, minutes, secounds, millisecounds, state:"elapsed" || "remained".
 */
const timeDelta = (timestamp1, timestamp2=Date.now())=>{
    const result = {};

    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2 == ""? Date.now():timestamp2);
    
    if(date1 == "Invalid Date" || date2 == "Invalid Date"){
        console.error("Invalid Date: The passed value should be acceptable as the Date() constructor.")
        return "Invalid Date"
    }

    const date1Millisecounds = date1.getTime()

    const date1Years = date1.getFullYear();
    const date1Months = date1.getMonth()+1;
    
    let yearsNum = 1;// the number of the years that elapsed or remained from timestamp1 to timestamp2
    while(true){
        let reachToNowDate =
        (date2- date1Millisecounds) >= 0?
            new Date(date1Millisecounds).setFullYear(date1Years + yearsNum) <= date2
        :
            new Date(date1Millisecounds).setFullYear(date1Years - yearsNum) >= date2
        if(reachToNowDate){
            yearsNum++
        }else break
    }
    yearsNum--

    let monthsNum = 1;// the number of the months that elapsed or remained from timestamp1 to timestamp2
    while(true){
        let reachToNowDate =
        (date2- date1Millisecounds) >= 0?
            new Date(date1Millisecounds).setFullYear((date1Years+yearsNum), (date1Months-1+monthsNum)) <= date2
        :
            new Date(date1Millisecounds).setFullYear((date1Years-yearsNum), (date1Months-1-monthsNum)) >= date2
        if(reachToNowDate){
            monthsNum++
        }else break
    }
    monthsNum--

    const MS = date2- date1Millisecounds

    const Years = yearsNum;
    const Months = monthsNum;
    const Days = MS / 1000 / 60 / 60 / 24

    const Hours = MS / 1000 / 60 / 60
    const Mins = MS / 1000 / 60
    const Sec = MS / 1000
    
    if(Years){
        const reminded = (date2- date1Millisecounds) >= 0?
            date2- new Date(date1Millisecounds).setFullYear(date1Years+yearsNum, (date1Months-1)+monthsNum)
        :
            date2- new Date(date1Millisecounds).setFullYear(date1Years-yearsNum, (date1Months-1)-monthsNum)

        result.years = Years;
        result.months = Months;
        result.days= reminded/1000/60/60/24;
        result.hours = result.days%1*24;
        result.minutes = result.hours%1*60;
        result.secounds = result.minutes%1*60;
        result.millisecounds = result.secounds%1*1000;

    }else if(Months){
        const reminded = (date2- date1Millisecounds) >= 0?
            date2- new Date(date1Millisecounds).setFullYear(date1Years + yearsNum, (date1Months-1)+monthsNum)
        :
            date2- new Date(date1Millisecounds).setFullYear(date1Years - yearsNum, (date1Months-1)-monthsNum)

        result.months = Months;
        result.days= reminded/1000/60/60/24;
        result.hours = result.days%1*24;
        result.minutes = result.hours%1*60;
        result.secounds = result.minutes%1*60;
        result.millisecounds = result.secounds%1*1000;

    }else if(Math.floor(Math.abs(Days))){

        result.days= Days;
        result.hours = result.days%1*24;
        result.minutes = result.hours%1*60;
        result.secounds = result.minutes%1*60;
        result.millisecounds = result.secounds%1*1000;

    }else if(Math.floor(Math.abs(Hours))){

        result.hours = Hours;
        result.minutes = result.hours%1*60;
        result.secounds = result.minutes%1*60;
        result.millisecounds = result.secounds%1*1000;

    }else if(Math.floor(Math.abs(Mins))){

        result.minutes = Mins;
        result.secounds = result.minutes%1*60;
        result.millisecounds = result.secounds%1*1000;

    }else if(Math.floor(Math.abs(Sec))){

        result.secounds = Sec;
        result.millisecounds = result.secounds%1*1000;

    }else{
        result.millisecounds = MS;
    }

    if(result.millisecounds > 0)
        result.state = "elapsed"
    else 
        result.state = "remained"

    if(result.days)
        result.days = Math.abs(parseInt((result.days).toFixed(3)))
    if(result.hours)
        result.hours = Math.abs(parseInt((result.hours).toFixed(3)))
    if(result.minutes)
        result.minutes = Math.abs(parseInt((result.minutes).toFixed(3)))
    if(result.secounds)
        result.secounds = Math.abs(parseInt((result.secounds).toFixed(3)))
    result.millisecounds = Math.abs(parseInt((result.millisecounds).toFixed(3)))

    return result
}