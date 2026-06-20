import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (userId,res)=>{
    const {JWT_SECRET} = process.env;

    if(!JWT_SECRET){
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET,{ expiresIn:"7d"});

    const secure = process.env.NODE_ENV === "production"? true: false;

    res.cookie("jwt",token,{
        maxAge:7*24*60*60*1000, // miliseconnd
        httpOnly: true,  // // prevent XSS attacks : cross-site scripting 
         sameSite: secure ? "none" : "lax", // CSRF attacks
        secure: secure,
    });

    return token;
};

// Register User

export const registerUser = async (req, res)=>{
    try {
        const {name, email, password} = req.body;
        
        if(!name || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }

        if(password.length < 6){
            return res.status(400).json({message: "Password must be atleast 6 characters"});
        }

        // Check if emails valid : regex
        const emailRegex =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/ ;
        if(!emailRegex.test(email)){
            return res.status(400).json({message: "Invalid email format"});
        }

        const userExist =await User.findOne({email});

        console.log("Database:", User.db.name);
        console.log("Collection:", User.collection.name);

        if(userExist){
            console.log("userExist =", userExist);
            return res.status(400).json({message:"User already exists",});
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const user = await User.create({
            name,
            email,
            password:hashedPassword,
        });

        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            balance:user.balance,
            token:generateToken(user._id,res),
        });

    } catch (error) {
        res.status(500).json({
            message:`Error in Register User : ${error.message}`,
        });
    }
};

// Login User

export const loginUser = async (req, res)=>{
    const {email ,password} = req.body;

    if(!email || !password){
        return res.status(400).json({message:"Email and Password are required"});
    }

    try {
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message:"Invalid Credentials"});
         // Never tell the client which is field is incorrect : email or password

        const isPassCorrect = await bcrypt.compare(password,user.password);
        if(!isPassCorrect) res.status(400).json({message:"Invalid Credentials"});
        
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            balance: user.balance,
            token: generateToken(user._id,res),
        })

    }       
    catch (error) {
        console.log("Error in login controller : ",error);
        res.status(500).json({message: "Internal server error"});
    }
}

export const getProfile = async (req ,res)=>{
    res.status(200).json(req.user);
}