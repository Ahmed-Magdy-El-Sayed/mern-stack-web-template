import React, { useRef, useState } from 'react';
import Verif from "./verif"
import { addBsVal, URLSearchParamsData } from '../../utils';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import { addWarnings } from '../../redux/warningSlice';
import { addUser } from '../../redux/userSlice';

export default function Login(){
    const [verifPage, setVerifPage] = useState();
    const [ban, setBan] = useState();
    const spinnerRef = useRef()
    const dispatch = useDispatch();
    const navigate = useNavigate();

    let submitIsClicked = false;
    const formSubmit = e=>{
        e.preventDefault()
        if(submitIsClicked) return null;
        submitIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form)
        spinnerRef.current.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+"/account/login",{
            method: "post",
            credentials: 'include',
            body: data
        }).then(async res=>{
            if(res.ok)
                return await res.json()
            else
                throw await res.json()
        }).then(data=>{
            spinnerRef.current?.classList.add("d-none")
            if(data.case === "verify")
                setVerifPage(data)
            else if(data.case === "banned")
                setBan(data.ban)
            else if(data.case ==="deleted")
                dispatch(addAlert({type:"danger", msg: data.msg}))
            else{
                if(data.warnings){
                    window.localStorage.setItem("warnings", JSON.stringify(data.warnings))
                    dispatch(addWarnings(data.warnings));
                }
                dispatch(addUser(data.user))
                socket.emit("makeRoom", data.user._id, data.user.role) //to can emit specific functions for each user / user role
                navigate("/")
            }
        }).catch(err=>{
            spinnerRef.current?.classList.add("d-none")
            form.reset()
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{submitIsClicked = false})
    }
    return <>
        {verifPage? 
            <Verif id={verifPage.id} expiration={verifPage.expiration}/>
        :
            <div className="w-100 row text-center justify-content-center">
                <h1 className="text-primary mt-5">Login</h1>
                <form className="login col-11 col-sm-6 m-auto needs-validation mt-5" onSubmit={formSubmit}>
                    <input className="form-control" type="name" name="nameOrEmail" placeholder="Enter your name or email" required />
                    
                    <input className="form-control mt-3 mb-2" type="password" name="password" placeholder="Enter password" required />
                    
                    <Link className="text-decoration-none" to="/account/password-forgot">
                        forgot your password?
                    </Link>
                    <br/>
                    <button className="btn btn-primary mt-2 mb-3" type="submit" onClick={addBsVal}>
                        <span className="spinner-border spinner-border-sm d-none me-1" ref={spinnerRef} aria-hidden="true"></span>
                        Login
                    </button>
                </form>
                <div className="login-option">
                    <span className="text-center">do not have account? </span>
                    <Link className="text-decoration" to="/account/signup">
                        signup
                    </Link>
                    {ban && 
                        <div className="alert alert-warning text-center ban" data-ending-time={ban.ending}>
                            <p>{"The admin banned your account because: " + ban.reason}</p>
                            <p className="m-0">{"The ban end at " + new Date(parseInt(ban.ending)).toLocaleString("en")}</p>
                        </div>
                    }
                </div>
            </div>
        }
    </>
}