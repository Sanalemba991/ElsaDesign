const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: Number,
  items: [
    {
      ProductPicture: String,
      Name: String,
      ProductName: String,
      Quantity: Number,
      Size: String,
      OnlinePrice: { type: String, default: null },
      Price: Number,
    },
  ],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
