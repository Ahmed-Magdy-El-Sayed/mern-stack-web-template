function getRemind(time) {
    min = (parseFloat(time) - new Date().getTime()) / 1000 / 60;
    sec = Math.floor((Math.abs(min) % 1) * 60)
    return `${Math.floor(min)}:${(sec < 10? "0" + sec: sec)}`
}

const id = document.querySelector("input[name='id']").value;

let addReminder = setInterval(() => {
    const timeEle = document.querySelector(".time-reminded");
    const remind = getRemind(timeEle.dataset.expiration)
    if(parseInt(remind) >= 0){
        timeEle.innerText= "The Code will Expired in " + remind
    }else {
        timeEle.innerHTML= `The Code is Expired, <a class='text-upper' href='/verify/new-code/${id}'>click here</a> to get new code`
        clearInterval(addReminder)
    }
}, 1000);
