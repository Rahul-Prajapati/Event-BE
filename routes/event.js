const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const eventModel = require("../models/event.model");
const bookModel = require("../models/view.event.model");
const { authMiddleware } = require("../middleware/auth");
const mongoose = require("mongoose");

router.put("/update-status", authMiddleware,  async (req, res) => {
  try {
    const { eventId, isActive } = req.body; // Extract from body

    console.log(eventId, isActive);

      if (!eventId) return res.status(400).json({ message: "Event ID is required" });
      
      const newStatus = isActive === "true" ? false : true; // toggle logic

      const updatedEvent = await eventModel.findByIdAndUpdate(
          eventId,
          { isActive: newStatus  },
          { new: true }
      );

      if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

      res.status(200).json({ message:"Meeting Active/InActive Status is changed", isActive: updatedEvent.isActive });

  } catch (err) {

    console.log("catch block")
    console.error("Error in catch block:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
});
// 

router.post("/createEvent",authMiddleware, async (req, res, next) => {
  try {
    console.log(req.body);
    let { hostname, date, duration, participants, ...rest } = req.body;

    // Validate Host
    const hostUser = await userModel.findById(hostname);
    if (!hostUser) {
      return res.status(404).json({ message: "Host user not found" });
    }

    // Convert date from "YYYY-MM-DD" to "DD/MM/YY"
    //   const formattedDate = date.split("-").reverse().join("/");

    // Ensure duration is stored as a number
    const parsedDuration = parseInt(duration);

    // Fetch users based on email instead of ObjectId
    const validParticipants = await userModel.find({ email: { $in: participants } }).select("_id");

    // Extract ObjectIds
    const participantIds = validParticipants.map(user => user._id);

    console.log("Valid Participants:", participantIds);

    // Create Event Object
    const newEvent = new eventModel({
      hostname,
      date: date,
      duration: parsedDuration,
      participants: participantIds,
      ...rest, // Spread remaining fields
    });

    await newEvent.save();

    //  Insert Booking Status for each participant
    const bookingStatusEntries = participantIds.map(userId => ({
      eventId: newEvent._id,
      userId,
      status: "Pending", // Default status
    }));

    await bookModel.insertMany(bookingStatusEntries); // Bulk insert into BookingStatus
    console.log("Booking Status Added:", bookingStatusEntries);
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {

    next(err);
  }
});



// Get Event Data where User is host
router.get("/host/:userId",  async (req, res) => {
  try {

    const id = req.params.userId;

    const user = await userModel.findById(id);

    if (!user) return res.status(404).json({ message: "User Not Found" });

    const EventsDetails = await eventModel.find({
      hostname: id,
      status: "Upcoming"
    })
      .populate("hostname", "username") // Fetch only these fields from hostname
      .populate("participants", "firstname lastname email"); // Fetch only these fields from participants


    if (!EventsDetails.length) return res.status(404).json({ message: "No Upcoming Events" })

    // console.log(EventsDetails);
    res.status(200).json(EventsDetails);

  }
  catch (error) {
    // next(err);
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server Error" });

  }

})


// to update Events Details
router.put("/:eventId",authMiddleware,  async (req, res) => {

  try {
    const eventId = req.params.eventId;
    console.log(eventId);
    let { hostname, date, duration, participants, ...rest } = req.body;

    const Events = await eventModel.findById(eventId);

    console.log(Events);

    if (!Events) return res.status(404).json({ message: "Event Not Found" });

    if (hostname) {
      const hostUser = await userModel.findById(hostname);
      if (!hostUser) {
        return res.status(404).json({ message: "Host user not found" });
      }
    }

    const parsedDuration = duration ? parseInt(duration) : Events.duration;

    let participantIds = Events.participants;
    if (participants && participants.length > 0) {
      const validParticipants = await userModel.find({ email: { $in: participants } }).select("_id");
      participantIds = validParticipants.map(user => user._id);
    }

    const updatedEvent = await eventModel.findByIdAndUpdate(eventId, {
      hostname,
      date,
      duration: parsedDuration,
      participants: participantIds,
      ...rest,
    }, { new: true });


    if (participants && participants.length > 0) {
      await bookModel.deleteMany({ eventId }); // Remove previous booking statuses
      const bookingStatusEntries = participantIds.map(userId => ({
        eventId: updatedEvent._id,
        userId,
        status: "Pending",
      }));
      await bookModel.insertMany(bookingStatusEntries);
    }

    res.status(200).json({ message: "Event updated successfully", event: updatedEvent });

  }
  catch (error) {

    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server Error" });

  }



})

// Delete Events 

router.delete("/deleteEvent/:eventId", authMiddleware,  async (req, res, next) => {
  try {
    const { eventId } = req.params;

    console.log(eventId);

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Check if the event exists
    const event = await eventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete associated booking statuses
    await bookModel.deleteMany({ eventId });

    // Delete the event
    await eventModel.findByIdAndDelete(eventId);

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    next(error); // Pass error to the error handler middleware
  }
});


// Get All events data where user is either host or participant 
router.get("/allevents/:userId",  async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch all events where the user is either a host or a participant
    const events = await eventModel.find({
        $or: [{ hostname: userId }, { participants: userId }]
    })
    .populate("hostname", "firstname lastname") // Populate host details
    .populate("participants", "firstname lastname") // Populate participants details
    .lean(); // Convert Mongoose objects to plain JSON

    // Fetch all booking statuses for this user
    const bookings = await bookModel.find({ userId }).lean();

    // Map booking statuses to event IDs
    const bookingMap = {};
    bookings.forEach(booking => {
        bookingMap[booking.eventId.toString()] = booking.status;
    });

    // Attach user-specific status to each event
    const enrichedEvents = events.map(event => ({
        ...event,
        userStatus: bookingMap[event._id.toString()] || "Pending"
    }));

    res.json(enrichedEvents);
} catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
}

});



module.exports = { eventRoutes: router };

