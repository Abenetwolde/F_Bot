
const axios = require('axios');
const { Scenes, Markup, session } = require("telegraf");

const apiUrl = 'http://localhost:5000';
// const apiUrl = 'https://backend-vg1d.onrender.com';

module.exports = {
    getProdcuts: async function (ctx, pageSize) {
       const category = ctx.scene.state?.category?.id;
        const sortBy = ctx.scene.state.sortBy;
        console.log("sortBy",sortBy)
        switch (true) {
            case !!sortBy:
                productUrl = await axios.get(`${apiUrl}/api/getproducts?sortBy=${sortBy}&page=${ctx.session.currentPage}&pageSize=${pageSize}`);
                break;
            case !!category:
                productUrl = await axios.get(`${apiUrl}/api/getproducts?categories=${category}&page=${ctx.session.currentPage}&pageSize=${pageSize}`);
                break;
            default:
                productUrl = await axios.get(`${apiUrl}/api/getproducts?page=${ctx.session.currentPage}&pageSize=${pageSize}`);
        }

        return productUrl;
 
    },
    
}