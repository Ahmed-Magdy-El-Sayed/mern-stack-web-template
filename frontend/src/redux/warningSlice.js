import { createSlice } from "@reduxjs/toolkit"

export const warningSlice = createSlice({
    name: "warnings",
    initialState: [],
    reducers:{
        addWarnings: (warnings, action)=> [...warnings, ...action.payload],
        deleteWarning: warnings=> warnings.slice(1)
    }
})

export const {addWarnings, deleteWarning} = warningSlice.actions;

export default warningSlice.reducer