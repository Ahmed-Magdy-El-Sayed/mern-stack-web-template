import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { Outlet, Navigate } from "react-router-dom";

export default function ProtectedRoute({forAuthRoute}){
    const [cookies] = useCookies();
    const [auth, setAuth] = useState(cookies.user?Object.keys(cookies.user).length:null)
    useEffect(()=>{
        setAuth(cookies.user?Object.keys(cookies.user).length:null)
    },[cookies])
    if(forAuthRoute)
        return auth? <Outlet/> : <Navigate to="/account/login"/>
    else
        return auth? <Navigate to="/"/> : <Outlet/>
}