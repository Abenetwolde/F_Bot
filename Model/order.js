const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: false
        },
        note: {
            type: String,
            required: false
        },
        phoneNo: {
            type: Number,
            required: false
        },
    },
    orderItems: [
        {
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            product: {
                type: mongoose.Schema.ObjectId,
                ref: "Product",
                required: true
            },
        },
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        // required: true
    },
    payment: {
        type: mongoose.Schema.ObjectId,
        ref: "payment",
        required: false,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
      },
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    telegramid:{
        type: Number,
   
    },
    orderStatus: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
    },
    delivery: {
        type: String,
        enum: ["Yes", "No"],
        default: "No",
    },
    orderfromtelegram:{
        type : Boolean ,
        default : false

    },
    shippedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model("Order", orderSchema);