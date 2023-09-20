const passwordFeadback = document.querySelector(".password-container .invalid-feedback.main-password")
const repeatedFeedback = document.querySelector(".password-container .invalid-feedback.repeated-password")
const repeatPasswordField = document.querySelector(".signup .repeat-pass")

document.querySelector("input[type='password']").onkeyup = e=>{
    repeatPasswordField.pattern = e.target.value;
    if(!e.target.value.match(/.*[a-z]/g)) passwordFeadback.innerText = "password should contan at least one lowercase"
    else if(!e.target.value.match(/.*\d/g)) passwordFeadback.innerText = "password should contan at least one number"
    else if(!e.target.value.match(/.*[A-Z]/g)) passwordFeadback.innerText = "password should contan at least one uppercase"
    else passwordFeadback.innerText = "password should be at least 8 or more characters"
}

document.querySelector('.signup .btn').onclick=()=>{
    document.querySelector('.signup').classList.add('was-validated');
}