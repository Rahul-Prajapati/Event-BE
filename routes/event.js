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
      
      const newStatus = !JSON.parse(isActive);

      console.log("Before Update - isActive:", isActive, "newStatus:", newStatus);

      const updatedEvent = await eventModel.findByIdAndUpdate(
          eventId,
          { isActive: newStatus  },
          { new: true }
      );
      console.log("Check Status",updatedEvent);

      if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

      res.status(200).json({ message:"Meeting Active/InActive Status is changed", isActive: updatedEvent.isActive });

  } catch (err) {

    console.log("catch block")
    console.error("Error in catch block:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
});
// 

// 

// New Create Event
router.post("/createEvent", authMiddleware, async (req, res, next) => {
  try {
    console.log(req.body);
    let { hostname, date, time, ampm, duration, participants, ...rest } = req.body;

    // Convert date to readable format (Extract the day)
    const eventDate = new Date(date);
    const dayName = eventDate.toLocaleString("en-US", { weekday: "short" });
    console.log("DAy",dayName);
    // Ensure the event is not on Sunday
    if (dayName === "Sun") {
      console.log("Sunday");
      return res.status(400).json({ message: "Events cannot be scheduled on Sundays." });
    }
    console.log("PassedSunday");
    // Validate Host
    const hostUser = await userModel.findById(hostname);
    if (!hostUser) {
      return res.status(404).json({ message: "Host user not found" });
    }
    console.log("Host Validated");


    // Check if the user has availability on this day
    const userAvailability = hostUser.availability.find(avail => avail.day === dayName);
    if (!userAvailability) {
      console.log("Avail inside failed");
      return res.status(400).json({ message: `You have no availability on ${dayName}.` });
    }

    console.log("Avail passed", time," time", ampm);

    // Convert input event time to 24-hour format for easier comparison
    const eventStart = convertTo24HourFormat(time, ampm);
    const durationInHours = parseInt(duration);
    const eventEnd = eventStart + durationInHours * 60; // Add duration (converted to minutes)

    console.log(eventStart," ---", eventEnd);
    // Check if the event fits within any available slots
    const isAvailable = userAvailability.slots.some(slot => {
      console.log(slot.startTime," ==== ",slot.endTime);
      const [time, period] = slot.startTime.split(" ");
      // const slotStart = convertTo24HourFormat(slot.startTime);
      const slotStart = convertTo24HourFormat(time, period);
      const [time2, period2] = slot.endTime.split(" ");
      const slotEnd = convertTo24HourFormat(time2, period2);
      console.log(slotStart," ==== ",slotEnd);
      return eventStart >= slotStart && eventEnd <= slotEnd;
    });

    if (!isAvailable) {
      console.log("Not available slots")
      return res.status(400).json({ message: `Event time is outside your available slots.` });
    }

    console.log("is available");
    // Ensure event does not overlap with another scheduled event
    const overlappingEvent = await eventModel.findOne({
      hostname,
      date,
      $or: [
        { time: { $gte: time, $lte: eventEnd } },
        { time: { $lte: time, $gte: eventStart } }
      ]
    });

    if (overlappingEvent) {
      console.log("is overlappingEvent");
      return res.status(400).json({ message: "Event time overlaps with an existing event." });
    }

    console.log("NO overlappingEvent");

    // Process participants
    const validParticipants = await userModel.find({ email: { $in: participants } }).select("_id");

    if (validParticipants.length !== participants.length) {
      return res.status(400).json({ message: "One or more participants are invalid or do not exist." });
  }

    const participantIds = validParticipants.map(user => user._id);

    console.log("Valid Participants:", participantIds);

    // Create Event Object
    const newEvent = new eventModel({
      hostname,
      date,
      time,
      ampm,
      duration:durationInHours,
      participants: participantIds,
      ...rest,
    });

    await newEvent.save();

    // Insert Booking Status for each participant
    const bookingStatusEntries = participantIds.map(userId => ({
      eventId: newEvent._id,
      userId,
      status: "Pending",
    }));

    await bookModel.insertMany(bookingStatusEntries);
    console.log("Booking Status Added:", bookingStatusEntries);

    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Helper function to convert AM/PM time to 24-hour format
function convertTo24HourFormat(time, ampm) {
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes; // Convert to minutes for easy comparison
}




// Get Event Data where User is host
router.get("/host/:userId",  async (req, res) => {
  try {

    const id = req.params.userId;

    const today = new Date().toISOString().split("T")[0]; 

    const user = await userModel.findById(id);

    if (!user) return res.status(404).json({ message: "User Not Found" });

    const EventsDetails = await eventModel.find({
      hostname: id,
      status: "Upcoming",
      date: { $gte: today }
    })
      .populate("hostname", "username") // Fetch only these fields from hostname
      .populate("participants", "firstname lastname email"); // Fetch only these fields from participants


    if (!EventsDetails.length) return res.status(404).json({ message: "No Upcoming Events" })
    
    // update
    const acceptedBookings = await bookModel.find({userId: id, status: "Accepted" }).populate('eventId');
    console.log("acceptedBookings",acceptedBookings);
    // Extract event details from accepted bookings
    const acceptedEventDetails = acceptedBookings.map(booking => booking.eventId);

    console.log("acceptedEventDetails", acceptedEventDetails);

    res.json({
      EventsDetails,
      acceptedEventDetails
  });

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

  const enrichedEvents = events.map(event => ({
    ...event,
    participants: event.participants.map(participant => ({
        ...participant, // Keep participant details
        status: bookingMap[event._id.toString()] || "Pending" // Get status from bookingMap
    })),
    userStatus: event.hostname._id.toString() === userId ? "Accepted" : (bookingMap[event._id.toString()] || "Pending")
}));


    res.json(enrichedEvents);
} catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Server error" });
}

});



module.exports = { eventRoutes: router };

