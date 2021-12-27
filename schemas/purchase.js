const mongoose = require('mongoose')
const Schema = mongoose.Schema
const opts = { toJSON: { virtuals: true } };

const PurchaseSchema = new Schema({
    contents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    totalPrice: Number,
    date: Date
}, opts);

module.exports = mongoose.model('Purchase', PurchaseSchema)