const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const eventModel = require("../models/event.model");
const bookModel = require("../models/view.event.model");
const { authMiddleware } = require("../middleware/auth");
const mongoose = require("mongoose");


router.put("/update-status", async (req, res) => {
    const { eventId, userId, status } = req.body;

    try {
        // Validate status
        if (!["Pending", "Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Find and update the booking status for the user and event
        const updatedBooking = await bookModel.findOneAndUpdate(
            { eventId, userId },  // Find by event and user
            { status },            // Update status
            { new: true }          // Return updated document
        );

        console.log("update query", req.body);

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({ message: "Booking status updated successfully", booking: updatedBooking });
    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = { bookRoutes: router };