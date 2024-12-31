const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fast2sms = require("fast-two-sms");
const otplib = require("otplib");
const UserModel = require("./model/User.js");
const data = require("./data.js");
const ProductModel = require("./model/Product");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());

app.use("/images", express.static("images"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    ProductModel.findOne({ id: data.products[0].id })
      .then((existingProduct) => {
        if (existingProduct) {
          console.log("Product data already exists in the database.");
        } else {
          ProductModel.insertMany(data.products)
            .then(() => {
              console.log("Product data successfully inserted!");
            })
            .catch((err) => {
              console.error("Error inserting product data:", err);
            });
        }
      })
      .catch((err) => {
        console.error("Error checking existing product data:", err);
      });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

let otpStore = {};

const generateOTP = () => {
  const secret = otplib.authenticator.generateSecret();
  return otplib.authenticator.generate(secret);
};

const sendMessage = async (mobile, token) => {
  const options = {
    authorization: process.env.FAST2SMS_API_KEY,
    message: `Your OTP verification code is ${token}`,
    numbers: [mobile],
  };

  try {
    const response = await fast2sms.sendMessage(options);
    console.log("OTP sent successfully:", response);
    return { success: true, message: "OTP sent successfully!" };
  } catch (error) {
    console.error(
      "Error details:",
      error.response ? error.response.data : error
    );
    return { success: false, message: "Failed to send OTP." };
  }
};

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    if (phone) {
      const existingPhoneUser = await UserModel.findOne({ phone });
      if (existingPhoneUser) {
        return res.status(409).json({ error: "Phone number already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
    });

    const savedUser = await newUser.save();

    const token = generateOTP();
    otpStore[phone] = token;

    const result = await sendMessage(phone, token);
    if (result.success) {
      res.status(201).json({
        name: savedUser.name,
        email: savedUser.email,
        id: savedUser._id,
        otpSent: true,
        message:
          "User registered successfully. OTP sent to the registered phone number.",
      });
    } else {
      res
        .status(500)
        .json({ error: "User registered, but failed to send OTP." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!otp || !mobileNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile number and OTP are required." });
  }

  if (otpStore[mobileNumber] && otpStore[mobileNumber] === otp) {
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully!" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (user) {
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

app.get("/api/products", async (req, res) => {
  try {
    const products = await ProductModel.find();
    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await ProductModel.findOne({ id });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.get("/", (req, res) => {
  console.log("Server is running");
  res.status(200).json({ message: "Sanalemba is good" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
