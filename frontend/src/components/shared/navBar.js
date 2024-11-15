import "./navBar.css"
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { profileRoute, defaultUserImg, accountImagesPath } from '../../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { socket } from '../../socket';
import { useDispatch} from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import { toggleMode } from "../../redux/modeSlice";
import { useCookies } from "react-cookie";

let readNotifIsOpend = false
export default function NavBar({mode}) {
    const user = useCookies(['user'])[0].user;
    const [notifs, setNotifs] = useState([]);
    const dispatch = useDispatch();
    const navigate = useNavigate()

    useEffect(()=>{
        socket.on("notify", ()=>{
            fetch(process.env.REACT_APP_API_SERVER+"/account/session-update",{ 
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
    
    let logoutIsClicked = false;
    const logout = ()=>{
        if(logoutIsClicked) return null;
        logoutIsClicked = true;
        fetch(process.env.REACT_APP_API_SERVER+"/account/logout",{
            credentials: 'include'
        }).then(async res=>{
            if(res.ok)
                window.location.href = "/account/login"; 
            else
                throw await res.json()
        }).catch(err=>{
            if(err.msg){
                dispatch(addAlert({type:"danger", msg: err.msg}))
            }else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            logoutIsClicked = false
        })
    };
    return (
        <>
            <nav className={`navbar ${mode === 'dark'? 'navbar-dark' : 'bg-primary'} navbar-expand-md sticky-top z-3`} data-bs-theme="dark">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/">
                        CodeXpress
                    </Link>
                    
                    {/* Links Section */}
                    <button
                        className="navbar-toggler border-0"
                        type="button"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#navbar"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className={`offcanvas offcanvas-end ${mode === 'light'&& "bg-primary"} ${document.querySelector('.navbar .offcanvas-backdrop')&& 'show'}`} id="navbar">
                        <div className="offcanvas-header">
                            <button className="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#navbar" aria-label="Close"></button>
                        </div>
                        <div className="offcanvas-body">

                            <ul className="navbar-nav mx-auto text-center">{
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
                                            <li className="nav-item" key={link.title} data-bs-dismiss="offcanvas" data-bs-target="#navbar">
                                                <NavLink key={i} className={`nav-link`} to={link.href} end>
                                                    {link.title}
                                                </NavLink>
                                            </li>
                                        );
                                })
                            }</ul>
                                    
                        </div>
                    </div>
                    {/* Account Data */}
                    <div className="setting d-flex gap-3 justify-content-sm-start justify-content-md-end align-items-center">
                    <FontAwesomeIcon
                        className='fs-5 cur-pointer text-light'
                        icon= {`fa-solid fa-${mode === 'light'? 'moon' : 'sun'}`}
                        onClick={()=> dispatch(toggleMode())}
                    />
                    {user && <>
                        {/* Notifications */}
                        <div className="dropdown notif position-relative">
                            <FontAwesomeIcon
                                icon= "fa-regular fa-bell"
                                className="fs-5 text-white cur-pointer"
                                data-bs-toggle="dropdown"
                                onClick={readNotif}
                                onBlur={readNotif}
                            />
                            <ul className="dropdown-menu text-center notif-content" data-bs-theme={mode}>
                                {notifs.length?
                                <>
                                    {notifs.map((notif, i)=>
                                        <li className="mb-3" key={i}>
                                            <Link className={`text-decoration-none text-break ${notif.isReaded? "text-secondary" : "text-"+(mode === 'light'?'dark':'light')}`} to={notif.href} onClick={readNotif}> {notif.msg} </Link>
                                            {!notif.isReaded &&
                                                <span className="rounded-circle bg-primary text-white p-1 ps-2 pe-2 fs-6"> {notif.num? (notif.num > 99 ? "+99" : notif.num) : 1}</span>
                                            }
                                        </li>
                                    )}
                                    <span className="text-primary text-decoration-none cur-pointer" onClick={clearNotif}> Clear Notifications </span>
                                </>
                                :<p>No notifications</p>
                                }
                            </ul>
                            <span
                                className={`badge position-absolute top-0 start-100 translate-middle rounded-circle bg-danger p-1 ${user.notifsNotReaded ? '' : 'd-none'}`}
                                style={{ fontSize: '10px' }}
                            > {user.notifsNotReaded} </span>
                        </div>
                        
                        {/* Account info */}
                        <div className="dropdown account-setting">
                            <img
                                className="dropdown-toggle img-icon rounded-circle cur-pointer"
                                src={accountImagesPath(user.img)}
                                data-bs-toggle="dropdown"
                                alt=""
                                onError={defaultUserImg}
                            />
                            <ul className="dropdown-menu end-0 text-center" style={{ left: 'unset' }}  data-bs-theme={mode}>
                                <li className="ms-2">
                                    Hello <h6 className="d-inline m-0">{user.firstName}</h6>
                                </li>
                                <hr className="mt-2" />
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
                                        onClick={logout}
                                    >
                                        Logout
                                    </div>
                                </li>
                            </ul>
                        </div>
                        </>}
                    </div>
                </div>
            </nav>
        </>
    )
}
