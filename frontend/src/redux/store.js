import { configureStore } from "@reduxjs/toolkit";
import alertReducer from "./alertSlice";
import warningReducer from "./warningSlice";
import userSlice from "./userSlice";

export default configureStore({
    reducer:{
        user: userSlice,
        alerts: alertReducer,
        warnings: warningReducer
    }
})