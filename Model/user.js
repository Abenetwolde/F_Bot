const mongoose = require('mongoose');

const LanguageEnum = {
  EN: 'en',
  RU: 'am',
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
  name: {
    type: String,
  },
  last: {
    type: String,
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
