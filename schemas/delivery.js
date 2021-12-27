const mongoose = require('mongoose')
const Schema = mongoose.Schema

const opts = { toJSON: { virtuals: true } }

const DeliverySchema = new Schema({
    date_time: String,
    order_id: Number,
    products: [
        {
            type: Schema.Types.ObjectId,
            ref: 'InventoryProduct'
        }
    ],
    amounts: [Number]
}, opts)

module.exports = mongoose.model('Delivery', DeliverySchema)