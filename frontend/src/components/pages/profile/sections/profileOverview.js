import React from "react";
import { useOutletContext } from "react-router-dom";

export default function ProfileOverview() {
    const {user} = useOutletContext();

    return <div className="text-secondary text-center"> For feature customization </div>
}