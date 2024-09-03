import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addBsVal, passwordValidation, URLSearchParamsData } from '../../utils';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';

export default function ResetPass() {
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const spinnerRef = useRef()
    const params = useParams();
    const id = params.id;
    const resetCode = params.resetCode;

    let resetIsClicked = false;
    const reset = e=>{
        e.preventDefault()
        if(resetIsClicked) return null;
        resetIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form)
        spinnerRef.current.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+"/account/password-reset",{
            method: "post",
            body: data
        }).then(async res=>{
            if(res.ok)
                navigate("/account/login")
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
            resetIsClicked = false
        })
    }
    return <>
        <div className="row justify-content-center text-center">
            <h1 className="text-primary mt-4">Reset The Password</h1>
            <p className="mb-5">enter the new password.</p>
            <form className="reset-pass col-11 col-sm-6 needs-validation was-validated" onSubmit={reset}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="resetCode" value={resetCode} />
                
                <div className="password-container">
                    <input className="form-control mt-3" type="password" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" name="password" placeholder="Enter the new password" onKeyUp={passwordValidation} required />
                    <div className="invalid-feedback main-password w-auto"></div>
                    <div className="repeat">
                        <input className="form-control repeat-pass mt-3" type="password" placeholder="Enter the new password again" required />
                        <div className="invalid-feedback repeated-password w-auto">The password not matched</div>
                    </div>
                </div>
                
                <button className="btn btn-primary my-3" type="submit" onClick={addBsVal}>
                    <span className="spinner-border spinner-border-sm d-none me-1" ref={spinnerRef} aria-hidden="true"></span>
                    Reset
                </button>
            </form>
        </div>
    </>
}