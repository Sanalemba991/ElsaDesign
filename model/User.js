const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,  // Ensure email is unique
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        unique: true,   // Ensure phone is unique
        sparse: true,   // Allow `null` values and prevent duplicate key errors
    }
});

module.exports = mongoose.model("User", userSchema);
