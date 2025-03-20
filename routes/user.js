const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const { authMiddleware } = require("../middleware/auth");

router.post("/preferences", authMiddleware, async (req, res, next) => {
    try {
        console.log("At the backend")
        const {userId, username, selectedCategory } = req.body;
        console.log(req.body);
        console.log(userId, username, selectedCategory);

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const existingUser = await userModel.findOne({ username });
        if (existingUser && existingUser._id.toString() !== userId ) return res.status(400).json({ message: "Username already exists" });

        user.username = username;
        user.category = selectedCategory;
        await user.save();

        res.status(201).json({ message: "Username and category saved", user: user });
    }
    catch (err) {
        next(err);
    }
});



module.exports = { userRoutes: router };