import React, { useState } from 'react';
import AccountControlCard from "./sections/accountControlCard"
import { useDispatch, useSelector } from 'react-redux';
import { addAlert } from '../../../redux/alertSlice';
import { useLoaderData } from 'react-router-dom';
import Loader from '../../shared/loader';

let searchLatency;
const transitionStyle = {transition: '0.7s'};

export default function AccountsControl() {
    const mode = useSelector(state=>state.mode)
    const loaderAccounts = useLoaderData();
    const [accounts, setAccounts] = useState(loaderAccounts);
    const [searchData, setSearchData] = useState({value: "", by: "username"});
    const [sectionsDisplay, setSectionsDisplay] = useState('all');
    const [showGetMore, setShowGetMore] = useState(true);
    const dispatch = useDispatch();
    const updateAccounts = cb=>{
        setAccounts(cb)
    }
    

    let getAccountsClicked = false
    const getMoreAccounts = (accountType, skip)=>{
        if(getAccountsClicked) return null
            getAccountsClicked = true
        fetch(process.env.REACT_APP_API_SERVER+"/account", {
            method: "post",
            credentials:"include",
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({accountType, skip, searchBy: searchData.by, searchVal: searchData.value})
        }).then(async res=>{
            if(res.ok)
                return res.json()
            else
                throw await res.json()
        }).then(newAccounts=>{
            if(!newAccounts.length)
                return setShowGetMore(false)
            
            setAccounts([...accounts, ...newAccounts])
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
    
    const getMatchedAccounts = (form, toDisplay)=>{// onkeyup in search input
        const searchVal = form.searchVal.value.trim()
        const searchBy = form.searchBy.value
        
        setSearchData({value:searchVal, by:searchBy})

        if(toDisplay) setSectionsDisplay(toDisplay)
        // the following part before the fetch func for reset the accounts before searching
        if(!searchVal){
            setAccounts(loaderAccounts)

            setShowGetMore(true)
            
            return null
        }
        
        setAccounts()

        clearTimeout(searchLatency)
        searchLatency = setTimeout(()=>{
            if(!searchVal) return null
            fetch(process.env.REACT_APP_API_SERVER+`/account/search?${searchBy}=${searchVal}&accountType=${toDisplay? toDisplay : sectionsDisplay}`, {credentials:"include"})
            .then(async res=>{
                if(res.status === 200) return res.json()
                else throw await res.json();
            }).then(accountsResult=>{
                setShowGetMore(true)

                updateAccounts(accountsResult)
            }).catch(err=>{
                if(err.msg)
                    dispatch(addAlert({type:"danger", msg: err.msg}))
                else{
                    console.error(err)
                    dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
                }
            })
        },300)
    }

    const getMoreOption = (type, skip)=>
        <div className="get-accounts text-primary mt-3 text-center fs-5">
            <span className="text-decoration-none cur-pointer" onClick={() => getMoreAccounts(type, skip)}>
                more accounts
            </span>
        </div>

    return <>
        <div className="container mt-5 pb-3">
            <form className='search-accounts input-group w-50 m-auto mb-3 justify-content-center'>
                <input className="form-control w-50" type="search" name="searchVal" placeholder="Search accounts" onInput={e=>getMatchedAccounts(e.target.form)} />
                <label className='input-group-text' htmlFor="searchTypeSelect">By</label>
                <select className='form-select w-25' name="searchBy" id='searchTypeSelect' onChange={e=>getMatchedAccounts(e.target.form)} defaultValue='username'>
                    <option value="username">Username</option>
                    <option value="email">Email</option>
                </select>
            
                <div className='category-selection d-flex justify-content-center gap-3 my-3'>
                    <button className={`btn btn-${sectionsDisplay === 'all'?'primary':'secondary'}`} style={transitionStyle} type="button" onClick={e=> getMatchedAccounts(e.target.form, 'all')}>All</button>
                    <button className={`btn btn-${sectionsDisplay === 'user'?'primary':'secondary'}`} style={transitionStyle} type="button" onClick={e=> getMatchedAccounts(e.target.form, 'user')}>Users</button>
                    <button className={`btn btn-${sectionsDisplay === 'author'?'primary':'secondary'}`} style={transitionStyle} type="button" onClick={e=> getMatchedAccounts(e.target.form, 'author')}>Authors</button>
                    <button className={`btn btn-${sectionsDisplay === 'editor'?'primary':'secondary'}`} style={transitionStyle} type="button" onClick={e=> getMatchedAccounts(e.target.form, 'editor')}>Editors</button>
                    <button className={`btn btn-${sectionsDisplay === 'admin'?'primary':'secondary'}`} style={transitionStyle} type="button" onClick={e=> getMatchedAccounts(e.target.form, 'admin')}>Admins</button>
                </div>
            </form>

            <div className='accounts-control'>
                {
                accounts?(
                    ()=>{
                        const filteredAccounts =  sectionsDisplay === 'all'? accounts : accounts.filter(account=>(account.role === sectionsDisplay))
                        return <>{
                            filteredAccounts.length ?
                                <div className="accounts d-flex flex-wrap justify-content-center gap-2">
                                    {
                                    filteredAccounts.map((account, i) =>
                                        <AccountControlCard account={account} key={i} updateAccounts={updateAccounts} mode={mode}/>
                                    )}
                                </div>
                            : <p className="text-secondary w-100 text-center">No accounts exist.</p>
                            }
                            {showGetMore ? 
                                searchData.value? 
                                    filteredAccounts.length? getMoreOption(sectionsDisplay, filteredAccounts.length) : ""
                                :   getMoreOption(sectionsDisplay, filteredAccounts.length)
                            : <p className='text-center text-secondary mt-3 mb-0 pb-3'>No more accounts</p>}
                        </>
                    }
                )(): <Loader/>
                }
            </div>
        </div>
    </>
}