const mongoose = require('mongoose')
const Schema = mongoose.Schema

const opts = { toJSON: { virtuals: true } };

const ProductSchema = new Schema({
    name: String,
    price: Number,
    description: String,
    barcode: String,
    imageUrl: String,
    top: Number,
    left: Number

}, opts);

module.exports = mongoose.model('Product', ProductSchema);