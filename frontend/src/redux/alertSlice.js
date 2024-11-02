import { createSlice } from "@reduxjs/toolkit"

export const alertSlice = createSlice({
    name: "alerts",
    initialState: "",
    reducers:{
        addAlert: (alerts, action)=> action.payload,
        deleteAlert: ()=> ""
    }
})

export const {addAlert, deleteAlert} = alertSlice.actions;

export default alertSlice.reducer