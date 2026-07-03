import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,
};

const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
        login:(state,action) =>{
            state.user= action.payload.user;
            state.token = action.payload.token;
        },
       
        logout:(state)=>{

            state.user=null;
            state.token=null;

            localStorage.removeItem("token");
            localStorage.removeItem("user");

        }

    }

});

export const {login,logout}=authSlice.actions;

export default authSlice.reducer;