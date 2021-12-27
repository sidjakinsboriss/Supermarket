const mongoose = require('mongoose')
const Schema = mongoose.Schema
const opts = { toJSON: { virtuals: true } };

const WishlistSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Shopper'
    },
    contents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        }
    ]
}, opts);

module.exports = mongoose.model('Wishlist', WishlistSchema);