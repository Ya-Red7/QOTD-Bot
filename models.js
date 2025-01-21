// Mongoose Models: models.js
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    User_id: { type: String, required: true, unique: true },
    Quota: { type: Number, default: 0 },
    Time_zone: { type: String, required: true },
});

// Quotes Schema
const quoteSchema = new mongoose.Schema({
    Author: { type: String, required: true },
    Quote: { type: String, required: true },
    Theme: { type: String },
    Source: { type: String, required: true },
    Sent: { type: Boolean, default: false },
});

// Pending Quotes Schema
const pendingSchema = new mongoose.Schema({
    Author: { type: String, required: true },
    Quote: { type: String, required: true },
    Source: { type: String, required: true },
});

// Export Models
const User = mongoose.model('User', userSchema, 'Users');
const Quote = mongoose.model('Quote', quoteSchema, 'Quotes');
const Pending = mongoose.model('Pending', pendingSchema, 'Pendings');

module.exports = { User, Quote, Pending };
