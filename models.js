// Mongoose Models: models.js
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    quota: { type: Number, default: 0 },
    time_zone: { type: String, required: true },
});

// Quotes Schema
const quoteSchema = new mongoose.Schema({
    author: { type: String, required: true },
    quote: { type: String, required: true },
    theme: { type: String },
    source: { type: String, required: true },
    sent: { type: Boolean, default: false },
});

// Pending Quotes Schema
const pendingSchema = new mongoose.Schema({
    author: { type: String, required: true },
    quote: { type: String, required: true },
    source: { type: String, required: true },
});

// Export Models
const User = mongoose.model('User', userSchema);
const Quote = mongoose.model('Quote', quoteSchema);
const Pending = mongoose.model('Pending', pendingSchema);

module.exports = { User, Quote, Pending };
