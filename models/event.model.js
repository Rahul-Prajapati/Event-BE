const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new mongoose.Schema({
    hostname: 
    { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    }, // Host user
    topic:
    { 
        type: String,
        required: true 
    },
    password:
    { 
        type: String, 
        required: true 
    },
    description:
    { 
        type: String 
    },
    date: 
    { 
        type: String, 
        required: true 
    }, // Format: "dd/mm/yy"
    time: 
    { 
        type: String, 
        required: true 
    }, // Format: "hh:mm"
    ampm: 
    { 
        type: String, 
        enum: ["AM", "PM"], 
        required: true 
    },
    timezone: 
    { 
        type: String, 
        required: true 
    },
    duration: 
    { 
        type: Number, 
        enum: [1, 2], 
        required: true 
    }, // 1 hour or 2 hours
    backgroundColor: 
    { 
        type: String, 
        default: "#1877F2" 
    }, // If inactive, set to #1877F2
    eventLink: 
    { 
        type: String, 
        required: true 
    },
    participants: 
    [{ 
        type: Schema.Types.ObjectId, 
        ref: "User" 
    }], // Only registered users
    isActive: 
    { 
        type: Boolean, 
        default: true 
    }, // If false, backgroundColor = #676767
    status: {
      type: String,
      enum: ["Upcoming", "Cancelled"],
      default: "Upcoming"
    },
  });

  module.exports = mongoose.model("Event", EventSchema);