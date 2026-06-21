import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
     symbol:String,

    type:{
        type:String,
        enum:["BUY","SELL"]
    },

    quantity:Number,

    price:Number
},
{
    timestamps:true
});

const TransactionSchema = mongoose.model("Transaction",transactionSchema);

export default TransactionSchema;