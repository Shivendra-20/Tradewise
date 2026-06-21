import Transaction from "../models/Transaction.js";

export const getTransactions =
async(req,res)=>{

const transactions = await Transaction.find({userId:req.user._id}).sort({createdAt:-1});

res.json(transactions);

};