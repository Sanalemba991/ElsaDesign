const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: Number,
  ProductPicture: {
    type: String,
    match: [/^https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg)$/, 'Please fill a valid URL'],
    required: [true, 'Product picture URL is required'],
  },
  Name: String,
  ProductName: String,
  Quantity: String,
  Size: String,
  OnlinePrice: { type: String, default: null },
  Price: Number,
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
