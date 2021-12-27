const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose')

const opts = { toJSON: { virtuals: true } }

const ManagerSchema = new Schema({
    username: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: String
}, opts);

ManagerSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('Manager', ManagerSchema)