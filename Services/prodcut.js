
const axios = require('axios');
const { Scenes, Markup, session } = require("telegraf");
const { getAllProducts } = require('../Database/productcontroller');

const apiUrl = 'http://localhost:5000';
// const apiUrl = 'https://backend-vg1d.onrender.com';

module.exports = {
    getProducts: async function (ctx,params) {
        const category = ctx.scene?.state?.category?.id;
        const sortBy = ctx.scene?.state?.sortBy;
        const page = params.page || 1;

        console.log("what is params say",params)
        const pageSize = params.pageSize || 1;
     const search=params.search
        // console.log("sortBy", sortBy);
    
        try {
 const product= await getAllProducts({
            category: category,
            search,
            // sortBy: sortBy||"latest",
            page: ctx.session.currentPage||1,
            pageSize: pageSize,
          });
    
         const productsJson = JSON.stringify(product);
          console.log("Prodcut.........",productsJson)
          return productsJson
        } catch (error) {
          throw new Error('Error fetching products from the database.');
        }
      },
    // getProdcuts: async function (ctx, pageSize) {
    //    const category = ctx.scene.state?.category?.id;
    //     const sortBy = ctx.scene.state.sortBy;
    //     console.log("sortBy",sortBy)
    //     switch (true) {
    //         case !!sortBy:
    //             productUrl = await axios.get(`${apiUrl}/api/getproducts?sortBy=${sortBy}&page=${ctx.session.currentPage}&pageSize=${pageSize}`);
    //             break;
    //         case !!category:
    //             productUrl = await axios.get(`${apiUrl}/api/getproducts?categories=${category}&page=${ctx.session.currentPage}&pageSize=${pageSize}`);
    //             break;
    //         default:
    //             productUrl = await axios.get(`${apiUrl}/api/getproducts?page=${ctx.session.currentPage}&pageSize=${pageSize}`);
    //     }

    //     return productUrl;
 
    // },
    
}