import React, { useEffect, useState } from 'react';
import AccountControlCard from "../accountControlCard"
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import { useNavigate } from 'react-router-dom';
import Loader from '../loader';

let accountsTemp;
let searchIsMepty = true;
const transitionStyle = {transition: '0.7s'};

export default function AccountsControl() {
    const [accounts, setAccounts] = useState()
    const [sectionsDisplay, setSectionsDisplay] = useState({
        selectedBtn: 'all',
        users: true,
        authors: true,
        editors: true,
        admins: true
    })
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const updateAccounts = cb=>{
        setAccounts(cb)
    }
    
    let getAccountsClicked = false
    const getMoreAccounts = accountType=>{
        if(getAccountsClicked) return null
            getAccountsClicked = true
        fetch(process.env.REACT_APP_API_SERVER+"/account", {
            method: "post",
            credentials:"include",
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({accountType, skip: accounts[accountType].length})
        }).then(async res=>{
            if(res.ok)
                return res.json()
            else
                throw await res.json()
        }).then(newAccounts=>{
            setAccounts({...accounts, [accountType]: [...accounts[accountType], newAccounts]})
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            getAccountsClicked = false
        })
    }
    const getMatchedAccounts = searchVal=>{// onkeyup in search input
        searchVal = searchVal.trim()
        // the following part before the fetch func for reset the accounts before searching
        if(!searchVal){
            if(accountsTemp)
                setAccounts(accountsTemp)
            searchIsMepty = true
            return null
        }
        if(searchIsMepty)
            accountsTemp = accounts;
        searchIsMepty = false
        setAccounts()
        fetch(process.env.REACT_APP_API_SERVER+'/account/search?name='+searchVal, {credentials:"include"})
        .then(async res=>{
            if(res.status === 200) return res.json()
            else throw await res.json();
        }).then(accounts=>{
            setAccounts(accounts)
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
    }

    const selectCategory = category=>{
        if(category === "all") setSectionsDisplay({
            selectedBtn: 'all',
            users: true,
            authors: true,
            editors: true,
            admins: true
        })
        else setSectionsDisplay({
            selectedBtn: category,
            users: false,
            authors: false,
            editors: false,
            admins: false,
            [category]: true
        })
    }

    useEffect(()=>{
        fetch(process.env.REACT_APP_API_SERVER+"/account", {credentials:"include"}).then(async res=>{
            if(res.ok)
                return await res.json()
            else
                throw await res.json()
        }).then(accounts=>{
            setAccounts(accounts)
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
            if(err?.msg === "Forbidden") navigate("/")
        })
    },[])
    
    return <>
        <div className="container accounts-control mt-5">
            <input className="form-control w-50 m-auto mb-3" type="search" name="accountName" placeholder="Search accounts by name" onInput={e=>getMatchedAccounts(e.currentTarget.value)} />
            
            <div className='category-selection d-flex justify-content-center gap-3'>
                <span className={`btn ${sectionsDisplay.selectedBtn === 'all'?'btn-primary':'btn-secondary'}`} style={transitionStyle} onClick={()=>selectCategory('all')}>All</span>
                <span className={`btn ${sectionsDisplay.selectedBtn === 'users'?'btn-primary':'btn-secondary'}`} style={transitionStyle} onClick={()=>selectCategory('users')}>User</span>
                <span className={`btn ${sectionsDisplay.selectedBtn === 'authors'?'btn-primary':'btn-secondary'}`} style={transitionStyle} onClick={()=>selectCategory('authors')}>Author</span>
                <span className={`btn ${sectionsDisplay.selectedBtn === 'editors'?'btn-primary':'btn-secondary'}`} style={transitionStyle} onClick={()=>selectCategory('editors')}>Editor</span>
                <span className={`btn ${sectionsDisplay.selectedBtn === 'admins'?'btn-primary':'btn-secondary'}`} style={transitionStyle} onClick={()=>selectCategory('admins')}>Admin</span>
            </div>
            {sectionsDisplay.users &&
            <div className={'category users'}>
                <h3>Users</h3>
                {
                accounts?
                    accounts.users.length ?
                        <div className="normal-accounts d-flex flex-wrap justify-content-center gap-2">
                            {accounts.users.map((account, i) =>
                                <AccountControlCard account={account} key={i} updateAccounts={updateAccounts} accountType="user"/>
                            )}
                            {accounts.users.length >= 10 &&
                                <div className="show-comments text-center fs-5">
                                    <span className="text-decoration-none" onClick={() => getMoreAccounts('users')}>
                                        show more
                                    </span>
                                </div>
                            }
                        </div>
                    :
                        <p className="alert alert-secondary w-100 text-center">No users.</p>
                : <Loader/>
                }
                <hr />
            </div>}

            {sectionsDisplay.authors &&
            <div className={'category authors'}>
                <h3>Authors</h3>
                {
                accounts?
                    accounts.authors.length ?
                        <div className="author-accounts d-flex flex-wrap justify-content-center gap-2">
                            {accounts.authors.map((account, i) =>
                                <AccountControlCard account={account} key={i} updateAccounts={updateAccounts} accountType="author"/>
                            )}
                            {accounts.authors.length >= 10 &&
                                <div className="show-comments text-center fs-5">
                                    <span className="text-decoration-none" onClick={() => getMoreAccounts('authors')}>
                                        show more
                                    </span>
                                </div>
                            }
                        </div>
                    :
                        <p className="alert alert-secondary w-100 text-center">No authors.</p>
                : <Loader/>
                }
                <hr />
            </div>}

            {sectionsDisplay.editors && 
            <div className={'category editors'}>
                <h3>Editors</h3>
                {
                accounts?
                    accounts.editors.length ?
                        <div className="editor-accounts d-flex flex-wrap justify-content-center gap-2">
                            {accounts.editors.map((account, i) =>
                                <AccountControlCard account={account} key={i} updateAccounts={updateAccounts} accountType="editor"/>
                            )}
                            {accounts.editors.length >= 10 &&
                                <div className="show-comments text-center fs-5">
                                    <span className="text-decoration-none" onClick={() => getMoreAccounts('editor')}>
                                        show more
                                    </span>
                                </div>
                            }
                        </div>
                    :
                        <p className="alert alert-secondary w-100 text-center">No editors.</p>
                : <Loader/>
                }
                <hr />
            </div>}
            
            {sectionsDisplay.admins &&
            <div className={'category admins'}>
                <h3>Admins</h3>
                {
                accounts?
                    accounts.admins.length ?
                        <div className="admin-accounts d-flex flex-wrap justify-content-center gap-2">
                            {accounts.admins.map((account, i) =>
                                <AccountControlCard account={account} key={i} updateAccounts={updateAccounts} accountType="admin"/>
                            )}
                            {accounts.admins.length >= 10 &&
                                <div className="show-comments text-center fs-5">
                                    <span className="text-decoration-none" onClick={() => getMoreAccounts('admins')}>
                                        show more
                                    </span>
                                </div>
                            }
                        </div>
                    :
                        <p className="alert alert-secondary w-100 text-center">No admins.</p>
                : <Loader/>
                }
            </div>}
        </div>
    </>
}