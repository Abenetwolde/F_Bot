const mongoose = require('mongoose');
// require('dotenv').config();
//  = process.env.MONGO_URI;
// / const MONGO_URI= 'mongodb+srv://Abnet:80110847@cluster0.vdpmtdg.mongodb.net/?retryWrites=true&w=majority'
 //const MONGO_URI= 'mongodb://localhost:27017/bot'
// const MONGO_URI="mongodb+srv://Abnet:80110847@cluster0.vdpmtdg.mongodb.net/"
//ATLAS
const MONGO_URI= 'mongodb+srv://Abnet:80110847@cluster0.vdpmtdg.mongodb.net/?retryWrites=true&w=majority'
const connectDatabase = () => {
    mongoose.connect(MONGO_URI, {  useNewUrlParser: true,
        useUnifiedTopology: true,
        })
        .then(() => { 
            console.log("Mongoose Connected");
         });    
} 

module.exports = connectDatabase;