const { Scenes, Markup } = require("telegraf")
const numeral = require("numeral")
const moment = require("moment")
const axios = require('axios');
// const { checkUserToken } = require('./Pagination/Utils/checkUserToken');
const apiUrl = 'http://localhost:5000';
const _ = require("lodash");
const { checkUserToken } = require("../Utils/checkUserToken");
const { createPayment } = require("../Database/payment");
const { updateOrder, updateOrderStatus } = require("../Database/orderController");
const product = require("../Model/product");
let priceLabels = []
const paymentScene = new Scenes.BaseScene("paymentScene")

/**
 * Upon entering, scene contains:
 * 1. Voucher applied (i.e. ctx.scene.state.voucher)
 * 2. Delivery date, if any (i.e. ctx.scene.state.deliveryDate)
 * 3. Note, if any (i.e. ctx.scene.state.note)
 */
let paymentResponse = null
paymentScene.enter(async (ctx) => {
    ctx.session.cleanUpState = []
    ctx.session.timeout = []
    ctx.session.isWaiting = {
        status: false
    }
    console.log("orderid from payment", ctx.scene.state.orderId)
    await ctx.reply("Welcome to the payment page, you're able to make payment for your order now.",    Markup.keyboard([
        ["🏠 Back to Home"]
    ]).resize())

    // await Utils.sendSystemMessage(ctx, Template.paymentWelcomeMessage(), Template.paymentMenuButtons())
const priceLabels=[]
    for (const product of ctx.scene.state.orderItems) {

        const productCost = product.quantity * product?.product?.price
        priceLabels.push({
            label: `${product.quantity}x ${product?.product?.name}`,
            amount: 100*productCost,
            // amount: Utils.convertValueToFloat(100 * productCost),
        })

    }
 
  
    const totalCost =  ctx.scene.state.totalPrice
    const invoice = await ctx.replyWithInvoice({
        chat_id: ctx.chat.id,
        provider_token: "6141645565:TEST:SgnwnFe9W5qSP720pKno",
        start_parameter: "get_access",
        title: `Invoice (${moment().format("HH:mm A, DD/MM/YYYY")})`,
        description: `Your total order amounts to ${numeral(totalCost).format("0,0.00")}ETB.`,
        currency: "ETB",
        prices: priceLabels,
        payload: {
            id: ctx.from.id,
            // voucherID: ctx.scene.state.voucher ? ctx.scene.state.voucher.id : null
        },
        //  need_shipping_address: true,
        need_phone_number: true,
      
    })
    console.log("invoiceData", invoice)
    ctx.session.cleanUpState.push({ id: invoice.message_id, type: "invoice" })

})
paymentScene.on("successful_payment", async (ctx) => {
    console.log("Success payment", ctx.message.successful_payment)
    ctx.session.cleanUpState = _.map(ctx.session.cleanUpState, function (message) {         // Convert old cart message ID into text to prune
        if (message.type === "invoice") {
            message.type = "receipt"
        }
        return message
    })
    const payment = ctx.message.successful_payment
    const invoice = JSON.parse(payment.invoice_payload)
    const paymentData = {
        user:ctx.from.id,
        order: ctx.scene.state.orderId,
        total_amount: ctx.message.successful_payment.total_amount,
        invoice_id: invoice.id,
        telegram_payment_charge_id: ctx.message.successful_payment.telegram_payment_charge_id,
      
    }
    const paymentdata=JSON.parse(JSON.stringify(paymentData))
    try {
        const savedPayment = await createPayment(
            paymentdata
        );
       const orderupdate={
            orderId:ctx.scene.state.orderId,
            phoneNo:payment.order_info.phone_number,
            paymentStatus:"completed",
            orderStatus:"pending",
            location:ctx.session.orderInformation?.location
        }
const updatedOrder=await updateOrder(orderupdate)
// console.log("orderupdate",orderinfo)
let summary = '';
let totalPrice = 0;
summary += `Order Details:`
// const updatedOrder = await updateOrderStatus(ctx.scene.state.orderId, 'completed');
// console.log('Order status updated successfully:', updatedOrder.orderItems);
for (const orderItem of updatedOrder.orderItems) {

    summary += `🛒 ${orderItem.product.name}: ${orderItem.quantity} x ${orderItem.product.price} = ${orderItem.quantity * orderItem.product.price} ETB\n`;
    totalPrice += orderItem.quantity * orderItem.product.price ;
    // await ctx.reply(
    //     `Order Details:
    //                Product: ${orderItem.product.name}
    //                Quantity: ${orderItem.quantity}
    //                Total Price: ${orderItem.quantity * orderItem.product.price} ETB
    //                Order ID: ${updatedOrder._id}`,
    // );
    
    await product.findByIdAndUpdate(orderItem.product._id, {
        $inc: {   orderQuantity: +orderItem.quantity }
    });
  }
  summary += `\nTotal Price: <u>${totalPrice} ETB</u>`;

  // Send a separate message about the product
  await ctx.reply(`Thank you for your order! The product will be delivered to you soon.`);
  await ctx.replyWithHTML(summary),
  ctx.session.orderInformation={}   
    } catch (error) {
        console.error('Error creating payment:', error);
        // Handle error
    }

await ctx.scene.enter("homeScene")
})

paymentScene.on("message", async (ctx) => {
    if (ctx.message.text === "🏠 Back to Home") {
        ctx.scene.enter("homeScene")
    }
})

paymentScene.leave(async (ctx) => {
    console.log("Cleaning payment scene")
    ctx.session.orderInformation={}
    await ctx.scene.leave()
    // await Utils.clearScene(ctx, true)
})

module.exports = {
    paymentScene
}