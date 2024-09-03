import React, { memo, useState } from 'react';
import { socket } from '../socket';
import { useDispatch, useSelector } from 'react-redux';
import { addAlert } from '../redux/alertSlice';
import { profileRoute, defaultUserImg, URLSearchParamsData, accountImagesPath } from '../utils';
import { useNavigate } from 'react-router-dom';

function AccountControlCard({account, updateAccounts, accountType}) {
    const user = useSelector(state=> Object.keys(state.user).length? state.user : null)
    const [spinnersControl, setSpinnersControl] = useState({
        warning: false,
        ban: false,
        unBan: false,
        delete: false
    })
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const changeAuthz = form=>{
        const data = URLSearchParamsData(form)
        fetch(process.env.REACT_APP_API_SERVER+"/account/authzs/change", {
            method: "put",
            credentials:"include",
            body: data
        }).then(async res=>{
            if(res.ok){
                updateAccounts(accounts=>{
                    const index = accounts[accountType+"s"].findIndex(acc=> String(acc._id) === String(account._id))
                    return {
                    ...accounts, 
                    [accountType+"s"]: accounts[accountType+"s"].slice(0, index).concat(accounts[accountType+"s"].slice(index+1)),
                    [data.get("authz")+"s"]: [...accounts[data.get("authz")+"s"], account],
                    }
                })
                
                socket.emit("notifyUser", data.get("userID"))
            }else
                throw await res.json()
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
    }

    let warningIsClicked = false;
    const sendWarning = e=>{
        e.preventDefault()
        if(warningIsClicked) return null;
        warningIsClicked = true
        const form = e.currentTarget
        const data = URLSearchParamsData(form)
        data.append("userID", account._id);
        data.append("email", account.email);
        socket.emit("applyWarning", account._id, data.get("reason"))// to show the warning if the user is online
        setSpinnersControl(spinners=>({...spinners, warning:true}))
        fetch(process.env.REACT_APP_API_SERVER+"/account/warning",{
            method:'post',
            body: data,
            credentials: "include"
        }).then(async res=>{
            if(res.ok){
                dispatch(addAlert({type: "success", msg:"The warning was sent successfully."}))
                updateAccounts(accounts=>{
                    const index = accounts[accountType+"s"].findIndex(acc=> String(acc._id) === String(account._id))
                    return {
                        ...accounts, 
                        [accountType+"s"]: [
                            ...accounts[accountType+"s"].slice(0, index),
                            {
                                ...account, 
                                warning: {
                                    current:[...account.warning.current, data.get("reason")],
                                    all: [...account.warning.all, data.get("reason")]
                                }
                            },
                            ...accounts[accountType+"s"].slice(index+1)
                        ]
                    }
                })
                form.reset()
            }else throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            setSpinnersControl(spinners=>({...spinners, warning:false}))
            warningIsClicked = false
        })
    }
    let banIsClicked = false;
    const sendBan = e=>{
        e.preventDefault()
        if(banIsClicked) return null;
        banIsClicked = true
        const form = e.currentTarget
        const data = URLSearchParamsData(form);
        data.append("userID", account._id);
        data.append("email", account.email);
        if(parseInt(data.get("duration"))>=1){
            setSpinnersControl(spinners=>({...spinners, ban:true}))
            fetch(process.env.REACT_APP_API_SERVER+"/account/ban",{
                method:'post',
                credentials: "include",
                body: data
            }).then(async res=>{
                if(res.ok){
                    socket.emit("logoutUser", account._id)//to logout the user if he is online
                    dispatch(addAlert({type: "success", msg:"The account is banned successfully."}))
                    updateAccounts(accounts=>{
                        const index = accounts[accountType+"s"].findIndex(acc=> String(acc._id) === String(account._id))
                        return {
                            ...accounts, 
                            [accountType+"s"]: [
                                ...accounts[accountType+"s"].slice(0, index),
                                {
                                    ...account, 
                                    ban: {
                                        current: {reason: data.get("reason"), ending: new Date().getTime()+data.get("duration")*24*60*60*1000},
                                        all: [...account.ban.all, data.get("reason")]
                                    }
                                },
                                ...accounts[accountType+"s"].slice(index+1)
                            ]
                        }
                    })
                }
                else throw await res.json();
            }).catch( err=>{
                if(err.msg){
                    dispatch(addAlert({type: "danger", msg:err.msg}))
                }else{
                    console.error(err)
                    dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
                }
            }).finally(()=>{
                setSpinnersControl(spinners=>({...spinners, ban:false}))
                banIsClicked = false
            })
        }
    }

    let unbanIsClicked = false;
    const unban = e=>{
        e.preventDefault()
        if(unbanIsClicked) return null;
        unbanIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form);
        data.append("userID", account._id);
        data.append("email", account.email);
        setSpinnersControl(spinners=>({...spinners, unBan:true}))
        fetch(process.env.REACT_APP_API_SERVER+"/account/ban/delete",{
            method:'delete',
            credentials: "include",
            body: data
        }).then(async res=>{
            if(res.ok){
                dispatch(addAlert({type: "success", msg:"The account is unbanned successfully."}))
                updateAccounts(accounts=>{
                    const index = accounts[accountType+"s"].findIndex(acc=> String(acc._id) === String(account._id))
                    return {
                        ...accounts, 
                        [accountType+"s"]: [
                            ...accounts[accountType+"s"].slice(0, index),
                            {
                                ...account, 
                                ban: {
                                    current: {reason: null, ending: null},
                                    all: account.ban.all
                                }
                            },
                        ],
                        ...accounts[accountType+"s"].slice(index+1)
                    }
                })
            }
            else throw await res.json();
        }).catch( err=>{
            if(err.msg){
                dispatch(addAlert({type: "danger", msg:err.msg}))
            }else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            setSpinnersControl(spinners=>({...spinners, unBan:false}))
            unbanIsClicked = false
        })
    }

    let deleteIsClicked = false;
    const deleteAccount = e=>{
        e.preventDefault()
        if(deleteIsClicked) return null;
        deleteIsClicked = true
        const formData = new FormData();
        const data = new URLSearchParams();
        for (const [key, value] of formData) {
            data.append(key, value);
        }
        data.append("userID", account._id);
        data.append("email", account.email);
        setSpinnersControl(spinners=>({...spinners, delete:true}))
        fetch(process.env.REACT_APP_API_SERVER+"/account/delete",{
            method:'delete',
            credentials: "include",
            body: data
        }).then(async res=>{
            if(res.ok){
                socket.emit("logoutUser", account._id)
                dispatch(addAlert({type: "success", msg:"The account is deleted successfully."}))
                updateAccounts(accounts=>{
                    const index = accounts[accountType+"s"].findIndex(acc=> String(acc._id) === String(account._id))
                    return {
                    ...accounts, 
                    [accountType+"s"]: accounts[accountType+"s"].slice(0, index).concat(accounts[accountType+"s"].slice(index+1)),
                    }
                })
            }
            else throw await res.json();
        }).catch( err=>{
            if(err.msg){
                dispatch(addAlert({type: "danger", msg:err.msg}))
            }else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Faild to delete the account, Try Again!"}))
            }
        }).finally(()=>{
            setSpinnersControl(spinners=>({...spinners, delete:false}))
            deleteIsClicked = false
        })
    }

    const toggleCollapse = (e, id)=>{
        const btn = e.currentTarget;
        btn.dataset.bsTarget = ".show"
        btn.click()
        btn.dataset.bsTarget = id
        btn.click()
        btn.dataset.bsTarget = null
    }

    return (
        <div className="card text-center" style={{ width: '18rem'}} id={`card-${account._id}`}>
            <div className="card-body dropend">
                <img
                    className="img-icon rounded-circle mb-3 cur-pointer"
                    style={{ width: '60px', height: '60px'}}
                    src={accountImagesPath+account.img}
                    alt="account img"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(profileRoute+account._id);
                    }}
                    onError={defaultUserImg}
                />
                <h5>{String(user._id) === String(account._id) ? 'Me' : account.name}</h5>

                <form className="form-floating mb-3">
                    <input type="hidden" name="userID" value={account._id} />
                    <input className="form-control mb-2" type="hidden" name="email" value={account.email} />

                    {/* Authorizations Control */}
                    <select
                        className="form-select cur-pointer"
                        name="authz"
                        id={`select${account._id}`}
                        onChange={e=> changeAuthz(e.currentTarget.form)}
                        value={accountType || 'normal'}
                    >
                        <option value="user" defaultValue={!accountType}>
                            None
                        </option>
                        <option value="author" defaultValue={accountType === 'author'}>
                            Author
                        </option>
                        <option value="editor" defaultValue={accountType === 'editor'}>
                            Editor
                        </option>
                        <option value="admin" defaultValue={accountType === 'admin'}>
                            Admin
                        </option>
                    </select>
                    
                    <label htmlFor={`select${account._id}`}>Change Authorizations</label>
                </form>
                
                {account.warning.all.length?
                    <>
                        <p className="warnings-num d-inline dropdown-toggle cur-pointer" data-bs-toggle="dropdown" aria-expanded="false">Warnings number: {account.warning.all.length}</p>
                        <ul className="dropdown-menu ps-3 pe-3">
                            {account.warning.all.map((warning, i)=><li key={i}>{warning}</li>)}
                        </ul>
                    </>
                :
                    <p className="warnings-num d-inline">Warnings number: {account.warning.all.length}</p>
                }
                <br />
                
                {account.ban.all.length?
                    <>
                        <p className="bans-num d-inline dropdown-toggle cur-pointer" data-bs-toggle="dropdown" aria-expanded="false">Bans number: {account.ban.all.length}</p>
                        <ul className="dropdown-menu ps-3 pe-3">
                            {account.ban.all.map((ban, i)=><li key={i}>{ban}</li>)}
                        </ul>
                    </>
                :
                    <p className="bans-num d-inline">Bans number: {account.ban.all.length}</p>
                }

                {String(user._id) !== String(account._id) &&
                    <div className="penalty mt-3">
                        {new Date().getTime() < account.ban.current?.ending ?
                        // If account is banned
                            <div className="ban-info">
                                <p>{`This account is banned until ${new Date(parseInt(account.ban.current.ending)).toLocaleString('en')}`}</p>
                                <p>{`The reason: ${account.ban.current.reason}`}</p>
                                <form className="mt-3" id={`unban${account._id}`} onSubmit={unban}>
                                    <button className="btn btn-primary" type="submit">
                                        {spinnersControl.unBan && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                        Unban
                                    </button>
                                </form>
                            </div>
                        : <>
                            <div className="d-flex justify-content-around">
                                <button className="btn btn-primary" type="button" data-bs-toggle="collapse" onClick={e=>toggleCollapse(e, `.warning${account._id}`)}>
                                    Warning
                                </button>
                                <button className="btn btn-primary" type="button" data-bs-toggle="collapse" onClick={e=>toggleCollapse(e, `.ban${account._id}`)}>
                                    Ban
                                </button>
                                <button className="btn btn-primary" type="button" data-bs-toggle="collapse" onClick={e=>toggleCollapse(e, `.delete${account._id}`)}>
                                    Delete
                                </button>
                            </div>
                        
                            <form className={`collapse mt-3 warning${account._id}`} onSubmit={sendWarning}>
                                <input className="form-control mb-2" type="text" name="reason" placeholder="Enter the warning reason" required />
                                <button className="btn btn-primary" type="submit" data-bs-toggle="collapse" data-bs-target={`#warning${account._id}`}>
                                    {spinnersControl.warning && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                    Submit
                                </button>
                            </form>

                            <form className={`collapse mt-3 ban${account._id}`} onSubmit={sendBan}>
                                <input className="form-control mb-2" type="text" name="reason" placeholder="Enter the ban reason" required />
                                <input className="form-control mb-2" type="number" min="1" name="duration" placeholder="Enter the ban duration (days)" required />
                                <p>no fractions</p>
                                <button className="btn btn-danger" type="submit" data-bs-toggle="collapse" data-bs-target={`#ban${account._id}`}>
                                    {spinnersControl.ban && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                    Ban
                                </button>
                            </form>

                            <form className={`collapse mt-3 delete${account._id}`} onSubmit={deleteAccount}>
                                <p>Are you sure, you want to delete this account</p>
                                <button className="btn btn-danger" type="submit" data-bs-toggle="collapse" data-bs-target={`#delete${account._id}`}>
                                    {spinnersControl.delete && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                    Delete
                                </button>
                            </form>
                        </>}
                    </div>
                }
            </div>
        </div>
    )
}

export default memo(AccountControlCard)