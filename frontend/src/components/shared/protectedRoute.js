import React from "react";
import { useCookies } from 'react-cookie';
import { Outlet, Navigate } from "react-router-dom";

export default function ProtectedRoute({forAuthRoute}){
    const [cookies] = useCookies(['user']);
    if(forAuthRoute)
        return cookies.user? <Outlet/> : <Navigate to="/account/login"/>
    else
        return cookies.user? <Navigate to="/"/> : <Outlet/>
}