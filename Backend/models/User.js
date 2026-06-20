import mongoose from "mongoose";

const userScheme = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    balance:{
        type:Number,
        default:1000000,
    },   
},
    {
        timestamps:true,
    }
);

const User = mongoose.model("User",userScheme);

export default User;