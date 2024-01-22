const { homeScene } = require('./homescene');
const { productSceneTest } = require('./product');
const { cart } = require('./cart');
const { searchProduct } = require('./searchProdcut');
const { selectePaymentType } = require("./selectePaymentTypeScene")
const { noteScene } = require("./note")
const { paymentScene } = require("./payment");
const { informationCash } = require('./informationChash');
const { addressOnline } = require('./addressOnline');
const myOrderScene = require('./myorder');

module.exports = {
    homeScene,
    productSceneTest,
    cart,
    searchProduct,
    selectePaymentType,
    noteScene,
    paymentScene,
    informationCash,
    addressOnline,
    myOrderScene
}