// Product scene
const { Scenes, Markup, session } = require("telegraf")
const axios = require('axios');
const sharp = require('sharp');
const { getProdcuts } = require("../Services/prodcut");
const { displyProdcut, sendProduct } = require("../Templeat/prodcut");
const pageSize = 3;
const apiUrl = 'http://localhost:5000';
// const apiUrl = 'https://backend-vg1d.onrender.com';
const productSceneTest = new Scenes.BaseScene('product');
productSceneTest.enter(async (ctx) => {
    const category = ctx.scene.state.category;
    const product = ctx.scene.state.product;
    const sortBy = ctx.scene.state.sortBy;
    ctx.session.shouldContinueSending = true;
    console.log(category)
    // ctx.session.cleanUpState = [];
    ctx.session.currentImageIndex = {};
    // Initialize the viewMore object in the session data
    ctx.session.viewMore = {};
    ctx.session.availableSizes = {}
    // Initialize the quantity object in the session data
    ctx.session.quantity = {};
    ctx.session.currentPage = 1;
    ctx.session.products = []
    ctx.session.cart = ctx.session.cart ?? [];
    let replyText = `You are now viewing our products.`; // Default reply text

    if (category && category.name) {
        replyText = `You are now viewing our ${category.name} products.`;
    } else if (sortBy) {
        replyText = `You are now viewing our products sorted by ${sortBy}.`;
    }
    console.log("product",product)
    const productsArray = Array.isArray(product) ? product : [product];
    const simplifiedProducts = productsArray.map(product => ({
        ...product,
        quantity: 0,
        availableSizes: ['37', '46', '48', '67']
        
    }));
    

    

    // if(product){ 
    //     try { 

    //      console.log("prodcut from the scene",product)
    //         await displyProdcut(ctx, product._id, product);
    //       } catch (error) {
    //         console.error('Error handling quantity action:', error);
    //       } 
    // }else{
    //     await sendPage(ctx)
    // }
    await ctx.replyWithChatAction('typing');
    const prodcutKeuboard = await ctx.reply(
        replyText,
        Markup.keyboard([ 
            ['Home', 'Category'], 
            ['Checkout']
        ]).resize(),
    );
    ctx.session.cleanUpState.push({ id: prodcutKeuboard.message_id, type: 'productKeyboard' })
     
ctx.session.products=simplifiedProducts;
product? await displyProdcut(ctx, productsArray):await sendPage(ctx)   // await sendPage(ctx)
});


productSceneTest.action('Previous', (ctx) => {
    if (ctx.session.currentPage > 0) {
        ctx.session.currentPage--;
        sendPage(ctx);
    }
});
productSceneTest.action('Next', async (ctx) => {
    if ((ctx.session.currentPage) * pageSize < ctx.session.totalNumberProducts) {
        ctx.session.currentPage++;
        await sendPage(ctx);
    }
});

productSceneTest.hears('Checkout', async (ctx) => {

    ctx.session.shouldContinueSending = false

    try {
        if (ctx.session.cleanUpState) {
            ctx.session.cleanUpState.forEach(async (message) => {
                if (message.type === 'product' || message.type === 'pageNavigation' /* && message.type === 'summary' */) {
                    await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                }
            });
        }
    } catch (error) {
        ctx.reply(error)
    }
    // await ctx.scene.leave();
    // setTimeout(async () => {

    //     await ctx.scene.enter('cart');
    // }, 1000);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.scene.enter('cart');
});
productSceneTest.hears('Home', async (ctx) => {
    try {
        try {
            if (ctx.session.cleanUpState) {
                ctx.session.cleanUpState.forEach(async (message) => {
                    if (message?.type === 'product' || message?.type === 'pageNavigation' || message?.type === 'productKeyboard'/* && message.type === 'summary' */) {
                        try {
                            await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                        }
                        catch (error) {
                            console.log(error)
                        }
                        // await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                    }

                });
            }
        } catch (error) {
            ctx.reply(error)
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        await ctx.scene.enter('homeScene');
    } catch (error) {
        await ctx.reply(error)

    }
    ctx.session.shouldContinueSending = false

});
productSceneTest.hears('Category', async (ctx) => {
    try {
        try {
            if (ctx.session.cleanUpState) {
                ctx.session.cleanUpState.forEach(async (message) => {
                    if (message?.type === 'product' || message?.type === 'pageNavigation' || message?.type === 'productKeyboard'/* && message.type === 'summary' */) {
                        try {
                            await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                        }
                        catch (error) {
                            console.log(error)
                        }
                        // await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                    }

                });
            }
        } catch (error) {
            ctx.reply(error)
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        await ctx.scene.enter('category');
    } catch (error) {
        await ctx.reply(error)

    }
    ctx.session.shouldContinueSending = false

});
productSceneTest.action('Checkout', async (ctx) => {
    // await ctx.scene.leave();
    ctx.session.shouldContinueSending = false

    try {
        if (ctx.session.cleanUpState) {
            ctx.session.cleanUpState.forEach(async (message) => {
                if (message.type === 'product' || message.type === 'pageNavigation' /* && message.type === 'summary' */) {
                    await ctx.telegram.deleteMessage(ctx.chat.id, message.id);
                }
            });
        }
    } catch (error) {
        ctx.reply(error)
    }
    // await ctx.scene.leave();
    // setTimeout(async () => {

    //     await ctx.scene.enter('cart');
    // }, 1000);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await ctx.scene.enter('cart');

});
productSceneTest.action(/size_(.+)_([^_]+)/, async (ctx) => {
    const productId = ctx.match[1];
    const size = ctx.match[2];

    // Find the product in the session
    const productIndex = ctx.session.products.findIndex((p) => p._id === productId);
    if (productIndex === -1) {
        // Product not found, handle accordingly
        return;
    }

    let product = ctx.session.products[productIndex];

    // Check if the selected size is the same as the current selectedSize
    if (product.selectedSize === size) {
        // If the selected size is the same, deselect it
        product.selectedSize = null;
    } else {
        // If a different size is selected, update the selectedSize
        product.selectedSize = size;
    }
console.log("prodcut update........",product,)
    // Edit the button to add or remove a check mark
    const newMarkup = ctx.callbackQuery.message.reply_markup.inline_keyboard.map(row =>
        row.map(button => button.callback_data === ctx.callbackQuery.data ? { ...button, text: `${size}${size === product.selectedSize ? '✅' : ''}` } : button)
    );

  ctx.editMessageReplyMarkup({ inline_keyboard: newMarkup });

    // Call sendProduct to update the product message
    sendProduct(ctx, productId, product);
});


// When the user clicks on a "Next" inline button, update the current image productId for that product and send an updated message using the sendProduct function
productSceneTest.action(/next_(.+)/, (ctx) => {
    console.log(ctx.session.currentImageIndex)
    const productId = ctx.match[1];
    const products = ctx.session.products;
    const product = products?.filter((p) => p._id == productId)
    console.log("singleProdcut................", product)
    ctx.session.currentImageIndex[productId]++;
    if (ctx.session.currentImageIndex[productId] >= product[0].images.length) {
        ctx.session.currentImageIndex[productId] = 0;
    }
    sendProduct(ctx, productId, product[0]);
});

// When the user clicks on a "Previous" inline button, update the current image productId for that product and send an updated message using the sendProduct function
productSceneTest.action(/previous_(.+)/, (ctx) => {
    console.log(ctx.session.currentImageIndex)
    const productId = ctx.match[1];

    const products = ctx.session.products;
    const product = products.filter((p) => p._id == productId)

    // ctx.session.currentImageIndex[productId]--;
    if (product[0].images.length > 1) {
        ctx.session.currentImageIndex[productId]--;
        if (ctx.session.currentImageIndex[productId] < 0) {
            ctx.session.currentImageIndex[productId] = product[0].images.length - 1;
        }

    }

    sendProduct(ctx, productId, product[0]);
});

productSceneTest.action(/viewMore_(.+)/, (ctx) => {
    console.log("reach...viewmore")
    const productId = ctx.match[1];
    ctx.session.viewMore[productId] = true;
    const products = ctx.session.products;
    const product = products.filter((p) => p._id == productId)
    console.log("is prodcut found", ctx.session)
    sendProduct(ctx, productId, product[0]);
});

productSceneTest.action(/viewLess_(.+)/, (ctx) => {
    const productId = ctx.match[1];
    ctx.session.viewMore[productId] = false;
    // ctx.session.quantity[productId] = 0;
    const products = ctx.session.products;
    const product = products.filter((p) => p._id == productId)
    product[0].quantity[productId] = 0;
    sendProduct(ctx, productId, product[0]);
});
productSceneTest.action(/buy_(.+)/, async (ctx) => {
    const productId = ctx.match[1];

    // ctx.session.quantity[productId] = 1;
    const products = ctx.session.products;
    const product = products.filter((p) => p._id == productId)
    // product[0].quantity++
    // console.log("product find on buy.............",product[0].quantity++ )
    const cartItemIndex = ctx.session.cart.findIndex(item => item._id === productId);

    if (cartItemIndex === -1) {
        ctx.session.cart.push({
            ...product[0],
            quantity: 1,

        });
        product[0].quantity++
        // ctx.reply(`You have added ${ product[0].quantity}" of product ${productId} to your cart.`);
    } else {
        // ctx.reply(`agsin You have added ${product[0].quantity}" of product ${productId} to your cart.`);
        ctx.session.cart[cartItemIndex].quantity += product[0].quantity;
    }
    await ctx.answerCbQuery(`You have added ${product[0].quantity} of product ${product.name} to your cart.`);

    sendProduct(ctx, productId, product[0]);
    // Send summary messag

    //   sendSummary(ctx, product[0]);
});

productSceneTest.action(/addQuantity_(.+)/, async (ctx) => {
    const productId = ctx.match[1];

    // ctx.session.quantity[productId]++;
    const products = ctx.session.products;
    let product = products.filter((p) => p._id == productId)
    //  product[0].quantity++;
    const cartItemIndex = ctx.session.cart.findIndex(item => item._id === productId);
    console.log(cartItemIndex)
    console.log(ctx.session.cart[cartItemIndex])
    if (cartItemIndex === -1) {
        ctx.session.cart.push({
            ...product[0],
            quantity: product[0].quantity,
            // quantity: 1
        });
        // ctx.reply(`You have added ${ product[0].quantity}" of product ${productId} to your cart.`);
    } else {

        ctx.session.cart[cartItemIndex].quantity += 1;
        // ctx.reply(`agsin FROM ADD You have added ${ctx.session.cart[cartItemIndex].quantity}" of product ${productId} to your cart.`);
    }
    product[0].quantity++;
    sendProduct(ctx, productId, product[0]);
    await ctx.answerCbQuery(`You have added ${product.quantity} of product ${product.name} to your cart.`);
    // sendSummary(ctx, product[0]);
});

productSceneTest.action(/removeQuantity_(.+)/, async (ctx) => {
    const productId = ctx.match[1];
    const products = ctx.session.products;
    let product = products.filter((p) => p._id == productId)

    const cartItemIndex = ctx.session.cart.findIndex(item => item._id === productId);
    console.log(cartItemIndex)
    console.log(ctx.session.cart[cartItemIndex])
    if (cartItemIndex !== -1) {
        ctx.session.cart[cartItemIndex].quantity -= 1;
        product[0].quantity--;
        // ctx.reply(`You have devrease ${ product[0].quantity}" of product ${productId} to your cart.`);
    }
    if (ctx.session.cart[cartItemIndex]?.quantity == 0) {
        let index = ctx.session.cart.map(x => x.Id).indexOf(productId);
        ctx.session.cart.splice(index, 1);
        await ctx.answerCbQuery(`You have delete ${product.name} from your cart.`);
        //   ctx.session.cart.filter((p) => p._id !== productId)

        // ctx.reply(`delete ${ctx.session.cart[cartItemIndex].quantity}" of product ${productId} to your cart.`);
    }
    // product[0].quantity--;       

    sendProduct(ctx, productId, product[0]);
    await ctx.answerCbQuery(`You  have remove ${product.quantity} of product ${product.name} to your cart.`);
})



async function sendPage(ctx) {
    if (ctx.session.cleanUpState) {
        ctx.session.cleanUpState.forEach((message) => {
            if (message?.type === 'product' || message?.type === 'pageNavigation' || message?.type === 'home') {
                ctx.telegram.deleteMessage(ctx.chat.id, message.id).catch((e) => ctx.reply(e.message));

            }
        });
    }
    // ctx.session.cleanUpState = []
   
    const response = await getProdcuts(ctx, pageSize)
    const productsData = response.data.products;
     const simplifiedProducts = productsData.map(product => ({
         ...product,
        quantity: 0,
        availableSizes: ['37', '46', '48', '67']
    }));
    ctx.session.products = simplifiedProducts;
    ctx.session.page = response.data.page;
    ctx.session.totalPages = response.data.totalPages;
    ctx.session.totalNumberProducts = response.data.count;
    await displyProdcut(ctx, await response.data.products);
    await sendPageNavigation(ctx);
}

productSceneTest.leave(async (ctx) => {

    console.log("ctx.session.cleanUpState =>", ctx.session.cleanUpState)
    try {
        if (ctx.session.cleanUpState) {
            ctx.session.cleanUpState.forEach(async (message) => {
                console.log("%c called deleteing when its leave", "color: red;")
                if (message?.type === 'product' && message?.type === 'pageNavigation') {
                    await ctx.deleteMessage(ctx.chat.id, message?.id);
                }
                // {
                //     throw new Error('The type is not defined');
                // }

            });
        }


    } catch (error) {

    }
    ctx.session.products = [];
    await ctx.scene.leave();
})
async function sendPageNavigation(ctx) {
    let totalPages = ctx.session.totalPages
    let pageSizeNumber = ctx.session.page
    console.log("pageSizeNumber", pageSizeNumber)
    // const response = await axios.get(`${apiUrl}/api/getproducts?page=${ctx.session.currentPage}&pageSize=${pageSize}`);
    // console.log("ctx.session.currentPage", ctx.session.currentPage + 1)
    // console.log("response.data.totalPages", Math.floor(response / pageSize))
    const perPage = 3
    const previousButton = Markup.button.callback('Previous', 'Previous');
    const nextButton = Markup.button.callback('Next', 'Next');
    let pageSize = Markup.button.callback(`${pageSizeNumber}/${totalPages}`, 'as');
    let buttons;
    if (!ctx.session.shouldContinueSending) {
        buttons = []
    }
    if (ctx.session.totalNumberProducts > perPage && ctx.session.currentPage === 1) {
        buttons = [pageSize, nextButton];
    }
    else if (ctx.session.totalNumberProducts <= pageSizeNumber) {
        buttons = [Markup.button.callback('No More Product', 'no')]
    }
    // else if ( ctx.session.currentPage  < totalPages) {
    //     buttons = [previousButton,pageSize,nextButton];
    // }  // else if (ctx.session.currentPage < totalPages) {
    //     buttons = [];
    // }
    else if (ctx.session.totalNumberProducts >= perPage && ctx.session.currentPage === totalPages) {
        buttons = [previousButton, pageSize];
    }
    // if ( ctx.session.currentPage  == totalPages) {
    //     buttons = [previousButton,pageSize];
    // }
    // } else if (ctx.session.currentPage +1===  Math.floor(response.data.total / pageSize)) {
    //     buttons = [previousButton];
    // } 
    // else if (ctx.session.currentPage < totalPages) {
    //     buttons = [];
    // }

    else {
        buttons = [previousButton, pageSize, nextButton];
    }

    const message = await ctx.reply('Navigate pages:', Markup.inlineKeyboard(buttons));

    await ctx.session.cleanUpState.push({ id: message.message_id, type: 'pageNavigation' });
}
// productSceneTest.leave(async (ctx) => {
//   await ctx.scene.leave();
// });
module.exports = {
    productSceneTest
}