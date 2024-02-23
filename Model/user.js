const mongoose = require('mongoose');

const LanguageEnum = {
  EN: 'en',
  AM: 'am',
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
    default: 'USER',
    required: [true, 'Role is required'],
  },
  from: {
    type: String,
    default: 'BOT',
    enum: ['BOT', 'CHANNEL'],
    required: [true, 'status is required'],
  },
  language: {
    type: String,
    default: LanguageEnum.EN,
    enum: Object.values(LanguageEnum),
  },
  token: {
    type: String,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Users', userSchema);
