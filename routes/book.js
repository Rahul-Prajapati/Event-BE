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

router.get("/participants/:eventId", async (req, res) => {
    const { eventId } = req.params;

    try {
        // Find all participants for the event and populate user details
        const participants = await bookModel.find({ eventId })
            .populate("userId", "firstname lastname") // Get only required fields
            .lean(); // Convert to plain JSON

        if (!participants.length) {
            return res.status(404).json({ message: "No participants found for this event." });
        }

        // Format response
        const participantData = participants.map(p => ({
            firstname: p.userId.firstname,
            lastname: p.userId.lastname,
            status: p.status
        }));

        res.status(200).json({ participants: participantData });
    } catch (error) {
        console.error("Error fetching participants:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = { bookRoutes: router };