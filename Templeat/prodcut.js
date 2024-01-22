
const axios = require('axios');
const sharp = require('sharp');
const { Scenes, Markup, session } = require("telegraf")
const apiUrl = 'http://localhost:5000';
const { ObjectId } = require('mongodb');
const { getCart } = require('../Database/cartController');

module.exports = {
    displyProdcut: async function (ctx, producs, isSearch = false) {
        const userId = ctx.from.id
        const cart = await getCart(userId);
        for (const product of producs) {
            if (ctx.session.shouldContinueSending == false) {
                break;
            }
            const productId = product._id;

            const cartItem = cart.items.find((item) => item.product._id.toString() === productId);

            if (cartItem) {
                product.quantity = cartItem.quantity;
            }

            // ctx.session.availableSizes[productId] = ['37', '46', '48', '67'];
            ctx.session.currentImageIndex[productId] = 0;
            ctx.session.viewMore[productId] = false;
            const messageInfo = await module.exports.sendProduct(ctx, productId, product);

            ctx.session.cleanUpState.push(messageInfo);

        }

    },

    sendProduct: async function (ctx, productId, product, iscart) {
        console.log("reach", productId)
        console.log("reach prodcut", product)
        let caption = '';
        caption = ` ${product?.name}\n ▪️${product?.price} Birr \n ▪️${product?.discription}\n
       `

        if (!ctx.session.viewMore[productId] && caption.length > 20) {
            caption = caption.substring(0, 50) + '...';
        }
        // Check if the image for this product exists
        if (!product?.images || !product?.images[ctx.session.currentImageIndex[productId]]) {
            return;
        }
        // Get the current image of this product from its images array using the current image productId stored in the session data
        const image = product?.images[ctx.session.currentImageIndex[productId]];
        const response = await axios.get(image, { responseType: 'arraybuffer' });

        ;
        if (ctx.session.cleanUpState && ctx.session.cleanUpState.find(message => message?.type === 'product' && message?.productId === productId)) {
            const productMessage = ctx.session.cleanUpState.find(message => message?.type === 'product' && message?.productId === productId);
            if (productMessage) {
                const messageId = productMessage.id;
                const viewMore = ctx.session.viewMore[productId];
                console.log("viewMore...........", viewMore)
                const quantity = product.quantity;
                console.log("quantity...........", product.quantity)
                const price = product.price;
                const currency = product.currency;

                let keyboard = [];
                if (quantity == 0) {
                    keyboard.push([
                        Markup.button.callback('⬅️', `previous_${productId}`),
                        viewMore ? Markup.button.callback('View Less', `viewLess_${productId}`) : Markup.button.callback('View More', `viewMore_${productId}`),
                        Markup.button.callback('➡️', `next_${productId}`)
                    ]);
                }

                if (quantity > 0) {
                    keyboard.push([
                        Markup.button.callback('-', `removeQuantity_${productId}`),
                        Markup.button.callback(`${quantity} * ${price} = ${quantity * price} ${currency}`, `quantity_${productId}`),
                        Markup.button.callback('+', `addQuantity_${productId}`)
                    ], [
                        Markup.button.callback('Check Out', `Checkout`)
                    ]);
                } else if (viewMore) {
                    keyboard.push([Markup.button.callback('Buy', `buy_${productId}`)]);
                }

                try {
                    await ctx.telegram.editMessageMedia(
                        ctx.chat.id,
                        messageId,
                        null,
                        {
                            type: 'photo',
                            media: image,
                            caption: caption
                        },
                        Markup.inlineKeyboard(keyboard)
                    )
                } catch (error) {
                    if (error.response.error_code === 400 && error.response.description.includes('message is not modified')) {
                        console.log("Caught the 'message is not modified' error");
                    } else {
                        console.log("An unexpected error occurred: ", error);
                    }
                }
            }
        }

        else {

            const response = await axios.get(image, { responseType: 'arraybuffer' });
            const imageBuffer = await sharp(response.data)
                .resize(200, 200)
                .toBuffer();

            // const mediaGroup = product.images.map((p) => {
            //     return { type: 'photo', media: p, caption: 'p.name' };
            // });
            // console.log("images......", mediaGroup)
            // await ctx.telegram.sendMediaGroup(ctx.chat.id, mediaGroup).then((sentMedia) => {

            //     const inlineButtons = Markup.inlineKeyboard([
            //         Markup.button.url('Button 1', 'https://example.com/button1'),
            //         Markup.button.callback('Button 2', 'button2_callback'),
            //     ]);

            //     ctx.reply(caption, inlineButtons);
            // });
            // If there is no previous message ID, use the replyWithPhoto method to send a new message with this product's image

            const message = await ctx.replyWithPhoto({ source: imageBuffer }, {
                caption: caption,
                ...Markup.inlineKeyboard([
                    !product.quantity/*   === 0 */ ? [
                        Markup.button.callback('⬅️', `previous_${productId}`),
                        ctx.session.viewMore[productId] ? Markup.button.callback('View Less', `viewLess_${productId}`) : Markup.button.callback('View More', `viewMore_${productId}`),
                        Markup.button.callback('➡️', `next_${productId}`),
                        // ...(ctx.session.viewMore[productId] ? [Markup.button.callback('Buy', `buy_${productId}`)] : [])
                    ] : [],
                    ...(product.quantity > 0 ? [
                        [
                            Markup.button.callback('-', `removeQuantity_${productId}`),
                            Markup.button.callback(`${product.quantity} * ${product.price} = ${product.quantity * product.price} ${product.currency}`, `quantity_${productId}`),
                            Markup.button.callback('+', `addQuantity_${productId}`)
                        ]
                    ] : (ctx.session.viewMore[productId] ? [
                        [
                            Markup.button.callback('Buy', `buy_${productId}`)
                        ]
                    ] : []))
                ])
            }

            );
            return {
                id: message.message_id,
                type: 'product',
                productId: productId
            };
        }

        // return await ctx.replyWithPhoto("https://th.bing.com/th/id/OIP.y7QJCUnLeQFDE2FXeXH_CwHaHa?pid=ImgDet&rs=1", /* Template.productButtons(categoryName, product, quantity) */)
    },

}