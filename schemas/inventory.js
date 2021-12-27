const mongoose = require('mongoose')
const Schema = mongoose.Schema

const opts = { toJSON: { virtuals: true } };

const InventorySchema = new Schema({
    products: [
        {
            type: Schema.Types.ObjectId,
            ref: 'InventoryProduct'
        }
    ]
}, opts);

module.exports = mongoose.model('Inventory', InventorySchema);