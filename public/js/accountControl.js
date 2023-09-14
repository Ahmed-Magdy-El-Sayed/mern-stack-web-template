const createAccountHTML = accounts=>{
    return accounts.map(account=>{
        const accountType = account.isAuthor? "author" : account.isEditor?"editor": account.isAdmin?"admin":"user"
        return `
        <div class="card text-center" style="width: 18rem; cursor:pointer">
            <div class="card-body">
                <img src=${account.img} alt="account img">
                <h5> ${String(me._id) ==String(account._id)?"Me":account.name} </h5> 
                <form class="form-floating mb-3" action="/account/authzs/change" method="post">
                    <input type="hidden" name="userID" value="${account._id}">
                    <select class="form-select" name="authz" id="select${account._id}" onchange="changeAuthz(this.form)">
                        <option value="none" ${accountType == 'user'? 'selected' : ''}> None </option>
                        <option value="author" ${accountType == 'author'? 'selected' : ''}> Author</option>
                        <option value="editor" ${accountType == 'editor'? 'selected' : ''}> Editor</option>
                        <option value="admin" ${accountType == 'admin'? 'selected' : ''}> Admin</option>
                    </select>
                    <label for="select${account._id}"> Change Authorizations </label>
                </form>
                <p> Warnings number: ${account.warningsNum} </p>
                <p> Bans number: ${account.bansNum } </p>
                ${String(me._id) == String(account._id)? "" 
                :
                (new Date().getTime() < account.ban?.ending)?
                    `<p> this account is Banned until ${ new Date(parseInt(account.ban.ending)).toLocaleString("en")} </p>
                    <form class="collapse mt-3" id="ban${account._id}" action="/account/ban/delete" method="post" oncsubmit="unban(event)">
                        <button class="btn btn-primary" type="button"  name="userID" value="${account._id}"> unban </button>
                    </form>`
                :
                    `${account.warning?
                        `<p> The user did not login yet to see the warning.\n The warning reason: ${account.warning} </p>`:""
                    }
                    <div class="d-flex justify-content-around">
                        ${!account.warning?
                            `<button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#warning${account._id}"> Warning </button>` : ""
                        }
                        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#ban${account._id}"> Ban </button>
                        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#delete${account._id}"> Delete</button>
                    </div>
                    <form class="collapse mt-3" id="ban${account._id}" action="/account/ban" method="post">
                        <input class="form-control mb-2" type="text", name="reason" placeholder="Enter the ban reason" required>
                        <input class="form-control mb-2" type="number"  min="1"  name="ending"  placeholder="Enter the ban duration (dayes)" required>
                        <p>no fractions</p>
                        <button class="btn btn-primary" type="button"  name="userID", value=${account._id} onclick="sendBan(this)"> Ban </button>
                    </form>
                    <form class="collapse mt-3" id="delete${account._id}" action="/account/delete" method="post">
                        <p> Are you sure, you want to delete ${account.name} </p>
                        <button class="btn btn-primary" type="button" name="userID" value=${account._id}, onclick="deleteAccount(this)"> Delete </button>
                    </form>
                    ${!account.warning?
                        `<form class="collapse mt-3" id="warning${account._id}" action="/account/warning", method="post">
                            <input> class="form-control mb-2" type="text" name="reason" placeholder="Enter the warning reason" required>
                            <button class="btn btn-primary" type="button"  name="userID" value=${account._id} onclick="sendWarning(this)"> Submit </button>
                        </form>` : ""}`
                    }
            </div>
        </div>
        `
    })
}


const getMatchedAccounts = searchVal=>{// onkeydown in search input
    const resultContainer = document.querySelector(".search-result-container")
    const container = document.querySelector(".container")
    searchVal = searchVal.trim()
    if(!searchVal){
        resultContainer.innerHTML = ""
        container.style.display = null
        return null
    }
    container.style.display = "none"
    resultContainer.innerHTML = `
    <div class="spinner-border text-primary" role="status">
        <div class="span visually-hidden"> Loading... </div>
    </div>
    `
    fetch('/account/search?name='+searchVal).then(res=>{
        if(res.status == 200) return res.json()
        else throw res.body;
    }).then(accounts=>{
        resultContainer.innerHTML = ""
        if(!accounts.length){
            resultContainer.innerHTML = '<div class="alert alert-secondary w-100 text-center">No accounts matched</div>'
            return null
        }
        createAccountHTML(accounts).forEach(account=>{
            resultContainer.innerHTML += account
        })
    }).catch(err=>{
        console.error(err)
    })
}

const  accountsViewed = {//to count the accounts number that retrieved, so skip this number when get more
    users: 10,
    authors: 10,
    editors: 10,
    admins: 10
}

let getAccountsClicked = false
const getMoreAccounts = (target, accountType)=>{//onclick on show more after each group of accounts 
    if(getAccountsClicked) return null
    getAccountsClicked = true
    fetch('/account',{
        method:'post',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({accountType, skip: accountsViewed[accountType]})
    }).then(res=>{
        if(res.status == 200) return res.json()
        else throw res.body;
    }).then(accounts=>{
        if(!accounts.length){
            target.parentElement.remove()
            return null
        }
        accountsViewed[accountType] += 10
        createAccountHTML(accounts).forEach(account=>{//take each account object. make the html content, then add to the dom
            target.parentElement.previousElementSibling.insertAdjacentHTML('beforeend', account)
        })
    }).catch(err=>{
        console.error(err)
    }).finally(()=>{
        getAccountsClicked = false
    })
}

const sendWarning = e=>{
    e.preventDefault()
    const form = e.target
    const submitter = e.submitter;
    const formData = new FormData(form, submitter);
    const data = new URLSearchParams();
    for (const [key, value] of formData) {
        data.append(key, value);
    }
    const sendingDone= ()=>{
        form.querySelector("input[name='reason']").value=""
        form.parentElement.parentElement.querySelector("button[data-bs-target='#warning"+submitter.value+"']").click()// close the warning form
        const wraningCounter = form.parentElement.parentElement.querySelector(".warnings-num")
        wraningCounter.innerText = "Warnings number: "+(parseInt(wraningCounter.innerText.split(" ").pop())+1)
        document.querySelector(".container").insertAdjacentHTML(// alert of success
            "beforebegin",
            `<div class="alert alert-success alert-dismissible fade show w-100 text-center position-fixed top-0 mt-5" style="z-index:5"> 
                The warning was sent successfully 
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="close"></button>
            </div>`
        )
    } 
    const reason = form.children.reason.value
    socket.emit("applyWarning", submitter.value, reason)// to show the warning if the user is online, without send to database
    socket.on("userOffline", ()=>{// if the user is offline, increase the warning counter and save the warning in database until the user login
        fetch(form.action,{
            method:'post',
            body: data
        }).then(res=>{
            if(res.status === 201) return null
            else throw res.body;
        }).then(()=>{
            sendingDone()
        }).catch( err=>{
            console.error(err)
        })
    })
    socket.on("userOnline", ()=>{// if the user is online, increase the warning counter without save the warning itself
        data.delete("reason")
        fetch(form.action,{
            method:'post',
            body: data
        }).then(res=>{
            if(res.status === 201) return null
            else throw res.body;
        }).then(()=>{
            sendingDone()
        }).catch( err=>{
            console.error(err)
        })
    })
}
const sendBan = e=>{
    e.preventDefault()
    const form = e.target
    const submitter = e.submitter;
    const formData = new FormData(form, submitter);
    const data = new URLSearchParams();
    for (const [key, value] of formData) {
        data.append(key, value);
    }
    fetch(form.action,{
        method:'post',
        body: data
    }).then(res=>{
        if(res.status === 201) return null
        else throw res.body;
    }).then(()=>{
        socket.emit("logoutUser", submitter.value)//to logout the user if he is online
        const banCounter = form.parentElement.parentElement.querySelector(".bans-num")
        banCounter.innerText = "Bans number: "+(parseInt(banCounter.innerText.split(" ").pop())+1)
        form.parentElement.innerHTML=`
        <div class="ban-info">
            <p>"this account is Banned until ${new Date(parseInt(data.get("ending"))).toLocaleString("en")}</p>
            <form class="mt-3" id="unban${submitter.value}" action="/account/ban/delete" method="post" onsubmit="unban(event)">
                <input class="form-control mb-2" type="hidden" name="email" value="${data.get("email")}"/>
                <button class="btn btn-primary" type="submit" name="userID" value="${submitter.value}">unban</button>
            </form>
        </div>
        `
        document.querySelector(".container").insertAdjacentHTML(// alert of success
            "beforebegin",
            `<div class="alert alert-success alert-dismissible fade show w-100 text-center position-fixed top-0 mt-5" style="z-index:5"> 
                The account is banned successfully 
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="close"></button>
            </div>`
        )
    }).catch( err=>{
        console.error(err)
    })
}

const unban = e=>{
    e.preventDefault()
    const form = e.target
    const submitter = e.submitter;
    const formData = new FormData(form, submitter);
    const data = new URLSearchParams();
    for (const [key, value] of formData) {
        data.append(key, value);
    }
    fetch(form.action,{
        method:'post',
        body: data
    }).then(res=>{
        if(res.status === 201) return null
        else throw res.body;
    }).then(()=>{
        form.parentElement.parentElement.innerHTML=`
        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#warning${submitter.value}">Warning </button>
        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#ban${submitter.value}">Ban </button>
        <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#delete${submitter.value}">Delete </button>
        
        <form class="collapse mt-3" id="warning${submitter.value}" action="/account/warning" method="post" onsubmit="sendWarning(event)">
            <input class="form-control mb-2" type="text" name="reason" placeholder="Enter the warning reason" required="required" />
            <input class="form-control mb-2" type="hidden" name="email" value="${data.get("email")}"/>
            <button class="btn btn-danger" type="submit" name="userID" value="${submitter.value}">Submit</button>
        </form>
        <form class="collapse mt-3" id="ban${submitter.value}" action="/account/ban" method="post" onsubmit="sendBan(event)">
            <input class="form-control mb-2" type="text" name="reason" placeholder="Enter the ban reason" required="required" />
            <input class="form-control mb-2" type="number" min="1" name="ending" placeholder="Enter the ban duration (dayes)" required="required" />
            <p>no fractions</p>
            <input class="form-control mb-2" type="hidden" name="email" value="${data.get("email")}"/>
            <button class="btn btn-danger" type="submit" name="userID" value="${submitter.value}">Ban</button>
        </form>
        <form class="collapse mt-3" id="delete${submitter.value}" action="/account/delete" method="post" onsubmit="deleteAccount(event)">
            <p>Are you sure, you want to delete this account</p>
            <input class="form-control mb-2" type="hidden" name="email" value="${data.get("email")}"/>
            <button class="btn btn-danger" type="submit" name="userID" value="${submitter.value}">Delete</button>
        </form>
        `;
        document.querySelector(".container").insertAdjacentHTML(// alert of success
            "beforebegin",
            `<div class="alert alert-success alert-dismissible fade show w-100 text-center position-fixed top-0 mt-5" style="z-index:5"> 
                The account is unbanned successfully 
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="close"></button>
            </div>`
        )
    }).catch( err=>{
        console.error(err)
    })
}

const deleteAccount = e=>{//the same as sendBan
    e.preventDefault()
    const form = e.target
    const submitter = e.submitter;
    const formData = new FormData(form, submitter);
    const data = new URLSearchParams();
    for (const [key, value] of formData) {
        data.append(key, value);
    }
    fetch(form.action,{
        method:'post',
        body: data
    }).then(res=>{
        if(res.status === 201) return null
        else throw res.body;
    }).then(()=>{
        socket.emit("logoutUser", submitter.value)
        form.parentElement.parentElement.parentElement.reomve()// delete account card
        document.querySelector(".container").insertAdjacentHTML(// alert of success
            "beforebegin",
            `<div class="alert alert-success alert-dismissible fade show w-100 text-center position-fixed top-0 mt-5" style="z-index:5"> 
                The account was Deleted successfully 
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="close"></button>
            </div>`
        )
    }).catch( err=>{
        console.error(err)
    })
}
const changeAuthz = e=>{
    e.preventDefault()
    const form = e.target
    const submitter = e.submitter;
    const formData = new FormData(form, submitter);
    const data = new URLSearchParams();
    for (const [key, value] of formData) {
        data.append(key, value);
    }
    fetch(form.action,{//save canges in dhatabase
        method:'post',
        body: data
    }).then(res=>{
        if(res.status === 201) return null
        else throw res.body;
    }).then(()=>{
        socket.emit("notifyUser", data.get(userID), {//to add notification without the account user need to refresh the page if he is online
            msg:"The admin change your authorization to be "+ data.get(authz)+". logout and login again to apply the change", 
            href:""
        })
    }).catch( err=>{
        console.error(err)
    })
}
