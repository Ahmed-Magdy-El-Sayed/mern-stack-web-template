import { createSlice } from "@reduxjs/toolkit"

export const userSlice = createSlice({
    name: "user",
    initialState: {},
    reducers:{
        addUser: (user, action)=> action.payload,
        incNotifBadge: user=> ({...user, notifsNotReaded: user.notifsNotReaded+1}),
        clearUser: ()=>({})
    }
})

export const {addUser, incNotifBadge, clearUser} = userSlice.actions;

export default userSlice.reducer