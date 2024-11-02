import { createSlice } from "@reduxjs/toolkit"

export const modeSlice = createSlice({
    name: "mode",
    initialState: "",
    reducers:{
        setMode: (mode, action)=> action.payload,
        toggleMode: mode =>{
            if(mode === 'dark'){
                window.localStorage.setItem('mode','light')
                return 'light'
            }else{
                window.localStorage.setItem('mode','dark')
                return 'dark'
            }
        }
    }
})

export const {setMode, toggleMode} = modeSlice.actions;

export default modeSlice.reducer