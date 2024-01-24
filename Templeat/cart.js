
const axios = require('axios');
const sharp = require('sharp');
const { Scenes, Markup, session } = require("telegraf")
module.exports = {
     sendCartProduct: async function (ctx, productId, cart, iscart) {
        const formatTelegramMessage = (product) => {
            const { name, description, price, available, warranty, category, highlights, images, createdAt } = product;

            const formattedHighlights = highlights.map((highlight) => `${highlight}`).join(',');
          const formattedprice= product.quantity!==0?
          `  
          . 
          . 
           ${product.quantity}x${product.price}= ${product.quantity*product.price} ETB`:''
            
            return `
         ${category.icon} ${name} ${category.icon}
         ${description}
         💴 ${price} ETB
         #${category.name} ${category.icon}
         ${formattedHighlights}
         ${formattedprice}
        
        
            `;
        };
        let caption = '';
        caption+=`${cart?.product?.category?.icon} ${cart.product.name} ${cart?.product?.category?.icon} \n`
        caption+=`💴 ${cart.product.price} ETB\n`
        caption+=`.\n`
        caption+=`.\n`
        caption+= `${cart.quantity} x ${cart.product.price} = ${cart.quantity * cart.product.price} ETB`
        if (ctx.session?.viewMore&&!ctx.session?.viewMore[productId] && caption.length > 100) {
            caption = caption.substring(0, 100) + '...';
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
                    media: `${process.env.FOOD_API_DOMAIN}${image}`,
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
            const resizeimage = `${process.env.FOOD_API_DOMAIN}${image}`
            const response = await axios.get(resizeimage, { responseType: 'arraybuffer' });
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