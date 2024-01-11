const { homeScene } = require('./homescene');
const { productSceneTest } = require('./product');
const { categoryScene } = require('./category');
const { cart } = require('./cart');
const { searchProduct } = require('./searchProdcut');
const { selectePaymentType } = require("./selectePaymentTypeScene")
const { noteScene } = require("./note")
const { paymentScene } = require("./payment");
const { detailScene } = require('./detail');

module.exports = {
    homeScene,
    productSceneTest,
    categoryScene,
    cart,
    searchProduct,
    selectePaymentType,
    noteScene,
    paymentScene,
    detailScene
}