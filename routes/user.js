const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
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



router.put("/profile_update/:userId", authMiddleware, async (req, res, next) => {
    try {
      console.log(req.body);
      const userId =req.params.userId;
      const { firstname, lastname, email, password } = req.body;

      const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
  
        let updatedFields = { firstname, lastname };

        // Check if email is being updated
        if (email && email !== user.email) {
            updatedFields.email = email;
            console.log("email updated")
        }

        // Check if password is being updated
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            updatedFields.password = hashedPassword;
        }

        const updatedUser = await userModel.findByIdAndUpdate(userId, updatedFields, { new: true });

        if (!updatedUser) return res.status(404).json({ message: "User not found" });

        // If email or password is updated, force logout
        if ((email && email !== user.email) || (password && password.trim() !== "")) {
          return res.status(200).json({ 
              message: "Profile updated successfully. Please log in again with your new credentials.", 
              logout: true 
          });
      }

        res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });


  router.post("/updateAvailability", async (req, res) => {
    const { userId, availability } = req.body;
  
    try {
      const user = await userModel.findByIdAndUpdate(
        userId,
        { availability },
        { new: true }
      );
  
      res.status(200).json({ message: "Availability updated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Error updating availability", error });
    }
  });
  



module.exports = { userRoutes: router };