const mongoose = require('mongoose')
const Schema = mongoose.Schema
const opts = { toJSON: { virtuals: true } };

const ShoppingCartSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
            ref: 'Shopper'
    },
    contents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    totalPrice: Number
}, opts);

module.exports = mongoose.model('ShoppingCart', ShoppingCartSchema);