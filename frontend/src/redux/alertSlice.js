import { createSlice } from "@reduxjs/toolkit"

export const alertSlice = createSlice({
    name: "alerts",
    initialState: [],
    reducers:{
        addAlert: (alerts, action)=> [...alerts, action.payload],
        deleteAlert: alerts=> alerts.slice(0,-1)
    }
})

export const {addAlert, deleteAlert} = alertSlice.actions;

export default alertSlice.reducer