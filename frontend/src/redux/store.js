import { configureStore } from "@reduxjs/toolkit";
import modeReducer from "./modeSlice";
import alertReducer from "./alertSlice";
import warningReducer from "./warningSlice";

export default configureStore({
    reducer:{
        mode: modeReducer,
        alerts: alertReducer,
        warnings: warningReducer
    }
})