const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        location: {
            type: String,
            required: false
        },
        note: {
            type: String,
            required: false
        },
        phoneNo: {
            type: String,
            required: false
        },
    },
    orderItems: [
        {
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
      paymentType: {
        type: String,
        enum: ["Cash", "online"],
      
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
    orderfromtelegram:{
        type : Boolean ,
        default : false

    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model("Order", orderSchema);