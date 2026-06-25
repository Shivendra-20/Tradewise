import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
{
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    stockId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Stock",
        required:true
    },

    orderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Order",
        required:true
    },

    action:{
        type:String,
        enum:["buy","sell"],
        required:true
    },

    quantity:{
        type:Number,
        required:true,
        min:1
    },

    price:{
        type:Number,
        required:true,
        min:0
    },

    total: {
      type: Number,
      min: 0,
    },
},
{
    timestamps:true
}
);

transactionSchema.pre("save", function () {
  this.total = this.quantity * this.price;
});

transactionSchema.index({
    userId:1,
    createdAt:-1
});

const Transaction = mongoose.model(
    "Transaction",
    transactionSchema
);

export default Transaction;