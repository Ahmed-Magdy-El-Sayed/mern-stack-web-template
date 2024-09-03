import React from "react";
import { useCookies } from "react-cookie";
import { Outlet, Navigate } from "react-router-dom";

export default function ProtectedRoute({forAuthRoute}){
    const [cookies] = useCookies();
    const auth = cookies.user?Object.keys(cookies.user).length:null
    if(forAuthRoute)
        return auth? <Outlet/> : <Navigate to="/account/login"/>
    else
        return auth? <Navigate to="/"/> : <Outlet/>
}