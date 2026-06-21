import mongoose, { mongo } from "mongoose";

const portfolioSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        symbol:{
            type:String,
            required:true,
        },
        quantity:{
            type:Number,
            required:true, 
        },
        averagePrice:{
            type:Number,
            required:true,
        }
    }
);

const Portfolio = mongoose.model("portfolio",portfolioSchema);

export default Portfolio;