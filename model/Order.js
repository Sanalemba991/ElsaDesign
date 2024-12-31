const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: Number,
  customerName: String,
  customerEmail: String,
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
    }
  ],
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" },
  totalAmount: Number
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
