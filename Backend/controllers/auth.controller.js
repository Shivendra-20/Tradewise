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

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExist = await User.findOne({ email: email.toLowerCase().trim() });

    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      balance: user.virtualBalance,
      token: generateToken(user._id, res),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({
      message: `Error in Register User: ${error.message}`,
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }

  console.log("Password : ",password);

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+password"
    );

    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      balance: user.virtualBalance,
      token: generateToken(user._id, res),
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  res.status(200).json({
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
