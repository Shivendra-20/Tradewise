import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
  const { JWT_SECRET } = process.env;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

  const secure = process.env.NODE_ENV === "production";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
  });

  return token;
};

const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  balance: user.virtualBalance,
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const userExist = await User.findOne({ email: email.toLowerCase().trim() });

    if (userExist) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      success: true,
      ...formatUserResponse(user),
      token: generateToken(user._id, res),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    return res.status(500).json({
      success: false,
      message: `Error in Register User: ${error.message}`,
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and Password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ success: false, message: "Invalid Credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      ...formatUserResponse(user),
      token: generateToken(user._id, res),
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logoutUser = (req, res) => {
  const secure = process.env.NODE_ENV === "production";

  res.cookie("jwt", "", {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    expires: new Date(0),
  });

  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    balance: req.user.virtualBalance,
    initialBalance: req.user.initialBalance,
    role: req.user.role,
    avatar: req.user.avatar,
    lastLogin: req.user.lastLogin,
    createdAt: req.user.createdAt,
  });
};
