const { Scenes, Markup } = require('telegraf');
const { getAllProducts } = require('../../Database/productcontroller');
const { sendProductToChannel } = require('./sendProduct');

const adminBaseScene = new Scenes.BaseScene('adminBaseScene');

// Add a keyboard to the admin scene
adminBaseScene.enter((ctx) => {
  const adminKeyboard = Markup.keyboard([
    ['Post Product'],
    ['Other Action 1', 'Other Action 2'],
    ['Exit'],
  ]).resize();

  return ctx.reply('Admin Actions:', adminKeyboard);
});

// Handle the selected option
adminBaseScene.hears('Post Product', async (ctx) => {
  // You can implement logic here to gather information about the product
  const productsData = {
// Replace with the category you want to fetch
    page: 1,
    pageSize: 3,
  };
  const productsResult = await getAllProducts(productsData);
  for (const product of productsResult.products) {
    ctx.session.currentImageIndex[product._id] = 0;
    ctx.session.viewMore[product._id] = false;
    await sendProductToChannel(ctx, product._id, product);
  }


  ctx.scene.enter('adminBaseScene');
});

// Handle other actions
adminBaseScene.hears('Other Action 1', (ctx) => ctx.reply('Performing Other Action 1'));
adminBaseScene.hears('Other Action 2', (ctx) => ctx.reply('Performing Other Action 2'));

// Handle exit action
adminBaseScene.hears('Exit', (ctx) => ctx.scene.leave());

// You can add more handlers based on your requirements

module.exports = adminBaseScene;
