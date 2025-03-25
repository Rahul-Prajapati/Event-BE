require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
const { authRoutes } = require("./routes/auth");
const { userRoutes } = require("./routes/user");
const { eventRoutes } = require("./routes/event");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(errorHandler)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/event', eventRoutes);

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB!');
    app.listen(PORT, (res) =>{
      console.log(`Server running on port ${PORT}`);
       })
  })
  .catch((err) => {
    console.log(err);
  });

// Sample Route
app.get("/", (req, res) => {
  res.send("Backend Server is Running!");
});

