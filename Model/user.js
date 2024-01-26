const mongoose = require('mongoose');

const LanguageEnum = {
  EN: 'en',
  RU: 'ru',
};

const userSchema = new mongoose.Schema({
  telegramid: {
    type: Number,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  username:{
    type: String,
  },
  is_bot:{
    type: Boolean,
  },
  role: {
    type: String,
    // default: 'User',
    // required: [true, 'Role is required'],
  },
  language: {
    type: String,
    default: LanguageEnum.EN,
    enum: Object.values(LanguageEnum),
  },
  token: {
    type: String,
  },
});

module.exports = mongoose.model('Users', userSchema);
