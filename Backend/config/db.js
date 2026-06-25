import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌MongoDB Not Connected :", error.message);
    process.exit(1);
  }
};

export default connectDB;
