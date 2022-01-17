let express = require('express')
const router = express.Router()
const passport = require('passport')
const Delivery = require('../schemas/delivery')
const InventoryProduct = require('../schemas/inventoryProduct')
const ShoppingCart = require('../schemas/shoppingCart')
const Shopper = require('../schemas/shopper')
const Product = require('../schemas/product')
const Wishlist = require('../schemas/wishlist')
const Purchase = require('../schemas/purchase')
const supplier = require('../utils/supplier')
const EventEmitter = require('events')
const myEmitter = new EventEmitter()

//Stripe 
let Publishable_Key = 'pk_test_S40pSqFZaRoK1Pm471370wRG008b75uVJO'
let Secret_Key = 'sk_test_AMiRflANXt5wfPl2dCStoxDt00FkbETbCb'
const stripe = require('stripe')(Secret_Key)

//Checks if the user is logged in
function isShopper(req, res, next) {
    if (!req.isAuthenticated() || !req.user) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be logged in as a shopper!')
        return res.redirect('/shopper/login')
    }
    next();
}

//Renders the shopper register form
router.get('/register', (req, res) => {
    res.render('register')
})

//Registers the shopper, then renders the products page
router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const shopper = new Shopper({ email, username, role: "shopper" });
        const registeredShopper = await Shopper.register(shopper, password);
        req.login(registeredShopper, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to ReThink Supermarket!');
            res.redirect('/shopper/products')
        })
    } catch (e) {
        req.flash('error', e.message);
        console.log(e)
        res.redirect('/shopper/register');
    }
})

//Renders the shopper login form
router.get('/login', (req, res) => {
    res.render('login')
})

//Logs in the shopper
router.post('/login', passport.authenticate('shopper', { failureFlash: true, failureRedirect: '/shopper/login' }), (req, res) => {
    req.flash('success', `Welcome back, ${req.user.username}`);
    res.redirect('/shopper/products')
})

//Displays all the products in the store
router.get('/products', async (req, res) => {
    const products = await Product.find({})
    res.render('products', { products })
})

//Displays the location of the product in the supermarket
router.get('/products/:id/details', async (req, res) => {
    const id = req.params
    const product = await Product.findById({ _id: id.id })
    res.render('productDetails', { product })
})

//Makes sure that it's impossible to view 
//the following routes without being logged in as a shopper
router.use('/', isShopper)

//Logs out the user
router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/home')
})

//Renders the scanner page
router.get('/scanner', (req, res) => {
    res.render('scanner')
})

//Renders the cart page
router.get('/cart', async (req, res) => {
    const shopper = await Shopper.findOne({ username: req.user.username }).populate('cart')
    const cart = await ShoppingCart.findOne({ owner: shopper }).populate('owner contents')
    res.render('cart', { cart, key: Publishable_Key })
})

//Adds a product to the cart
router.post('/cart', async (req, res) => {
    const { text } = req.body
    const product = await Product.findOne({ barcode: text })

    let shopper = await Shopper.findOne({ username: req.user.username }).populate('cart')

    if (shopper.cart === undefined || shopper.cart === null) {
        let shoppingCart = new ShoppingCart({ owner: shopper, totalPrice: product.price })
        shoppingCart.contents.push(product)
        await shoppingCart.save()
        shoppingCart = await ShoppingCart.findOne({ owner: shopper }).populate('owner contents')
        await Shopper.updateOne({ username: req.user.username }, { cart: shoppingCart })
    } else {
        let shoppingCart = await ShoppingCart.findOneAndUpdate({ owner: shopper }, { $inc: { 'totalPrice': product.price } }, { new: true })
        shoppingCart.contents.push(product)
        await shoppingCart.save()
    }

    res.redirect('/shopper/cart')
})

//Deletes a product from the cart
router.post('/deletefromcart', async (req, res) => {
    const { barcode } = req.body
    const product = await Product.findOne({ barcode: barcode })
    const shopper = await Shopper.findOne({ username: req.user.username }).populate('cart')
    const cart = await ShoppingCart.findOneAndUpdate({ owner: shopper }, { $inc: { 'totalPrice': -product.price }, $pull: { contents: product._id } })
    await cart.save()
    res.redirect('/shopper/cart')
})

//Renders the wishlist page
router.get('/wishlist', async (req, res) => {
    const shopper = await Shopper.findOne({ username: req.user.username }).populate('wishlist')
    const wishlist = await Wishlist.findOne({ owner: shopper }).populate('owner contents')
    res.render('wishlist', { wishlist })
})

//Adds a product to the wishlist
router.post('/wishlist', async (req, res) => {
    let { product } = req.body
    product = JSON.parse(product)
    console.log(product)
    let shopper = await Shopper.findOne({ username: req.user.username })
    if (shopper.wishlist) {
        let wishlist = await Wishlist.findOne({ owner: shopper })
        wishlist.contents.push(product)
        await wishlist.save()
    } else {
        let wishlist = new Wishlist({ owner: shopper })
        wishlist.contents.push(product)
        await wishlist.save()
        wishlist = await Wishlist.findOne({ owner: shopper }).populate('owner contents')
        await Shopper.updateOne({ username: req.user.username }, { wishlist: wishlist })
    }
    await shopper.save()
    res.redirect('back')
})

//Deletes a product from the wishing list
router.post('/deletefromwishlist', async (req, res) => {
    const { barcode } = req.body
    const product = await Product.findOne({ barcode: barcode })
    const shopper = await Shopper.findOne({ username: req.user.username }).populate('wishlist')
    const wishlist = await Wishlist.findOneAndUpdate({ owner: shopper }, { $pull: { contents: product._id } })
    await wishlist.save()
    res.redirect('/shopper/wishlist')
})

//Checks if there is already a delivery expected with the product
async function existsDelivery(product, deliveries) {
    for (let delivery of deliveries) {

        for (let prod of delivery.products) {
            let prod1 = await Product.findOne({ name: prod.name })
            if (JSON.stringify(prod1) === JSON.stringify(product))
                return true
        }
    }
    return false
}

//Triggered when a transaction goes through
//Checks if any of the products go below the limit and places an order to the supplier
myEmitter.on('event', async (products) => {

    let productsToOrder = []
    const deliveries = await Delivery.find({}).populate('products')

    for (let product of products) {
        const inventProd = await InventoryProduct.findOneAndUpdate({ name: product.name }, {
            $inc: {
                'revenue': product.price,
                'earned': product.price,
                'amount': -1
            }
        }, { new: true })
        await inventProd.save()
        const prod = await Product.findOne({ name: product.name })
        if (inventProd.amount < 100 && !(existsDelivery(prod, deliveries))) {
            //Update spent only if added to the delivery
            const inventProd1 = await InventoryProduct.findOneAndUpdate({ name: product.name }, {
                $inc: {
                    'revenue': -(inventProd.supplierPrice + inventProd.supplierPrice * inventProd.supplierVat) * inventProd.toOrder,
                    'spent': (inventProd.supplierPrice + inventProd.supplierPrice * inventProd.supplierVat) * inventProd.toOrder,
                }
            })
            await inventProd1.save()
            productsToOrder.push(product)
        }
    }

    if (productsToOrder.length) { //only order if array is not empty
        await supplier.getDelivery(productsToOrder)
    } else {
        console.log("NO ORDER")
    }

})

//Processes the payment
router.post('/payment', async (req, res) => {
    let { cart } = req.body
    cart = JSON.parse(cart)
    let products = cart.contents

    //Need to pass inventory products to emitter
    let prods = []
    for (let prod of products) {
        let invProd = await InventoryProduct.findOne({ name: prod.name })
        prods.push(invProd)
    }

    // Moreover you can take more details from user
    // like Address, Name, etc from form
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
    })
        .then((customer) => {
            return stripe.charges.create({
                amount: cart.totalPrice,     // Charing Rs 25
                description: 'Web Development Product',
                currency: 'EUR',
                customer: customer.id
            });
        })
        .then(async (charge) => {
            const purchase = new Purchase({ totalPrice: cart.totalPrice, date: Date.now(), contents: products })
            await purchase.save()
            await ShoppingCart.deleteOne({ _id: cart._id })
            myEmitter.emit('event', prods)
            req.flash('success', 'Payment was successful!')
            res.redirect('/shopper/products')  // If no error occurs
        })
        .catch((err) => {
            res.send(err)       // If some error occurs
        });
})

module.exports = router