import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import Transaction from "../models/Transaction.js";

export const buyStock = async (req, res) => {
    try {
        
        //Todo 
        // 1. Don't take price from req.body
        // 2.Use mongodb session for trancsaction
        // 3.Add limit orders(user kis price pr buy krna chahta h): PENDING EXECUTED CANCELLED 

        const { symbol, quantity, price } = req.body;

        // Input Validation
        if (!symbol || !quantity || !price) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (quantity <= 0 || price <= 0) {
            return res.status(400).json({
                message: "Quantity and price must be greater than 0"
            });
        }

        if (!Number.isInteger(quantity)) {
            return res.status(400).json({
                message: "Quantity must be an integer"
            });
        }

        const totalCost = quantity * price;

        // Find User
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check Balance
        if (user.balance < totalCost) {
            return res.status(400).json({
                message: "Insufficient Balance"
            });
        }

        // Deduct Balance
        user.balance -= totalCost;
        await user.save();

        // Check Existing Holding
        let holding = await Portfolio.findOne({
            userId: user._id,
            symbol
        });

        if (holding) {

            const totalShares = holding.quantity + quantity;

            holding.averagePrice =((holding.averagePrice * holding.quantity) + (price * quantity)) / totalShares;

            holding.quantity = totalShares;

            await holding.save();

        } else {

            holding = await Portfolio.create({
                userId: user._id,
                symbol,
                quantity,
                averagePrice: price
            });

        }

        // Create Transaction Record
        await Transaction.create({
            userId: user._id,
            symbol,
            type: "BUY",
            quantity,
            price
        });

        return res.status(201).json({
            message: "Stock Purchased Successfully",
            balance: user.balance,
            holding
        });

    } catch (error) {

        console.error("Buy Stock Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

export const sellStock = async (req,res) => {
    try {
            const {symbol,quantity,price} = req.body;
            const user  = await User.findById(req.user._id);

            const holding = await Portfolio.findOne({userId:user._id,symbol});

           if(!holding || holding.quantity < quantity){
                return res.status(400).json({message:"Not enough shares"});
        }

        holding.quantity -= quantity;

        if(holding.quantity === 0){
            await holding.deleteOne();
        }
        else{
            await holding.save();
        }

        user.balance += quantity*price;
        await user.save();
        
        await Transaction.create({
            userId:user._id,
            symbol,
            type:"SELL",
            quantity,
            price
        });

        res.json({message:"Stock Sold"});
}
catch(error){
    res.status(500).json({message:error.message });
}

}