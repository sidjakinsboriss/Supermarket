//A set of functions to communicate with the supplier API

const https = require('https')
const Delivery = require('../schemas/delivery')
const Order = require('../schemas/order')

const optionsGetProducts = {
    hostname: 'rethink-supplier.herokuapp.com',
    path: '/product/?format=json',
    headers: {
        'Authorization': 'Token 31a6497f0799d6d6f176a4c5196cef3e08f616a2',
    },
};

const optionsPlaceOrder = {
    hostname: 'rethink-supplier.herokuapp.com',
    path: '/order/',
    method: 'POST',
    headers: {
        'Authorization': 'Token 31a6497f0799d6d6f176a4c5196cef3e08f616a2'
    },
}

//Shows supplier products
function showProducts(res) {
    let products = [];
    https
        .get(optionsGetProducts, (result) => {
            let body = '';

            result.on('data', (chunk) => {
                body += chunk;
            });

            result.on('end', () => {
                try {
                    products = JSON.parse(body);
                    res.render('supplierProducts', { products });
                    // do something with JSON
                } catch (error) {
                    console.error(error.message);
                }
            });
        })
        .on('error', (error) => {
            console.error(error.message);
        });
}

//Adds a single product to the order
async function addOrderLine(orderId, product) {

    let postData = {
        'order_id': `${orderId}`,
        'product_id': `${product.supplierId}`,
        'nr_of_products': `${product.toOrder}`
    }
    let postBody = JSON.stringify(postData)
    const optionsAddOrderLine = {
        hostname: 'rethink-supplier.herokuapp.com',
        path: '/orderline/',
        method: 'POST',
        headers: {
            'Authorization': 'Token 31a6497f0799d6d6f176a4c5196cef3e08f616a2',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postBody, 'utf8')
        },
    }
    console.log("ADDING ORDERLINE")
    return new Promise((resolve, reject) => {
        const req = https.request(optionsAddOrderLine, (result) => {
            let body = ''
            result.on('data', (chunk) => {
                body += chunk
            });

            result.on('end', () => {
                try {
                    let order = JSON.parse(body);
                    resolve(order)
                    console.log('ORDERLINE ADDED')
                } catch (error) {
                    console.error("ORDERLINE ON END ERROR")
                    console.error(error)
                    reject(error.message)
                }
            });
        })

        req.on('error', (error) => {
            console.error(error);
        });

        req.write(postBody)
        req.end()
    })
}

//Sends an order when all the products were added
async function sendOrder(orderId) {
    const optionsSendOrder = {
        hostname: 'rethink-supplier.herokuapp.com',
        path: `/send_order/${orderId}`,
        method: 'POST',
        headers: {
            'Authorization': 'Token 31a6497f0799d6d6f176a4c5196cef3e08f616a2'
        },
    }
    return new Promise((resolve, reject) => {
        const req = https.request(optionsSendOrder, (result) => {
            let body = '';
            result.on('data', (chunk) => {
                body += chunk
            });

            result.on('end', () => {
                try {
                    let order = JSON.parse(body);
                    resolve(order)

                } catch (error) {
                    console.error("SEND ORDER ON END ERROR");
                    reject(error.message)
                }
            });
        })

        req.on('error', (error) => {
            console.error(error);
        });

        req.end()
    })
}

//Places an order to the supplier
async function placeOrder(products) {
    console.log("PLACING ORDER")

    return new Promise((resolve, reject) => {
        const req = https.request(optionsPlaceOrder, (result) => {
            let body = ''
            result.on('data', (chunk) => {
                body += chunk
            });

            result.on('end', async () => {
                try {

                    let order = JSON.parse(body);
                    let id = order.id
                    for (let product of products) {
                        await addOrderLine(id, product)
                    }
                    resolve(order)

                } catch (error) {
                    console.error("ORDER ON END ERROR");
                    reject(error.message)
                }
            });
        })

        req.on('error', (error) => {
            console.error(error);
        });

        req.end()
    })
}

//Gets the delivery and stores it in the database
async function getDelivery(products) {
    await placeOrder(products)
        .then(async (response) => {
            let id = response.id
            await sendOrder(id)
                .then(async (res) => {
                    const order = res.order
                    const delivery = res.delivery
                    let orderPrice = 0
                    for (let prod of products)
                        orderPrice += prod.supplierPrice + prod.supplierPrice * prod.supplierVat
                    const newOrder = new Order({ contents: products, date: Date.now(), totalPrice: orderPrice })
                    await newOrder.save()
                    const newDelivery = new Delivery({ date_time: delivery.date_time, order_id: order.id })
                    for (let product of products) {
                        newDelivery.products.push(product)
                        newDelivery.amounts.push(product.toOrder)
                    }
                    await newDelivery.save()
                })
        })
}

module.exports = { getDelivery, showProducts }