    import express from "express";
    import dotenv from "dotenv";
    import cors from "cors";
    import cookieParser from "cookie-parser";
    import connectDB  from "./config/db.js";
    import  "dotenv/config";
    
    const PORT = process.env.PORT || 5000;
    
    
    const app = express();
    
    app.use(cors({origin:process.env.CLIENT_URL, credentials: true}));
    app.use(express.json());
    app.use(cookieParser());
    
    app.get('/',(req,res)=>{
        res.send("TradeWise API Running");
    });
    
    
    import authRoutes from "./routes/auth.routes.js";
    import HealthCheckRoute from "./routes/HealthCheck.js";
    import PortfolioRoutes from "./routes/portfolio.routes.js";
    import TradeRoutes from "./routes/trade.routes.js";
    import TransactionRoutes from "./routes/transaction.routes.js";
    
    app.use("/api/auth",authRoutes);
    app.use("/Health",HealthCheckRoute);
    app.use("/portfolio",PortfolioRoutes);
    app.use("/trade",TradeRoutes);
    app.use("/transaction",TransactionRoutes);
    
    app.listen(PORT,()=>{
        console.log(`🚀 Server running on port ${PORT}`);
        connectDB();
    });