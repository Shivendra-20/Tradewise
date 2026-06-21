import Portfolio from "../models/Portfolio.js";

export const getPortfolio = async (req ,res) => {
    try {
        const holding = await Portfolio.find({userId:req.user._id});

        res.json(holdings); 
    } catch(error){
        res.status(500).json({ message:error.message});
    }
}