import express from "express";
import { registerUser,loginUser, getProfile } from "../controllers/auth.controller.js";
import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/profile",protectRoute,getProfile)

export default router;
