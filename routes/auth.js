const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/signup", async (req, res, next) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        console.log(req.body);
        console.log(firstname, lastname, email, password);

        const existingUser = await userModel.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = new userModel({
            firstname,
            lastname,
            email,
            password: hashedPassword,
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);

        res.status(201).json({ message: "Signup successful!", token, user: user });
    }
    catch (err) {
        next(err);
    }
});

router.post("/signin", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await userModel.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "User doesn't Exist" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Wrong Password" });
        }
        const payload = {
            id: user._id,
            firstname: user.username,
        };
        const token = jwt.sign(payload, process.env.SECRET_KEY);
        res.json({ message: "Login successful!!!", token, user }).status(200);
    }
    catch (err) {
        next(err);
    }
});

module.exports = { authRoutes: router };
