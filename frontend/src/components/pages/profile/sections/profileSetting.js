import React, { useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { addAlert } from '../../../../redux/alertSlice';
import { addBsVal } from '../../../../utils';
import { useNavigate, useOutletContext } from "react-router-dom";

export default function ProfileSetting() {
    const { user, mode } = useOutletContext();
    const [profileOptions, setProfileOptions] = useState({});
    const previewRef = useRef();
    const spinnerRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate()
    
    const profileFormValid= e=>{
        setProfileOptions(options=>{
            const inputName = e.target.name;
            const inputValue = e.target.value;
            const updatedOptions = {...options, [inputName]: inputValue};

            if(inputName === 'birthdate' && inputValue === user.birthdate) 
                delete updatedOptions.birthdate;
            
            if(!inputValue)
                delete updatedOptions[inputName];

            if(profileOptions.oldPass && inputName === "newPass"){
                if(!inputValue.match(/.*[a-z]/g)) updatedOptions.newPassFeedBack = "Password should contain at least one lowercase"
                else if(!inputValue.match(/.*\d/g)) updatedOptions.newPassFeedBack = "Password should contain at least one number"
                else if(!inputValue.match(/.*[A-Z]/g)) updatedOptions.newPassFeedBack = "Password should contain at least one uppercase"
                else if(!inputValue.match(/.{8,}/g)) updatedOptions.newPassFeedBack = "Password should be at least 8 or more characters"
                else delete updatedOptions.newPassFeedBack
            }else if(inputName === "newPass") delete updatedOptions.newPassFeedBack

            return updatedOptions
        })
    }

    const changeProfile = e=>{
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        spinnerRef.current.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+"/account/profile/update", {
            method:"put",
            credentials: "include",
            body: formData
        }).then(async res=>{
            if(res.ok)
                dispatch(addAlert({type: "success", msg: "The profile updated successfully!"}))
            else
                throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type: "danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type: "danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnerRef.current.classList.add("d-none")
            form.reset();
            previewRef.current.src = null;
            setProfileOptions({})
        })
    }
    
    let deleteAccIsClicked = false;
    const deleteAccount = ()=>{
        if(deleteAccIsClicked) return null;
        deleteAccIsClicked = true
        if(!window.confirm("Are you sure you want to DELETE the account permanently?")) return null
        navigate("/")
        fetch(process.env.REACT_APP_API_SERVER+"/account/delete",{
            method: "delete",
            credentials: 'include'
        }).then(async res=>{
            if(!res.ok)
                throw await res.json()
        }).catch(err=>{
            if(err.msg){
                dispatch(addAlert({type:"danger", msg: err.msg}))
            }else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{deleteAccIsClicked = false})
    }

    let toggleIsClicked = false;
    const toggleEmailNotif = ()=>{
        if(toggleIsClicked) return null;
        toggleIsClicked = true
        fetch(process.env.REACT_APP_API_SERVER+"/account/profile/email-notif/toggle",{
            credentials: 'include'
        }).then(async res=>{
            if(!res.ok)
                throw await res.json()
        }).catch(err=>{
            if(err.msg){
                dispatch(addAlert({type:"danger", msg: err.msg}))
            }else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{toggleIsClicked = false})
    }

    if(!user)
        return null
    return <>
        <form className="account-setting border p-2 rounded" onSubmit={changeProfile}>
            <div className="text-end">
                <button className="btn btn-success" type="submit" onClick={addBsVal} disabled={!Object.values(profileOptions).filter(val=>val?true:false).length}>
                    <span className="spinner-border spinner-border-sm d-none me-1" ref={spinnerRef} aria-hidden="true"></span>
                    Save
                </button>
            </div>
            <img className='preview-image d-block w-50 mx-auto' alt="" ref={previewRef}/>
            <div className="input-group my-3 z-1">
                <span className="input-group-text">Change Image:</span>
                <input
                    className="form-control"
                    type="file"
                    name="profile-img"
                    onChange={e=>{profileFormValid(e);previewRef.current.src = e.currentTarget.files.length? URL.createObjectURL(e.currentTarget.files[0]):""}}
                />
            </div>
            <p>The image should be (png, jpg, or jpeg) only</p>

            <div className='input-group z-1'>
                <span className="input-group-text">First Name:</span>
                <input className="form-control w-25" type="text" pattern="^[A-Za-z][a-zA-Z_]{1,}" onKeyUp={profileFormValid} name="firstName" placeholder={user.firstName}/>
                <span className="input-group-text ">Last Name:</span>
                <input className="form-control w-25" type="text" pattern="^[A-Za-z][a-zA-Z_]{1,}" onKeyUp={profileFormValid} name="lastName" placeholder={user.lastName}/>
            </div>

            <div className="input-group my-3 z-1">
                <span className="input-group-text">Birthdate:</span>
                <input
                    className="form-control"
                    type="date"
                    name="birthdate"
                    onChange={profileFormValid}
                    defaultValue={profileOptions.birthdate? profileOptions.birthdate : user?.birthdate}
                />
            </div>

            <div className="input-group my-3 z-1">
                <span className="input-group-text">Address:</span>
                <input
                    className="form-control"
                    type="text"
                    name="address"
                    onKeyUp={profileFormValid}
                    placeholder={user.address?user.address:"Enter your address"}
                />
            </div>

            {!user.oauth && 
            <div className="input-group mt-3 z-1">
                <span className="input-group-text rounded-bottom-0 rounded-top">Change Password:</span>
                <div className="w-100 border rounded-3 rounded-start-0 p-2">
                    <input
                        className="form-control mb-2"
                        type="password"
                        name="oldPass"
                        onKeyUp={profileFormValid}
                        placeholder="Enter The Old Password"
                        required = {profileOptions.newPass? true : false}
                    />
                    <div className="m-0 mb-2">
                        <input
                            className="form-control"
                            type="password"
                            name="newPass"
                            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                            onKeyUp={profileFormValid}
                            placeholder="Enter The New Password"
                            required = {profileOptions.oldPass? true : false}
                        />
                    <div className="invalid-feedback main-password w-auto text-center">{profileOptions.newPassFeedBack}</div>
                    </div>
                    <div className="m-0">
                        <input
                            className="form-control"
                            type="password"
                            name="repeatNewPass"
                            pattern={profileOptions.newPass}
                            onKeyUp={profileFormValid}
                            placeholder="Enter The New Password Again"
                            required = {profileOptions.oldPass? true : false}
                        />
                        <div className="invalid-feedback main-password w-auto text-center">
                            The two fields are not matched
                        </div>
                    </div>
                </div>
            </div>}
        </form>
        <div className="input-group my-3">
            <span className="input-group-text">Send Email Notifications:</span>
            <button
                className={`btn btn-${user.emailNotif? 'outline-secondary' : mode==='light'?'primary':'secondary'}`}
                type="button"
                onClick={toggleEmailNotif}
                disabled={user.emailNotif}
            >
                On
            </button>
            <button
                className={`btn btn-${user.emailNotif? mode==='light'?'primary':'secondary' : 'outline-secondary'}`}
                type="button"
                onClick={toggleEmailNotif}
                disabled={!user.emailNotif}
            >
                Off
            </button>
        </div>
        <div className="input-group my-3">
            <span className="input-group-text text-danger">Delete The Account:</span>
            <button
                className="btn btn-outline-danger"
                type="button"
                onClick={deleteAccount}
            >
                Delete
            </button>
        </div>
    </>
}