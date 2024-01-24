const { Scenes, Markup } = require("telegraf")
const moment = require("moment")
const _ = require("lodash")

const { sendProdcutSummary } = require("../Templeat/summary")

const selectePaymentType = new Scenes.BaseScene("selectePaymentType")

/**
 * Upon entering, scene contains:
 * 1. Voucher applied from cart scene (i.e. ctx.scene.state.voucher)
 * 
 * isWaiting: {
 *      status: true,               // If user is in text-only mode
 *      date: XXX                    // callback_query that user selects
 * }
 */

selectePaymentType.enter(async (ctx) => {
    await sendProdcutSummary(ctx)
    const selec1message = await ctx.reply("Just two more steps before we're able to generate your invoice! 🙂",    Markup.keyboard([
        ["🏠 Back to Home"]
    ]).resize())

    const selec2message = await ctx.reply("Selecte Payment type", Markup.inlineKeyboard([
        Markup.button.callback("Pay Online", 'online'),
        Markup.button.callback("Pay On Cash", 'cash'),

    ]))

    ctx.session.cleanUpState.push({ id: selec1message.message_id, type: "selectPayment" })
    ctx.session.cleanUpState.push({ id: selec2message.message_id, type: "selectPayment" }) // Update as calendar type to prevent message from deletion in midst of selecting a date
})
selectePaymentType.action("online", async (ctx) => {
    ctx.session.orderInformation = {
        paymentType: 'online'
    }
    // await sendProdcutSummary(ctx)
    await ctx.scene.enter("addressOnline");
});
selectePaymentType.action("cash", async (ctx) => {
    // ctx.session.paymentType="Chash"
    // ctx.session.cancelOrder = true

    ctx.session.orderInformation = {
        paymentType: 'Cash'
    }
    await ctx.scene.enter("informationCash");
    // await sendProdcutSummary(ctx)
    // await ctx.reply("your order is seccessfully............ here is your order number #23784 ")
    // await ctx.scene.leave()
    // await ctx.scene.enter("PAYMENT_SCENE");
    // await ctx.scene.enter("PAYMENT_SCENE");
});
selectePaymentType.leave(async (ctx) => {
    try {
        if (ctx.session.cleanUpState) {
            // Iterate over the cleanUpState array
            for (const message of ctx.session.cleanUpState) {
                // Check if the message exists before attempting to delete it
                // if (message?.type === 'selectPayment'|| message?.type === 'summary') {
                //     await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                // }
            }
        }
    } catch (error) {
        console.error('Error in note leave:', error);
    } finally {
        // Always clear the cleanUpState array
        ctx.session.cleanUpState = [];
    }
})

module.exports = {
    selectePaymentType
}