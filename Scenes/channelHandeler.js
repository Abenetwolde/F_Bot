const { Scenes, Markup } = require('telegraf');
// const { getAllProducts } = require('../../Database/productcontroller');
// const { sendProductToChannel } = require('./sendProduct');
const { updateUserLanguage } = require('../Database/UserController');
const { getSingleProduct } = require('../Database/productcontroller');
const User = require('../Model/user');

const channelHandeler = new Scenes.BaseScene('channelHandeler');

// Add a keyboard to the admin scene
channelHandeler.enter(async(ctx) => {
    const product = ctx.scene.state.pid;
    ctx.session.productID = product;
    console.log("pid...........",product)
    const message = await ctx.reply('Please choose your language', Markup.inlineKeyboard([
        Markup.button.callback('English', 'set_lang:en'),
        Markup.button.callback('አማርኛ', 'set_lang:am')
    ]));
    ctx.session.languageMessageId = message.message_id;
    let existingUser = await User.findOne({ telegramid: ctx.from.id });
    if (!existingUser) {
      console.log("register event channel")
        // If the user doesn't exist, create a new user document
        existingUser = await User.create({
          telegramid: ctx.from.id,
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name,
          username: ctx.from.username || null,
          is_bot: ctx.from.is_bot || false,
            from: 'CHANNEL' // Set initial status
        });
    } /* else {
        // If the user exists, update their information
        existingUser.first_name = ctx.from.id;
        existingUser.last_name = ctx.from.first_name;
        existingUser.username = username;
        await existingUser.save();
    } */
});

channelHandeler.action(/set_lang:(.+)/, async (ctx) => {
    if (!ctx.session) {
      ctx.session = {}; // Initialize session if not exists
    }
    ctx.session.locale = ctx.match[1];

    ctx.i18next.changeLanguage(ctx.session.locale);
    if (ctx.session.languageMessageId) {
      await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.languageMessageId);
    }
    const updateResult = await updateUserLanguage(ctx.from.id, ctx.session.locale);

    if (updateResult.success) {
      console.log(updateResult.message);
      
    } else {
      console.error(updateResult.message);
    }
    const productId = await ctx.session.productID;
    const response = await getSingleProduct(productId);
    const product = JSON.stringify(response)
    if (product) {
        // product.quantity = typeof product.quantity === 'number' ? product.quantity : 0;
        const singleP = await JSON.parse(product)
        // Update the quantity based on the action
        await ctx.scene.enter('product', { product: singleP });

      } else {
        console.error('Product not found.');
        // Handle the case when the product is not found
      }
  });
module.exports = channelHandeler;
