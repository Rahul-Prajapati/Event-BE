const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BookingStatusSchema = new mongoose.Schema({
    eventId: 
    {
        type: Schema.Types.ObjectId,
        ref: "Event", 
        required: true 
    },
    userId: 
    { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    status: 
    { 
        type: String, 
        enum: ["Pending", "Accepted", "Rejected"], 
        default: "Pending" 
    }
});

module.exports = mongoose.model("BookingStatus", BookingStatusSchema);