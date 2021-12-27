const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
const ShoppingCart = require('./shoppingCart');

const opts = { toJSON: { virtuals: true } };

const ShopperSchema = new Schema({
    username: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    cart: {
        type: Schema.Types.ObjectId,
        ref: 'ShoppingCart'
    },
    wishlist: {
        type: Schema.Types.ObjectId,
        ref: 'Wishlist'
    },
    role: String
}, opts);

ShopperSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('Shopper', ShopperSchema)