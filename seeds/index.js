const mongoose = require('mongoose')
const Product = require('../schemas/product');
const products = require('./products')
const Shopper = require('../schemas/shopper')
const ShoppingCart = require('../schemas/shoppingCart')
const Manager = require('../schemas/manager')
const InventoryProduct = require('../schemas/inventoryProduct')
const Delivery = require('../schemas/delivery')

mongoose.connect('mongodb://localhost:27017/supermarket', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection

db.on("error", console.error.bind(console, "connection error:"))

db.once("open", () => {
    console.log("Database connected");
})

const seedDB = async () => {

    await Product.deleteMany({});
    await Shopper.deleteMany({});
    await ShoppingCart.deleteMany({});
    await Manager.deleteMany({})
    await InventoryProduct.deleteMany({})
    await Delivery.deleteMany({})
    await Wishlist.deleteMany({})

    for (let i = 0; i < 8; i++) {
        try {

            const product = new Product({
                name: `${products[i].name}`,
                price: `${products[i].price}`,
                description: `${products[i].description}`,
                barcode: `${products[i].barcode}`,
                imageUrl: `${products[i].imageUrl}`,
                top: `${products[i].mapLocation.top}`,
                left: `${products[i].mapLocation.left}`
            })

            const invProduct = new InventoryProduct({
                id: i,
                name: `${products[i].name}`,
                price: `${products[i].price}`,
                supplierPrice: `${products[i].supplierPrice}`,
                supplierVat: `${products[i].vat_rate}`,
                supplierId: `${products[i].supplierId}`,
                spent: 0,
                earned: 0,
                revenue: 0,
                toOrder: 100,
                amount: 100
            })

            await product.save()
            await invProduct.save()

        } catch (error) {
            console.error(error.message);
        }
    }

}

seedDB().then(() => {
    mongoose.connection.close();
})