const { Markup, session } = require("telegraf")
const productdata = [
    {
        id: "156345",
        name: "Example Product2",
        description: "This is an example product for demonstration purposes.",
        "price": 9.99,
        "currency": "ETB",
        images: [
            "https://th.bing.com/th/id/R.90836933cf066cc59f49b1ebad063724?rik=UIEBgULiwVR2cQ&pid=ImgRaw&r=0",
            "https://th.bing.com/th/id/OIP.K8piq_1Rl_AyeNbcDyPpPgAAAA?pid=ImgDet&rs=1",
            "https://th.bing.com/th/id/OIP.y7QJCUnLeQFDE2FXeXH_CwHaHa?pid=ImgDet&rs=1"

        ],
        "category": "Example Category2",
        "tags": ["example", "product", "demo"],
        "stock": 100,
        "rating": 4.5,
        "reviews": [
            {
                "user": "John Doe",
                "rating": 5,
                "comment": "Great product!"
            },
            {
                "user": "Jane Doe",
                "rating": 4,
                "comment": "Good value for the price."
            }
        ],
        "dimensions": {
            "weight": 1.2,
            "height": 10,
            "width": 5,
            "depth": 2
        },
        "brand": "Example Brand"
    }, {
        id: "12345",
        name: "Example Product",
        description: "This is an example product for demonstration purposes.",
        "price": 9.99,
        "currency": "ETB",
        images: [
            "https://th.bing.com/th/id/OIP.XVHy_Fknn_6rQdBA5TVwzAHaHa?pid=ImgDet&rs=1",
            "https://th.bing.com/th/id/OIP.XVHy_Fknn_6rQdBA5TVwzAHaHa?pid=ImgDet&rs=1",
            "https://th.bing.com/th/id/OIP.K8piq_1Rl_AyeNbcDyPpPgAAAA?pid=ImgDet&rs=1",
            "https://th.bing.com/th/id/OIP.y7QJCUnLeQFDE2FXeXH_CwHaHa?pid=ImgDet&rs=1"

        ],
        "category": "Example Category",
        "tags": ["example", "product", "demo"],
        "stock": 100,
        "rating": 4.5,
        "reviews": [
            {
                "user": "John Doe",
                "rating": 5,
                "comment": "Great product!"
            },
            {
                "user": "Jane Doe",
                "rating": 4,
                "comment": "Good value for the price."
            }
        ],
        "dimensions": {
            "weight": 1.2,
            "height": 10,
            "width": 5,
            "depth": 2
        },
        "brand": "Example Brand"
    }]
module.exports = {
    ProductWelcomeMessage: function (shopName) {

        return `
Welcome to <b>${shopName}'s</b> catalogue!
`
    },

    sendMessage: async function (ctx, categoryName, product, stock) {
        console.log(product)
        return await ctx.reply(product.name)
        // return await ctx.replyWithPhoto("https://th.bing.com/th/id/OIP.y7QJCUnLeQFDE2FXeXH_CwHaHa?pid=ImgDet&rs=1", /* Template.productButtons(categoryName, product, quantity) */)
    },
    sendProducts: async function (ctx, categoryName, cart) {
        // let products = productdata
        console.log(ctx.scene)
        let productMessageID = []
        productMessageID = await Promise.all(
            productdata.map(async (product) => {
                //   console.log(product);
                //    await ctx.reply(product.name)
                //   const message = await module.exports.sendMessage(ctx, product);
                const message = await ctx.replyWithPhoto(product.images[0],
                    {
                        caption: `${product.name}\n${product.description}\n${product.price}:${product.currency}\n${product.category}\n${product.brand}`,
                        parse_mode: "Markdown",
                        ...Markup.inlineKeyboard(
                                            [
                                                Markup.button.callback("Previous", "previous"),
                                                Markup.button.callback("View Product", "viewDetails"),
                                                Markup.button.callback("Next", "next"),
                            
                                            ]),
                    }
                )
                return {
                    id: message.message_id,
                    type: "product",
                    productName: product.name,
                };
            })
        );

        return productMessageID
    },
    categoryMenuButtons: function () {
        const extra = Markup
            .keyboard([
                ["🏠 Back to Home"]
            ])
            .resize()
        extra.parse_mode = "HTML"
        return extra
    },
    categoryMessage: function (body, shopName) {
        return body + `<i>🟢 - Available</i>
<i>🟡 - Low on stock</i>
<i>🔴 - Out of stock</i>

<i>Navigate to the individual category using the buttons below that <b>${shopName}</b> offers.</i>
`
    },
}