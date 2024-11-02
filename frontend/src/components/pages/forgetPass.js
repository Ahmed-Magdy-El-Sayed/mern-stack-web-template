import React, { useRef } from 'react';
import { addBsVal, URLSearchParamsData } from '../../utils';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';

export default function ForgetPass() {
    const spinnerRef = useRef()
    const dispatch = useDispatch()

    let submitIsClicked = false;
    const formSubmit = e=>{
        e.preventDefault()
        if(submitIsClicked) return null;
        submitIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form)
        spinnerRef.current.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+"/account/password-forgot/send-email",{
            method: "post",
            body: data
        }).then(async res=>{
            if(res.ok)
                dispatch(addAlert({type: "success", msg: "The reset link sent to your email"}))
            else
                throw await res.json()
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnerRef.current.classList.add("d-none")
            submitIsClicked = false
        })
    }
    return <>
        <div className="container row mx-auto text-center">
            <h1 className="text-primary mt-4">Reset The Password</h1>
            <p className="mb-5">enter your account email and we will send you a password reset link.</p>
            
            <form className="send-forgot-email col-11 col-sm-10 col-md-7 col-lg-5 mx-auto needs-validation" method="post" onSubmit={formSubmit}>
                <input className="form-control" type="email" name="email" placeholder="enter your email" required />
                <button className="btn btn-primary my-3" type="submit" onClick={addBsVal}>
                    <span className="spinner-border spinner-border-sm d-none me-1" ref={spinnerRef} aria-hidden="true"></span>
                    Send
                </button>
            </form>
        </div>
    </>
}