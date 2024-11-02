import React, { useRef, useState } from 'react';
import Verif from "./verif"
import { addBsVal, passwordValidation, URLSearchParamsData } from '../../utils';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import { Link } from 'react-router-dom';
import UsernameInput from '../shared/usernameInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Signup() {
    const [verifPage, setVerifPage] = useState();
    const spinnerRef = useRef()
    const feedbackRef = useRef()
    const dispatch = useDispatch()
    
    let signupIsClicked = false;
    const signup = e=>{
        e.preventDefault()
        if(signupIsClicked) return null;
        signupIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form)
        spinnerRef.current.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+"/account/signup",{
            method: "post",
            credentials: 'include',
            body: data
        }).then(async res=>{
            if(res.ok)
                return await res.json()
            else
                throw await res.json()
        }).then((data)=>{
            form.reset()
            setVerifPage(data)
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnerRef.current.classList.add("d-none")
            signupIsClicked = false
        })
    }

    const passwordErr = e=>{
        feedbackRef.current.nextElementSibling.pattern = e.target.value
        const err = passwordValidation(e.currentTarget.value);
        if(!err) return null;
        feedbackRef.current.innerText = err;
    }

    return <>
        {verifPage? 
            <Verif id={verifPage.id} expiration={verifPage.expiration}/>
        :
            <div className="container row mx-auto text-center justify-content-center">
                <h1 className="text-primary mt-5">Create Account</h1>
                <form className="signup col-11 col-sm-10 col-md-7 col-lg-5 needs-validation mt-5" method="post" onSubmit={signup}>
                    <div className='row m-auto mb-3 gap-3'>
                        <input className="form-control col-12 col-md" type="text" pattern="^[A-Za-z][a-zA-Z_]{1,}" name="firstName" placeholder="enter your first name" required />
                        <input className="form-control col-12 col-md" type="text" pattern="^[A-Za-z][a-zA-Z_]{1,}" name="lastName" placeholder="enter your last name" required />
                    </div>
                    <div className='input-group'>
                        <UsernameInput/>
                        <div className="invalid-feedback">The username must have at least 3 letters or numbers, contain no spaces or special characters, and cannot start with a number.</div>
                    </div>
                    
                    <input className="form-control mt-3" type="email" name="email" placeholder="enter your email" required />
                    
                    <div className="password-container">
                        <input className="form-control mt-3" type="password" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" name="password" placeholder="Enter a password" required onKeyUp={passwordErr}/>
                        <div className="invalid-feedback main-password w-auto" ref={feedbackRef}></div>
                        <input className="form-control repeat-pass mt-3" type="password" placeholder="Enter the password again" required />
                        <div className="invalid-feedback repeated-password w-auto">The password not matched</div>
                    </div>
                    
                    <div className="form-check mt-3 d-flex justify-content-center align-itesm-center gap-3">
                        <input className="form-check-input" name='licenceAccept' id="check" type="checkbox" required />
                        <label className="form-check-lable" htmlFor="check">
                            accept our licence
                        </label>
                        <div className="invalid-feedback w-auto">You must agree before submitting.</div>
                    </div>
                    
                    <button className="btn btn-primary my-3" type="submit" onClick={addBsVal}>
                        <span className="spinner-border spinner-border-sm d-none me-1" ref={spinnerRef} aria-hidden="true"></span>
                        Sign Up
                    </button>
                </form>
                <div className="signup-option">
                    <div>Aleardy have an account ?</div>
                    <Link to="/account/login">Login</Link>
                    <div className='d-flex justify-content-center align-items-center mb-2'>
                        <hr className='w-25'/>
                        <span className='mx-3'> or </span>
                        <hr className='w-25'/>
                    </div>
                    <a href={process.env.REACT_APP_API_SERVER+'/account/oauth/google'} className='rounded btn btn-primary'>
                    <FontAwesomeIcon className='fs-4 me-3' icon='fa-brands fa-google'/>
                        Continue With Google
                    </a>
                </div>
            </div>
        }
    </>
}