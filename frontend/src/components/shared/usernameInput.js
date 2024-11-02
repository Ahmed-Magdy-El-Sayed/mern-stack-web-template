import React from "react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addAlert } from "../../redux/alertSlice";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
    
const data = new URLSearchParams()
export default function UsernameInput(){
    const [usernameIsExist, setUsernameIsExist] = useState();
    const dispatch = useDispatch();

    const checkUsernameExist = e=>{
        if(!/^[A-Za-z][0-9A-Za-z_]{2,}/g.test(e.target.value)) return setUsernameIsExist();

        data.set("username", e.target.value)
        fetch(process.env.REACT_APP_API_SERVER+"/account/username/check",{
            method: "post",
            credentials: 'include',
            body: data
        }).then(async res=>{
            if(res.ok)
                return await res.json()
            else
                throw await res.json()
        }).then(({isExist})=>{
            setUsernameIsExist(isExist?true:false)
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
    }
    return <>
        <input className="form-control" type="text" pattern="^[A-Za-z][0-9A-Za-z_]{2,}" name="username" placeholder="enter your username" onKeyUp={checkUsernameExist} required />
        {typeof usernameIsExist === 'boolean' &&
            <span className={`m-auto text-${usernameIsExist? 'danger' : 'success'} mx-2`}>
                <FontAwesomeIcon 
                    icon= {`fa-solid fa-${usernameIsExist?'circle-xmark': 'circle-check'}`}
                    className="fs-5 me-2"
                /> 
                {usernameIsExist? "Aleardy Exist!" : "New."}
            </span>
        }
    </>
}