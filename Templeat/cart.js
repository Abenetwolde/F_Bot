
const axios = require('axios');
const sharp = require('sharp');
const { Scenes, Markup, session } = require("telegraf")
module.exports = {
     sendCartProduct: async function (ctx, productId, cart, iscart) {
        let caption = '';
        caption+=`${cart.product.name} \n`
        caption+=`${cart.product.price}\n`
        caption+= `${cart.quantity} * ${cart.product.price} = ${cart.quantity * cart.product.price} ${cart.product.currency}`
        if (ctx.session?.viewMore&&!ctx.session?.viewMore[productId] && caption.length > 20) {
            caption = caption.substring(0, 50) + '...';
        }
        const image = cart?.product?.images[0];
        if (ctx.session.cleanUpState && ctx.session.cleanUpState.find(message => message.type === 'cart' && message.productId === productId)) {
            const messageId = ctx.session.cleanUpState.find(message => message.type === 'cart' && message.productId === productId).id;
            await ctx.telegram.editMessageMedia(
                ctx.chat.id,
                messageId,
                null,
                {
                    type: 'photo',
                    media: image,
                    caption: caption
                },
                Markup.inlineKeyboard([
                  
                    ...(cart.quantity > 0 && [
                        [
                            Markup.button.callback('-', `removeQuantity_${productId}`),
                            Markup.button.callback(`${cart.quantity}`, `quantity_${productId}`),
                            Markup.button.callback('+', `addQuantity_${productId}`)
                        ]
                    ] )
                ])
            )
        } else {

            const response = await axios.get(image, { responseType: 'arraybuffer' });
            const imageBuffer = await sharp(response.data)
                .resize(200, 200)
                .toBuffer();
        const message=    await ctx.replyWithPhoto({ source: imageBuffer }, {
                caption: caption,
                ...Markup.inlineKeyboard([
    
                    ...(cart.quantity > 0 && [
                        [
                            Markup.button.callback('-', `removeQuantity_${productId}`),
                            Markup.button.callback(`${cart.quantity}`, `quantity_${productId}`),      
                            Markup.button.callback('+', `addQuantity_${productId}`)

                        ]
                    ] )
                ])
            }
    
            )
            return {
                id: message.message_id,
                type: 'cart',
                productId:productId
            };
        }
    },

}