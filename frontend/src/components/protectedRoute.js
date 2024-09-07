import React from "react";
import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";

export default function ProtectedRoute({forAuthRoute}){
    const user = useSelector(state=> Object.keys(state.user).length? state.user : null)
    if(forAuthRoute)
        return user? <Outlet/> : <Navigate to="/account/login"/>
    else
        return user? <Navigate to="/"/> : <Outlet/>
}