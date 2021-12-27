const mongoose = require('mongoose')
const Schema = mongoose.Schema
const opts = { toJSON: { virtuals: true } };

const OrderSchema = new Schema({
    contents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'InventoryProduct'
        }
    ],
    totalPrice: Number,
    date: Date
}, opts);

module.exports = mongoose.model('Order', OrderSchema)