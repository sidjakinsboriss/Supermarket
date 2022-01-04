const Delivery = require('../schemas/delivery')
const InventoryProduct = require('../schemas/inventoryProduct')

//Check if delivery has already arrived
//If it arrived, processes the delivery
async function processDelivery() {
    const deliveries = await Delivery.find({}).populate('products')
    const date = new Date()
    for (let delivery of deliveries) {
        if (date.getFullYear > parseInt(delivery.date_time.slice(0, 4)) ||
            (date.getMonth() > parseInt(delivery.date_time.slice(5, 7)) && date.getDate() > parseInt(delivery.date_time.slice(8, 10))
                && date.getHours > parseInt(delivery.date_time.slice(11, 13)) && date.getMinutes > parseInt(delivery.date_time.slice(14, 16)))) {
            console.log("PROCESSING")
            for (let i = 0; i < delivery.products.length; i++) {
                let product = delivery.products[i]
                const invProduct = await InventoryProduct.findOneAndUpdate({ name: product.name }, { $inc: { 'amount': delivery.amounts[i] } })
                await invProduct.save()
            }
            await Delivery.findByIdAndDelete({ _id: delivery._id })
        } else {
            console.log("HAS NOT ARRIVED")
        }
    }

}

module.exports = { processDelivery }