const express = require('express');

const app = express();
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const path = require('path')
const Product = require('./schemas/product')
const Shopper = require('./schemas/shopper')
const Manager = require('./schemas/manager')
const passport = require('passport')
const session = require('express-session')
const LocalStrategy = require('passport-local')
const flash = require('connect-flash')
const bodyParser = require('body-parser')
const employee = require('./routes/employee')
const shopper = require('./routes/shopper')

const MongoDBStore = require("connect-mongo");

//Connecting mongoose to MongoDB
const dbUrl = 'mongodb://localhost:27017/supermarket'
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log('Database connected')
});

//EJS allows to write JavaScript in HTML files with .ejs extension
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')

//No need to specify 'views' directory when rendering
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.json())

//Allows to sent POST requests from HTML forms
app.use(methodOverride('_method'))

//Allows to serve static CSS and JS files to the client
app.use(express.static(path.join(__dirname, 'public')))

//Allows to flash useful messages to the user
app.use(flash())

// const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

// const store = new MongoDBStore({
//   url: dbUrl,
//   secret,
//   touchAfter: 24 * 60 * 60
// });

// store.on("error", function (e) {
//   console.log("SESSION STORE ERROR", e)
// })

//Configurations necessary for sessions (once the user logs in, they stay logged in)

const shopperSessionConfig = {
    name: 'shopper',
    secret: 'secret1',
    resave: false,
    saveUninitialized: true,
    store: MongoDBStore.create({
        mongoUrl: dbUrl
    }),
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

const employeeSessionConfig = {
    name: 'employee',
    secret: 'secret2',
    resave: false,
    saveUninitialized: true,
    store: MongoDBStore.create({
        mongoUrl: dbUrl
    }),
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

const sessionConfig = {
    name: 'session',
    secret: 'secret2',
    resave: false,
    saveUninitialized: true,
    store: MongoDBStore.create({
        mongoUrl: dbUrl
    }),
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use('/shopper', session(shopperSessionConfig));
app.use('/employee', session(employeeSessionConfig));
app.use('/', session(sessionConfig))

//Provides authentication functionality
app.use(passport.initialize());

passport.serializeUser(function (user, done) {
    let key = {
        id: user._id,
        role: user.role
    }
    done(null, key);
});

passport.deserializeUser(function (key, done) {
    if (key.role === "shopper") {
        Shopper.findById(key.id, function (err, user) {
            done(err, user);
        });
    } else {
        Manager.findById(key.id, function (err, user) {
            done(err, user);
        });
    }
});

app.use(passport.session())
passport.use('shopper', new LocalStrategy(Shopper.authenticate()))
passport.use('employee', new LocalStrategy(Manager.authenticate()))

app.use((req, res, next) => {
    res.locals.currentUser = req.user
    next()
})

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

//Renders the home page
app.get('/home', (req, res) => {
    res.render('home')
})

//Shows all the products in the store
app.get('/products', async (req, res) => {
    const products = await Product.find({})
    res.render('products', { products })
})

//Tells the app to use the routes from the 'routes' folder
//These are the routes that start with /employee or /shopper
app.use('/employee', employee)
app.use('/shopper', shopper)

//Serving on port 3000
app.listen(3000, () => {
    console.log(`Serving on port 3000!`);
});