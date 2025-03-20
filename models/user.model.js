const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    firstname:
    {
        type: String,
        required: true
    },
    lastname:
    {
        type: String,
        required: true
    },
    email:
    {
        type: String,
        unique: true,
        required: true
    },
    password:
    {
        type: String,
        required: true
    },
    username: 
    {
        type: String,
        unique: true, 
        sparse: true 
    },                      // Unique but not required at signup
    category: 
    {
        type: String,
        enum: ["Sales", "Education", "Finance", "Government & Politics", "Consulting", "Recruiting", "Tech", "Marketing"],
        sparse: true
    },
    availability: 
    [
        {
            day: 
            { 
                type: String,
                required: true 
            },
            startTime: 
            { 
                type: String, 
                required: true 
            },
            endTime: 
            { 
                type: String, 
                required: true 
            }
        }
    ]
});

module.exports = mongoose.model("User", userSchema);