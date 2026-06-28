import Watchlist from "../models/Watchlist.js";
import Stock from "../models/Stock.js";
import mongoose from "mongoose";

export const addToWatchlist = async (req, res) => {
  try {
    const { stockId, note } = req.body;  // 1. Get stockId and note

    if (!stockId) {
      return res.status(400).json({ success: false, message: "stockId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ success: false, message: "Invalid stockId format." });
    }

    const stockExists = await Stock.exists({ _id: stockId, isActive: true });
    if (!stockExists) {
      return res.status(404).json({ success: false, message: "Stock not found." });
    }

    if(note && note.length > 300){
      return res.status(400).json({success:false,message:"Note must be 300 characters or fewer."});
    }

    const userId = req.user._id;

    const item = await Watchlist.create({
      userId,
      stockId,
      ...(note?.trim() && { note:note.trim() }),
    });

    await item.populate("stockId","symbol name currentPrice changePercent sector");

    return res.status(201).json({
      success: true,
      message: "Stock added to watchlist successfully.",
      watchListItem: item,
    });
  } catch (error) {
    console.error("addToWatchlist Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Stock is already in your watchlist." });
    }

    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const stockId = req.params.id?.trim();

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ success: false, message: "Invalid stockId format." });
    }

    const deleted = await Watchlist.findOneAndDelete({userId: req.user._id,stockId,});

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Stock not found in your watchlist." });
    }

    return res.status(200).json({
      success: true,
      message: "Stock removed from watchlist.",
    });
  } catch (error) {
    console.error("removeFromWatchlist Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const updateWatchlistNote = async (req, res) => {
  try {
    const stockId = req.params.id?.trim();
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ success: false, message: "Invalid stockId format." });
    }

    const item = await Watchlist.findOneAndUpdate(
      { userId: req.user._id, stockId },
      { note: note ?? "" },
      { new: true, runValidators: true }
    ).populate("stockId", "symbol name currentPrice changePercent sector");

    if (!item) {
      return res.status(404).json({ success: false, message: "Stock not found in your watchlist." });
    }

    return res.status(200).json({
      success: true,
      message: "Watchlist note updated.",
      watchListItem: item,
    });
  } catch (error) {
    console.error("updateWatchlistNote Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getWatchlist = async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.user._id })
      .select("stockId note createdAt")  //  skip userId, _id auto-included
      .populate("stockId", "symbol name currentPrice changePercent sector")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("getWatchlist Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
