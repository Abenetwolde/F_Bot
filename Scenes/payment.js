const { Scenes, Markup } = require("telegraf")
const numeral = require("numeral")
const moment = require("moment")
const axios = require('axios');
// const { checkUserToken } = require('./Pagination/Utils/checkUserToken');
const apiUrl = 'http://localhost:5000';
const _ = require("lodash");
const { checkUserToken } = require("../Utils/checkUserToken");
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
    await ctx.reply("Welcome to the payment page, you're able to make payment for your order now.",)
    Markup.keyboard([
        ["🏠 Back to Home"]
    ]).resize()
    // await Utils.sendSystemMessage(ctx, Template.paymentWelcomeMessage(), Template.paymentMenuButtons())

    for (const product of ctx.session.cart) {

        const productCost = product.quantity * product.price
        priceLabels.push({
            label: `${product.quantity}x ${product.name}`,
            amount: 100 * productCost,
            // amount: Utils.convertValueToFloat(100 * productCost),
        })

    }

    const cartProdcuts = await ctx.session.cart
    const totalCost = cartProdcuts.reduce((total, item) => total + item.price * item.quantity, 0);
    const invoice = await ctx.replyWithInvoice({
        chat_id: ctx.chat.id,
        provider_token: "6141645565:TEST:SgnwnFe9W5qSP720pKno",
        start_parameter: "get_access",
        title: `Invoice (${moment().format("HH:mm A, DD/MM/YYYY")})`,
        description: `Your total order amounts to ${numeral(totalCost / 100).format("$0,0.00")}.`,
        currency: "ETB",
        prices: priceLabels,
        payload: {
            id: ctx.from.id,
            voucherID: ctx.scene.state.voucher ? ctx.scene.state.voucher.id : null
        },
        // need_shipping_address: true,
        need_phone_number: true,
    })
    console.log("invoiceData", invoice)
    ctx.session.cleanUpState.push({ id: invoice.message_id, type: "invoice" })
    console.log("ctx.session.cleanUpState", ctx.session.cleanUpState)
    // Utils.updateInvoiceMessageInState(ctx, invoice.message_id)
})
// basescene_name.on(message("successful_payment"), handler)
paymentScene.on("successful_payment", async (ctx) => {
    console.log("Success payment", ctx.message.successful_payment)
    // Utils.replaceInvoiceToReceiptInState(ctx)
    ctx.session.cleanUpState = _.map(ctx.session.cleanUpState, function (message) {         // Convert old cart message ID into text to prune
        if (message.type === "invoice") {
            message.type = "receipt"
        }
        return message
    })
    const payment = ctx.message.successful_payment
    console.log("payment", ctx.message.successful_payment)
    const invoice = JSON.parse(payment.invoice_payload)
    console.log("invoice", invoice)
    const hasVoucherApplied = invoice.voucherID

    if (hasVoucherApplied) {
        await Voucher.updateVoucherForUser(invoice.id, invoice.voucherID)
    }
    const paymentData = {
        order: ctx.scene.state.orderId,
        total_amount: ctx.message.successful_payment.total_amount,
        invoice_id: invoice.id,
        telegram_payment_charge_id: ctx.message.successful_payment.telegram_payment_charge_id,
        mobile: payment.order_info.phone_number,
    }

    const userToken = await checkUserToken(`${ctx.from.id}`)
    console.log("token from payment", userToken)
    // const orderData={
    //     shippingInfo: {   
    //         note:result.usernote ,
    //       },
    //       orderItems:result.orderItems,
    //       user: "64fc441dc2df0c5c6132238b",
    //       totalPrice:result.totalPrice,
    //       delivery:result.datePick!==null?"Yes":"no",
    //       shippedAt: result.datePick??result.datePick
    //     }
    // console.log("resultFromnote", result)
    try {
        let headers
        // if (userToken) {
        //      headers = {
        //       Authorization: `Bearer ${userToken}`,
        //       'Content-Type': 'application/json'
        //     }
        // }
        paymentResponse = await axios.post(`${apiUrl}/api/createpayment`, paymentData, {
            headers: {
                "Authorization": `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("paymentResponse", paymentResponse.data)
        //    await ctx.reply(response.data.sccess)
    } catch (error) {
        console.error("orderResponseerror", error)
        // await ctx.reply(error)
    }



    ctx.session.cart = []
    // await Payment.createPayment(ctx, addressDetails, ctx.scene.state.deliveryDate, ctx.scene.state.note)
    ctx.scene.enter("homeScene")
})

paymentScene.on("message", async (ctx) => {
    if (ctx.message.text === "Home") {
        ctx.scene.enter("homeScene")
    }
})

paymentScene.leave(async (ctx) => {
    console.log("Cleaning payment scene")
    // await Utils.clearScene(ctx, true)
})

module.exports = {
    paymentScene
}