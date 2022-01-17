const express = require('express')
const router = express.Router()
const passport = require('passport')
const supplier = require('../utils/supplier')
const InventoryProduct = require('../schemas/inventoryProduct')
const Product = require('../schemas/product')
const Manager = require('../schemas/manager')
const Delivery = require('../schemas/delivery')

//Checks if the user is logged in
function isManager(req, res, next) {
    if (!req.isAuthenticated() || !req.user || req.user.role !== 'employee') {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be logged in as an employee!')
        return res.redirect('/employee/login')
    }
    next();
}

router.get('/login', (req, res) => {
    res.render('loginEmployee')
})


router.post('/login', passport.authenticate('employee', { failureFlash: true, failureRedirect: '/employee/login' }), (req, res) => {
    res.redirect('/employee/home')
})

router.get('/register', (req, res) => {
    res.render('registerEmployee')
})

router.post('/register', async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const employee = new Manager({ email, username, role: "employee" });
        const registeredEmployee = await Manager.register(employee, password);
        req.login(registeredEmployee, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to ReThink Supermarket!');
            res.redirect('/employee/home')
        })
    } catch (e) {
        req.flash('error', e.message);
        console.log(e)
        res.redirect('/employee/register');
    }
})

//Makes sure that it's impossible to view 
//the following routes without being logged in as an employee
router.use('/', isManager)

router.get('/home', (req, res) => {
    console.log(req.user)
    res.render('manageHome')
})

router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/home')
})

router.get('/stock', async (req, res) => {
    const products = await InventoryProduct.find({})
    res.render('stock', { products })
})

router.get('/statistics', async (req, res) => {
    const products = await InventoryProduct.find({})
    res.render('statistics', { products })
})

router.get('/deliveries', async (req, res) => {
    const deliveries = await Delivery.find({}).populate('products')
    res.render('deliveries', { deliveries })
})

router.get('/supplier/products', (req, res) => {
    supplier.showProducts(res)
})

router.get('/:id/toorder', async (req, res) => {
    const { id } = req.params
    const product = await InventoryProduct.findById({ _id: id })
    res.render('toorder', { product })
})

router.post('/:id/toorder', async (req, res) => {
    const { id } = req.params
    const { newAmount } = req.body
    const product = await InventoryProduct.findByIdAndUpdate({ _id: id }, { toOrder: newAmount })
    await product.save()
    res.redirect('/employee/stock')
})

router.get('/:id/changeprice', async (req, res) => {
    const { id } = req.params
    const product = await InventoryProduct.findById({ _id: id })
    res.render('changeprice', { product })
})

router.post('/:id/changeprice', async (req, res) => {
    const { id } = req.params
    const { newPrice } = req.body
    const invProduct = await InventoryProduct.findByIdAndUpdate({ _id: id }, { price: newPrice })
    const product = await Product.findOneAndUpdate({ name: invProduct.name }, { price: newPrice })
    await invProduct.save()
    await product.save()
    res.redirect('/employee/stock')
})

router.get('/makeorder', async (req, res) => {
    const products = await InventoryProduct.find({})
    res.render('makeorder', { products })
})

router.post('/makeorder', async (req, res) => {
    const { products } = req.body
    const toOrder = []
    if (Array.isArray(products)) {
        for (let prod of products) {
            console.log(JSON.parse(prod))
            toOrder.push(JSON.parse(prod))
        }
    } else {
        toOrder.push(JSON.parse(products))
    }
    await supplier.getDelivery(toOrder)
    for (let product of toOrder) {
        let invProduct = await InventoryProduct.findByIdAndUpdate({ _id: product._id }, {
            $inc: {
                'spent': (product.supplierPrice + product.supplierPrice * product.supplierVat) * product.toOrder,
            }
        })
        await invProduct.save()
    }
    res.redirect('/employee/deliveries')
})

module.exports = router