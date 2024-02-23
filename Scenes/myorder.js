const { Markup, Scenes } = require("telegraf");
const axios = require('axios');
const sharp = require('sharp');
const { getUserOrders, cancelOrder } = require("../Database/orderController");
const { ReturnDocument } = require("mongodb");

const myOrderScene = new Scenes.BaseScene("myOrderScene");

myOrderScene.enter(async (ctx) => {
    ctx.session.currentImageIndexofOrder = {};
    await ctx.session.cleanUpState
        .filter((message) => message?.type === "orderhistory" || message?.type === "myorder")
        .forEach(async (message) => {
            try {
                await ctx.deleteMessage(message?.id);
            } catch (error) {
                console.log(error)
            }

        });
    await ctx.reply("To go back to home, press 🏠 Home", Markup.keyboard([["🏠 Home", "My Order History"]]).resize().oneTime());
    const userId = ctx.from.id;
    const userOrders = await getUserOrders(userId, "pending");
    console.log("user.lof", userOrders)
    if (userOrders.length === 0) {
        const emptyOrderMessage = await ctx.reply("You don't have any orders yet.", Markup.keyboard([["🏠 Home", "My Order History"]]).resize().oneTime());
        // Save the message ID for cleanup
        ctx.session.cleanUpState.push({ id: emptyOrderMessage.message_id, type: "myorder" });
    } else {
        ctx.session.UserOrder = userOrders
        for (const order of userOrders) {

            if (order.orderItems.length > 1) {
                await OrderMessageWithProducts(ctx, order._id, order.orderItems);

                //   return OrderMessageWithProducts(ctx, order);    
            }
            else {
                // const product = order.orderItems[0].product;
                // await sendProduct(ctx, order._id, product, order.orderItems[0].quantity);
                const formatTelegramMessage = (product, quantity) => {
                    const { name, description, price, available, warranty, category, highlights, images, createdAt } = product;

                    const formattedprice = product.quantity !== 0 ?
                        `  
                  . 
                  . 
                   ${quantity}x${product.price}= ${quantity * product.price} ETB` : ''

                    return `
                 ${category.icon} ${name} ${category.icon}
                 💴 ${price} ETB
                 #${category.name} ${category.icon}
                 ${formattedprice}
                
                
                    `;
                };
                try {
                    const resizeimage = await order?.orderItems[0]?.product?.images[0].imageUrl
                    console.log("resizeimage", resizeimage)
                    const response = await axios.get(resizeimage, { responseType: 'arraybuffer' });
                    const imageBuffer = await sharp(response.data)
                        .resize(200, 200)
                        .toBuffer();
                    const orderMessage = await ctx.replyWithPhoto(
                        { source: imageBuffer },
                        {
                            caption: formatTelegramMessage(order?.orderItems[0]?.product, order?.orderItems[0]?.quantity),
                            ...Markup.inlineKeyboard([Markup.button.callback("Cancel Order", `cancel_order:${order._id}`)]),
                        }

                    );
                    ctx.session.cleanUpState.push({ id: orderMessage.message_id, type: "myorder" });
                } catch (error) {
                    ctx.reply("erro",error)
                    await ctx.scene.leave()
                }

            }




        }


    }
});

myOrderScene.action(/cancel_order:(.+)/, async (ctx) => {
    const userId = ctx.from.id;
    const orderId = ctx.match[1];

    // const cancellationResult = await cancelOrder(orderId, userId);

    if (orderId) {
        const message = ctx.callbackQuery.message;

        // Edit the button message to include "Yes" instead of using answerCbQuery
        await ctx.telegram.editMessageReplyMarkup(
            message.chat.id,
            message.message_id,
            null,
            {
                inline_keyboard: [
                    [{ text: 'Yes', callback_data: `confirm_cancel:${orderId}` }, { text: 'No', callback_data: 'reject_cancel' }]
                ]
            }
        );
        await ctx.telegram.editMessageCaption(
            message.chat.id,
            message.message_id,
            null,
            "Are you sure you want to cancel the order?",
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Yes', callback_data: `confirm_cancel:${orderId}` }, { text: 'No', callback_data: 'reject_cancel' }]
                    ]
                }
            }
        );
    } else {
        await ctx.answerCbQuery("Failed to cancel the order.");
    }

});

// Handle user's confirmation
myOrderScene.action(/confirm_cancel:(.+)/, async (ctx) => {
    // Delete the message with the cancellation confirmation prompt
    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);

    // Retrieve the orderId from the callback data
    const orderId = ctx.match[1];

    // Perform cancellation logic here...
    const cancellationResult = await cancelOrder(orderId, ctx.from.id);
    if (cancellationResult.success) {
        await ctx.answerCbQuery("Order canceled successfully.");
    } else {
        await ctx.answerCbQuery("Failed to cancel the order.");
    }
});

// Handle user's rejection
myOrderScene.action('reject_cancel', async (ctx) => {
    // Delete the message with the cancellation confirmation prompt
    // await ctx.deleteMessage(ctx.callbackQuery.message.message_id);

    // Optionally, inform the user that the cancellation was rejected
    await ctx.answerCbQuery("Cancellation request rejected.");
    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);

    await ctx.scene.reenter()
});
myOrderScene.hears("My Order History", async (ctx) => {
    if (ctx.session.cleanUpState) {
        ctx.session.cleanUpState.forEach(async (message) => {
            console.log("%c called deleteing when its leave", "color: red;")
            if (message?.type === 'myorder' || message?.type === 'orderhistory') {
                try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, message?.id);
                } catch (error) {
                    console.log("error while deleting.......", error)
                }

            }


        });
    }

    // await ctx.reply("To go back to home, press 🏠 Home", Markup.keyboard([["🏠 Home", "My Order"]]).resize().oneTime());
    // Delete all previous order messages with the type "myorder"
    const userId = ctx.from.id
    // Fetch user orders with a completed status
    const completedOrders = await getUserOrders(userId, "delivered");

    if (completedOrders.length === 0) {
        const message = await ctx.reply("You don't have any completed orders.", Markup.inlineKeyboard([Markup.button.callback("Back", "Back")]))
        await ctx.session.cleanUpState.push({ id: message.message_id, type: "myorder" })
    } else {
        for (const order of completedOrders) {
            const formatTelegramMessage = (product, quantity) => {
                const { name, description, price, available, warranty, category, highlights, images, createdAt } = product;

                const formattedprice = product.quantity !== 0 ?
                    `  
              . 
              . 
               ${quantity}x${product.price}= ${quantity * product.price} ETB` : ''

                return `
             ${category.icon} ${name} ${category.icon}
             💴 ${price} ETB
             #${category.name} ${category.icon}
             ${formattedprice}
            
            
                `;
            };
            console.log(order?.orderItems[0]?.product?._id)
            const resizeimage = order.orderItems[0].product?.images[0].imageUrl
            const response = await axios.get(resizeimage, { responseType: 'arraybuffer' });
            const imageBuffer = await sharp(response.data)
                .resize(200, 200)
                .toBuffer();
            const orderHistorymessage = await ctx.replyWithPhoto(
                { source: imageBuffer },
                {
                    caption: formatTelegramMessage(order?.orderItems[0]?.product, order?.orderItems[0]?.quantity),
                    ...Markup.inlineKeyboard([Markup.button.url("Reorder", `https://t.me/testecommerce12bot?start=chat_${order?.orderItems[0]?.product?._id}`)]),
                },

            );
            ctx.session.cleanUpState.push({ id: orderHistorymessage.message_id, type: "orderhistory" });
        }

        // await ctx.reply("To go back to home, press 🏠 Home", Markup.keyboard([Markup.button.callback("🏠 Home", "home")]).resize());
    }
});
myOrderScene.hears("🏠 Home", async (ctx) => {
    await ctx.scene.enter("homeScene");

});
myOrderScene.hears("My Order", async (ctx) => {
    await ctx.scene.reenter();

});
myOrderScene.action("Back", async (ctx) => {
    await ctx.scene.reenter();

});
myOrderScene.leave(async (ctx) => {
    try {

        if (ctx.session.cleanUpState) {
            ctx.session.cleanUpState.forEach(async (message) => {
                console.log("%c called deleteing when its leave", "color: red;")
                if (message?.type === 'myorder' || message?.type === 'orderhistory') {
                    try {
                        await ctx.telegram.deleteMessage(ctx.chat.id, message?.id);
                    } catch (error) {
                        console.log("error while deleting.......", error)
                    }

                }


            });
        }


    } catch (error) {

    }
    ctx.session.UserOrder = [];
    await ctx.scene.leave()
    console.log("Cleaning myOrderScene scene")
    // await Utils.clearScene(ctx, true)
})

async function OrderMessageWithProducts(ctx, orderid, orderItems) {
    const productId = orderItems[0].product._id;
    const images = orderItems.map(item => item.product.images[0].imageUrl);
    const name = orderItems.map(item => item.product.name);
    const quantitytimesprice = orderItems.map(item => `${item.quantity}X${item.product.price}=${item.quantity * item.product.price} ETB`).join("\n");
    const messageIds = [];
    let index = 0;
    const caption = generateCaption(orderItems, images.length, 1);
    // for (const image of images) {
    const imageBuffer = await resizeImage(images[0]);
    const orderMessage = await ctx.replyWithPhoto(
        { source: imageBuffer },
        {
            caption: caption,
            ...Markup.inlineKeyboard([[
                Markup.button.callback('⬅️ Previous', `prev_${productId}_${orderid}_${index}`),
                Markup.button.callback('Next ➡️', `next_${productId}_${orderid}_${index}`),
            ],
            [Markup.button.callback("Cancel Order", `cancel_order:${orderid}`)]
            ]),
        }
    );

    messageIds.push(orderMessage.message_id);
    ctx.session.cleanUpState.push({ id: orderMessage.message_id, type: "myorder" });
    index++;
    // }

    // Save the message IDs for cleanup

}

// Handle next and previous actions
myOrderScene.action(/next_(\w+)_(\w+)_(\d+)/, (ctx) => {
    const [, productId, orderid, index] = ctx.match;
    const orderItems = ctx.session.UserOrder.find(order => order._id === orderid).orderItems;
    const nextIndex = (parseInt(index) + 1) % orderItems.length;
    editProductMessage(ctx, orderid, orderItems, productId, index, nextIndex);
});

// Handle previous action
myOrderScene.action(/prev_(\w+)_(\w+)_(\d+)/, (ctx) => {
    const [, productId, orderid, index] = ctx.match;
    const orderItems = ctx.session.UserOrder.find(order => order._id === orderid).orderItems;
    const prevIndex = (parseInt(index) + orderItems.length - 1) % orderItems.length;
    editProductMessage(ctx, orderid, orderItems, productId, index, prevIndex);
});

async function editProductMessage(ctx, orderid, orderItems, productId, currentIndex, newIndex) {
    const image = orderItems[parseInt(newIndex)].product.images[0].imageUrl;
    const imageBuffer = await resizeImage(image);
    const caption = generateCaption(orderItems, orderItems.length, newIndex + 1);
    try {
        await ctx.telegram.editMessageMedia(
            ctx.chat.id,
            ctx.callbackQuery.message.message_id,
            null,
            {
                type: 'photo',
                media: { source: imageBuffer },
                caption: caption,
            },

            Markup.inlineKeyboard([[
                Markup.button.callback('⬅️ Previous', `prev_${productId}_${orderid}_${newIndex}`),
                Markup.button.callback('Next ➡️', `next_${productId}_${orderid}_${newIndex}`),
            ],
            [Markup.button.callback("Cancel Order", `cancel_order:${orderid}`)],
            ]
            )
        );
    } catch (error) {
        console.error("Error editing message:", error);
    }
}
function generateCaption(orderItems, totalCount, currentIndex) {
    const productName = orderItems.map(item => item.product.name);
    const quantityTimesPrice = orderItems.map(item => `${item.quantity}X${item.product.price}=${item.quantity * item.product.price} ETB`).join("\n");

    let caption = `Product Name : ${productName}\n`;
    caption += `ProductImage ${currentIndex}/${totalCount}\n`;
    caption += quantityTimesPrice;

    return caption;
}
async function resizeImage(imageUrl) {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return await sharp(response.data).resize(200, 200).toBuffer();
}
module.exports = myOrderScene;
