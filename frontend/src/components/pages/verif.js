import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import { URLSearchParamsData } from '../../utils';

export default function Verif({ id, expiration }) {
    const [timeReminded, setTimeReminded] = useState();
    const spinnerRef = useRef({})
    const dispatch = useDispatch()

    function getRemind(time) {
        const min = (parseFloat(time) - new Date().getTime()) / 1000 / 60;
        const sec = Math.floor((Math.abs(min) % 1) * 60)
        return `${Math.floor(min)}:${("0"+sec).slice(-2)}`
    }

    useEffect(()=>{
        const addReminder = setInterval(() => {
            const remind = getRemind(expiration)
            if(parseInt(remind) >= 0){
                setTimeReminded(remind)
            }else {
                setTimeReminded(null)
                clearInterval(addReminder)
            }
        }, 1000);
    })
    
    let verifIsClicked = false;
    const verif = e=>{
        e.preventDefault()
        if(verifIsClicked) return null;
        verifIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form)
        spinnerRef.current.verif.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+"/verify",{
            method: "post",
            credentials: "include",
            body: data
        }).then(async res=>{
            if(!res.ok)
                throw await res.json()
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnerRef.current.verif.classList.add("d-none")
            verifIsClicked = false
        })
    }

    let resendIsClicked = false;
    const resendEmail = ()=>{
        if(resendIsClicked) return null;
        resendIsClicked = true;
        spinnerRef.current.resend.classList.remove("d-none")
        fetch(`${process.env.REACT_APP_API_SERVER}/verify/resend-email/${id}`)
        .then(async res=>{
            if(res.ok)
                dispatch(addAlert({type: "success", msg: "The code was resent to your email"}))
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
            spinnerRef.current.resend.classList.add("d-none");
            resendIsClicked = false
        })
    }
    
    let newCodeIsClicked = false;
    const sendNewCode = ()=>{
        if(newCodeIsClicked) return null;
        newCodeIsClicked = true
        spinnerRef.current.sendNew.classList.remove("d-none")
        fetch(`${process.env.REACT_APP_API_SERVER}/verify/new-code/${id}`)
        .then(async res=>{
            if(res.ok)
                dispatch(addAlert({type: "success", msg: "New Code was sent to your account"}))
            else
                throw await res.json()
        }).catch(err=>{
            spinnerRef.current.sendNew.classList.add("d-none")
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            newCodeIsClicked = false
        })
    }

    return <>
        <div className="d-absolute top-0 left-0 w-100 h-100 row justify-content-center text-center mt-5">
            <h1 className="mb-3 text-primary">Verify Your Email</h1>
            <p>We send verification code to your email.</p>
            <br />
            <p>if you didn't receive it:
                <a className="text-primary" onClick={resendEmail}> Click Here</a>
                <span className="spinner-border spinner-border-sm text-primary d-none me-1" ref={ref=> spinnerRef.current.resend = ref} aria-hidden="true"/>
            </p>
            <form className="needs-validation col-11 col-sm-6" onSubmit={verif}>
                <input type="text" name="id" defaultValue={id} hidden />
                
                <input className="form-control" type="text" name="code" placeholder="enter your verification code here" required />
                <div className="time-reminded text-danger" data-expiration={expiration}></div>
                
                <button className="form-validation btn btn-primary my-3" type="submit">
                    <span className="spinner-border spinner-border-sm d-none me-1" ref={ref=> spinnerRef.current.verif = ref} aria-hidden="true"/>
                    Verify
                </button>
            </form>
            {timeReminded ? <div className="text-danger w-75 m-auto">The Code will Expired in {timeReminded}</div> :
                <div className="text-danger w-75 m-auto">
                    The Code is Expired, 
                    <span className='text-primary cur-pointer' onClick={sendNewCode}>
                        Click Here 
                        <span className="spinner-border spinner-border-sm text-primary d-none me-1" ref={ref=> spinnerRef.current.sendNew = ref} aria-hidden="true"/>
                    </span> to get new code
                </div>
            }
        </div>
    </>
}