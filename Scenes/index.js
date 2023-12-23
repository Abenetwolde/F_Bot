const { homeScene } = require('./homescene');
const { productSceneTest } = require('./product');
const { categoryScene } = require('./category');
const { cart } = require('./cart');
const { searchProduct } = require('./searchProdcut');
const { dateScene } = require("./dateScene")
const { noteScene } = require("./note")
const { paymentScene } = require("./payment");
const { detailScene } = require('./detail');

module.exports = {
    homeScene,
    productSceneTest,
    categoryScene,
    cart,
    searchProduct,
    dateScene,
    noteScene,
    paymentScene,
    detailScene
}