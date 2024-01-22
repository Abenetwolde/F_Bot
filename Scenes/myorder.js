const { Markup, Scenes} = require("telegraf");
const { getUserOrders, cancelOrder } = require("../Database/orderController");

const myOrderScene = new Scenes.BaseScene("myOrderScene");

myOrderScene.enter(async (ctx) => {
    const userId = ctx.from.id;

    // Fetch user orders
   
    const userOrders = await getUserOrders(userId,"pending");

    if (userOrders.length === 0) {
     const emptyOrderMessage=   await ctx.reply("You don't have any orders yet.", Markup.keyboard([["🏠 Home"],["My Order History"]]).resize());
             // Save the message ID for cleanup
             ctx.session.cleanUpState.push({ id: emptyOrderMessage.message_id, type: "myorder" });
    } else {
        for (const order of userOrders) {
            const orderMessage = await ctx.replyWithPhoto(
                order.orderItems[0].product.images[0], // Assuming the first product image represents the order
                {
                    caption: "Order Details",
                    ...Markup.inlineKeyboard([Markup.button.callback("Cancel Order", `cancel_order:${order._id}`)]),
                }
            );

            // Save the message ID for cleanup
            ctx.session.cleanUpState.push({ id: orderMessage.message_id, type: "myorder" });
        }

        await ctx.reply("To go back to home, press 🏠 Home",Markup.keyboard([["🏠 Home"],["My Order History"]]).resize());
    }
});

myOrderScene.action(/cancel_order:(.+)/, async (ctx) => {
    const userId = ctx.from.id;
    const orderId = ctx.match[1];

    const cancellationResult = await cancelOrder(orderId, userId);

    if (cancellationResult.success) {
        await ctx.answerCbQuery("Order canceled successfully.");
    } else {
        await ctx.answerCbQuery("Failed to cancel the order.");
    }
// Delete only the selected order message
await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    // Re-enter the scene to refresh the order list
    // ctx.scene.reenter();
});
myOrderScene.hears("My Order History", async (ctx) => {
    // Delete all previous order messages with the type "myorder"
    ctx.session.cleanUpState
        .filter((message) => message.type === "myorder")
        .forEach(async (message) => {
            await ctx.deleteMessage(message.id);
        });
     const   userId=ctx.from.id
    // Fetch user orders with a completed status
    const completedOrders = await getUserOrders(userId, "completed");

    if (completedOrders.length === 0) {
        await ctx.reply("You don't have any completed orders.", Markup.keyboard([Markup.button.callback("🏠 Home", "home")]).resize());
    } else {
        for (const order of completedOrders) {
            await ctx.replyWithPhoto(
                order.orderItems[0].product.images[0], // Assuming the first product image represents the order
                {
                    caption: "Order Details",
                }
            );
        }

        await ctx.reply("To go back to home, press 🏠 Home", Markup.keyboard([Markup.button.callback("🏠 Home", "home")]).resize());
    }
});
myOrderScene.on("text", async (ctx) => {
    const message = ctx.message.text;

    if (message === "🏠 Home") {
        // Go back to the home scene
        ctx.scene.enter("homeScene");
    }
});

module.exports = myOrderScene;
