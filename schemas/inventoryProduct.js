const mongoose = require('mongoose')
const Schema = mongoose.Schema

const opts = { toJSON: { virtuals: true } };

const InventoryProductSchema = new Schema({
    id: Number,
    name: String,
    price: Number,
    supplierPrice: Number,
    supplierVat: Number,
    supplierId: Number,
    spent: Number,
    earned: Number,
    revenue: Number,
    toOrder: Number,
    amount: Number
}, opts);

module.exports = mongoose.model('InventoryProduct', InventoryProductSchema);