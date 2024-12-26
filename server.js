const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const UserModel = require("./model/User");

dotenv.config();

const app = express();

app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Error connecting to MongoDB:", err));


// Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        console.log(`Name: ${name}, Email: ${email}, Password: ${password}`);

        // Check if user with the same email already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
        }

        // If phone is provided, check if it's unique
        if (phone) {
            const existingPhoneUser = await UserModel.findOne({ phone });
            if (existingPhoneUser) {
                return res.status(409).json({ error: "Phone number already exists" });
            }
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user object
        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            phone: phone || null,  // Set to null if phone is not provided
        });

        // Save the new user
        const savedUser = await newUser.save();

        // Send response back to client
        res.status(201).json({
            name: savedUser.name,
            email: savedUser.email,
            id: savedUser._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await UserModel.findOne({ email });

        if (user) {
            // Compare the entered password with the stored password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                res.json("Success");
            } else {
                res.status(401).json("Password does not match");
            }
        } else {
            res.status(401).json("No Record Found");
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Home Route
app.get("/", (req, res) => {
    console.log("Server is running");
    res.status(200).json({ message: "Sanalemba is good" });
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
