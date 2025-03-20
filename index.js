require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { authRoutes } = require("./routes/auth");
const { userRoutes } = require("./routes/user")

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

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

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
