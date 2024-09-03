import "./navBar.css"
import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { profileRoute, defaultUserImg, accountImagesPath, addBsVal } from '../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { socket } from '../socket';
import { useDispatch, useSelector} from 'react-redux';
import { clearUser, incNotifBadge } from '../redux/userSlice';
import { addAlert } from '../redux/alertSlice';

let readNotifIsOpend = false
export default function NavBar() {
    const user = useSelector(state=> Object.keys(state.user).length? state.user : null);
    const [notifs, setNotifs] = useState([]);
    const [changeProfileAlert, setchangeProfileAlert] = useState();
    const [profileOptions, setProfileOptions] = useState({});
    const previewRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate()

    useEffect(()=>{
        socket.on("notify", ()=>{
            dispatch(incNotifBadge())
            fetch(process.env.REACT_APP_API_SERVER+"/account/update",{ 
                method: "put",
                credentials: "include"
            })
        })

        socket.on("forceLogout", ()=>{
            window.localStorage.removeItem("warnings")
            logout()
        })
    },[])
    
    const readNotif= ()=>{
        if(!readNotifIsOpend)
            fetch(process.env.REACT_APP_API_SERVER+"/account/notif/read", {
                method:"post",
                credentials: "include"
            }).then(async res=>{
                if(res.ok)
                    return await res.json();
                else
                    throw await res.json();
            }).then(notifs=>{
                setNotifs(notifs);
            }).catch(err=>{
                if(err.msg)
                    dispatch(addAlert({type:"danger", msg: err.msg}))
                else{
                    console.error(err)
                    dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
                }
            })
        else if(notifs.length)
            setNotifs(notifs=>notifs.map(notif=>({...notif, isReaded: true})))
        readNotifIsOpend = !readNotifIsOpend
    }
    
    const clearNotif= ()=>{
        fetch(process.env.REACT_APP_API_SERVER+"/account/notif/clear", {
            method:"delete",
            credentials: "include"
        }).then(async res=>{
            if(res.ok)
                setNotifs([])
            else
                throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
    }


    const changeProfileValid= e=>{
        setProfileOptions(options=>{
            const inputName = e.currentTarget.name;
            const inputValue = e.currentTarget.value;
            const updatedOptions = {...options, [inputName]: inputValue};
            if(inputName === "newPass"){
                if(!inputValue.match(/.*[a-z]/g)) updatedOptions.newPassFeedBack = "password should contain at least one lowercase"
                else if(!inputValue.match(/.*\d/g)) updatedOptions.newPassFeedBack = "password should contain at least one number"
                else if(!inputValue.match(/.*[A-Z]/g)) updatedOptions.newPassFeedBack = "password should contain at least one uppercase"
                else if(!inputValue.match(/.{8,}/g)) updatedOptions.newPassFeedBack = "password should be at least 8 or more characters"
                else updatedOptions.newPassFeedBack = ""
            }
            return updatedOptions
        })
    }
    
    const changeProfile = e=>{
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        if(!profileOptions['profile-img'] && !profileOptions.oldPass) return setchangeProfileAlert({state: "danger", msg: "The input fields are empty!"})
        fetch(process.env.REACT_APP_API_SERVER+"/account/profile/update", {
            method:"put",
            credentials: "include",
            body: formData
        }).then(async res=>{
            if(res.ok)
                setchangeProfileAlert({state: "success", msg: "The profile updated successfully!"})
            else
                throw await res.json();
        }).catch(err=>{
            if(err.msg)
                setchangeProfileAlert({state: "danger", msg: err.msg})
            else{
                console.error(err)
                setchangeProfileAlert({state: "danger", msg: "Something Went Wrong, Try Again!"})
            }
        }).finally(()=>{form.reset()})
    }
    
    let logoutIsClicked = false;
    const logout = ()=>{
        if(logoutIsClicked) return null;
        logoutIsClicked = true
        fetch(process.env.REACT_APP_API_SERVER+"/account/logout",{
            credentials: 'include'
        }).then(async res=>{
            if(res.ok){
                window.location.href = "/"
                dispatch(clearUser())
            }else
                throw await res.json()
        }).catch(err=>{
            if(err.msg){
                dispatch(addAlert({type:"danger", msg: err.msg}))
            }else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{logoutIsClicked = false})
    };

    let deleteAccIsClicked = false;
    const deleteAccount = ()=>{
        if(deleteAccIsClicked) return null;
        deleteAccIsClicked = true
        if(!window.confirm("Are you sure you want to DELETE the account permanently?")) return null
        fetch(process.env.REACT_APP_API_SERVER+"/account/delete",{
            method: "delete",
            credentials: 'include'
        }).then(async res=>{
            if(res.ok){
                window.location.href = "/"
                dispatch(clearUser())
            }else
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

    return (
        <>
            <nav className="navbar navbar-dark navbar-expand-md bg-dark top-0 z-3">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/">
                        CodeXpress
                    </Link>

                    {/* Links Section */}
                    <button
                        className="navbar-toggler text-dark border-0"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav ms-auto me-auto">
                        {
                            [
                                { title: 'Home', href: '/' },
                                { title: 'Login', href: '/account/login' },
                                { title: 'Sign Up', href: '/account/signup' }, 
                                { title: 'Accounts Control', href: '/account/control' },
                                { title: 'Content Control', href: '/content/control' }
                            ].map((link, i) => {
                                if ((i === 1 || i===2) && user)
                                    return null;
                                else if(i > 2 && !user)
                                    return null;
                                else if(i === 3 && user.role !== "admin")
                                    return null;
                                else if(i === 4 && (user.role !== "editor" && user.role !== "admin"))
                                    return null;
                                else
                                    return (
                                        <li className="nav-item" key={link.title}>
                                            <NavLink key={i} className={`nav-link ps-0 pe-lg-3`} to={link.href} end>
                                                {link.title}
                                            </NavLink>
                                        </li>
                                    );
                                
                            })
                        }
                        </ul>

                        {/* Account Info */}
                        {user &&
                            <div className="my-account-info d-flex gap-3 justify-content-end align-items-center">
                                {/* Notifications */}
                                <div className="dropdown notif position-relative">
                                    <FontAwesomeIcon
                                        icon= "fa-regular fa-bell"
                                        className="fs-5 text-white icon"
                                        data-bs-toggle="dropdown"
                                        onClick={readNotif}
                                        onBlur={readNotif}
                                    />
                                    <ul className="dropdown-menu text-center notif-content">
                                        {notifs.length?
                                        <>
                                            {notifs.map((notif, i)=>
                                                <li className="mb-3" key={i}>
                                                    <Link className={`text-decoration-none text-break ${notif.isReaded? "text-secondary" : "text-black"}`} to={notif.href} onClick={readNotif}> {notif.msg} </Link>
                                                    {!notif.isReaded &&
                                                        <span className="rounded-circle bg-primary text-white p-1 ps-2 pe-2 fs-6"> {notif.num? notif.num : 1}</span>
                                                    }
                                                </li>
                                            )}
                                            <a className="text-primary text-decoration-none" onClick={clearNotif}> Clear Notifications </a>
                                        </>
                                        :<p>No notifications</p>
                                        }
                                    </ul>
                                    <span
                                        className={`badge position-absolute top-0 start-100 translate-middle rounded-circle bg-danger p-1 ${user.notifsNotReaded ? '' : 'd-none'}`}
                                        style={{ fontSize: '10px' }}
                                    > {user.notifsNotReaded} </span>
                                </div>
                                
                                {/* Account Setting */}
                                <div className="dropdown setting">
                                    <img
                                        className="dropdown-toggle img-icon rounded-circle cur-pointer"
                                        src={accountImagesPath+user.img}
                                        data-bs-toggle="dropdown"
                                        alt=""
                                        onError={defaultUserImg}
                                    />
                                    <ul className="dropdown-menu end-0 text-center" style={{ left: 'unset' }}>
                                        <li className="ms-2">
                                            Hello <h6 className="d-inline m-0">{user.name}</h6>
                                        </li>
                                        <hr className="mt-2" />
                                        <li>
                                            <div
                                                className="edit-profile-toggler"
                                                role="button"
                                                data-bs-toggle="modal"
                                                data-bs-target=".modal.edit-profile"
                                            >
                                                Account Setting
                                            </div>
                                        </li>
                                        <li className="mt-2">
                                            <div
                                                className='cur-pointer'
                                                onClick={()=>navigate(profileRoute+user._id)}
                                            >
                                                Profile
                                            </div>
                                        </li>
                                        <li className="mt-2">
                                            <div
                                                className="text-danger cur-pointer"
                                                onClick={()=>logout()}
                                            >
                                                Logout
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </nav>
            {user&&
            <div className="modal edit-profile fade">
                <div className="modal-dialog">
                    <div className="modal-content overflow-auto">
                        <form onSubmit={changeProfile}>
                            <div className="modal-header">
                                <h1 className="modal-title fs-5">Account Setting</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <img
                                    className="img-icon-lg"
                                    src={accountImagesPath+user.img}
                                    alt='user-img'
                                    onError={defaultUserImg}
                                />
                                <h1 className="d-inline ms-3">{user.name}</h1>
                                <img className='preview-image d-block w-50 mx-auto' ref={previewRef}/>
                                {changeProfileAlert?
                                    <div className={'alert alert-'+changeProfileAlert.state+' fade show w-100 text-center p-2 m-0'}> 
                                    {changeProfileAlert.msg}
                                    </div>
                                :""}
                                <div className="input-group my-3">
                                    <span className="input-group-text">Change Image</span>
                                    <input
                                        className="form-control"
                                        type="file"
                                        name="profile-img"
                                        onChange={e=>{changeProfileValid(e);previewRef.current.src = e.currentTarget.files.length? URL.createObjectURL(e.currentTarget.files[0]):""}}
                                    />
                                </div>
                                <p>The image should be (png, jpg, or jpeg) only</p>
                                <div className="input-group my-3">
                                    <span className="input-group-text">Change Password</span>
                                    <div className="w-100">
                                        <input
                                            className="form-control mb-2"
                                            type="password"
                                            name="oldPass"
                                            onKeyUp={changeProfileValid}
                                            placeholder="Enter The Old Password"
                                            required = {profileOptions.newPass? true : false}
                                        />
                                        <div className="m-0 mb-2">
                                            <input
                                                className="form-control"
                                                type="password"
                                                name="newPass"
                                                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                                                onKeyUp={changeProfileValid}
                                                placeholder="Enter The New Password"
                                                required = {profileOptions.oldPass? true : false}
                                            />
                                        <div className="invalid-feedback main-password w-auto text-center">{profileOptions.newPassFeedBack}</div>
                                        </div>
                                        <div className="m-0 mb-2">
                                            <input
                                                className="form-control"
                                                type="password"
                                                name="repeatNewPass"
                                                pattern={profileOptions.newPass}
                                                onKeyUp={changeProfileValid}
                                                placeholder="Enter The New Password Again"
                                                required = {profileOptions.oldPass? true : false}
                                            />
                                            <div className="invalid-feedback main-password w-auto text-center">
                                                The two fields are not matched
                                            </div>
                                        </div>
                                    </div>
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
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-success" type="submit" onClick={addBsVal}>
                                Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            }
        </>
    )
}
