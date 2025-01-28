// Quote Handler Module: quoteHandler.js
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
const bot = require('../bot');
require('dotenv').config({path: '../.env'});

// Fetch a Random Quote (Admin-Sourced or User-Contributed)
const getRandomQuote = async () => {
    try {
        const db = getDb();
        const quote = await db.collection('Quotes').aggregate([{ $sample: { size: 1 } }]).toArray();
        return quote[0];
    } catch (error) {
        console.error('Error fetching random quote:', error);
        return null;
    }
};


// Add Pending Quote
const addPendingQuote = async (quoteText, author, userId, ctx) => {
    try {
        const db = getDb(); // Get the database connection

        const pendingQuote = {
            Quote: quoteText,
            Author: author,
            Source: userId,
        };

        await db.collection('Pendings').insertOne(pendingQuote); // Save the quote
        await ctx.reply('Your quote has been submitted for review. Thank you!');
        console.log('Pending quote added:', pendingQuote);
    } catch (error) {
        console.error('Error adding pending quote:', error);
        await ctx.reply('An error occurred while submitting your quote. Please try again.');
    }
};

const pendingApprovals = new Map(); // Tracks admin and pending approval process
// Approve Pending Quote
const approvePendingQuote = async (ctx, quoteId) => {
    try {
        const db = getDb();
        const pendingQuote = await db.collection('Pendings').findOne({ _id: new ObjectId(quoteId) });

        if (!pendingQuote) {
            console.error('Pending quote not found:', quoteId);
            //await ctx.reply("Error: Quote not found.");
            return false;
        }

        // Step 1: Ask for the theme and track admin's response
        await ctx.reply('Please provide the theme for this quote:');

        pendingApprovals.set(ctx.from.id, { quoteId, pendingQuote });
        return true;
    } catch (error) {
        console.error('Error approving pending quote:', error);
        await ctx.reply('An error occurred while approving the quote. Please try again.');
        return false;
    }
};

// Handle Quote Callback
const handleQuoteCallbackQuery = ()=>{
    console.log("Quote callback called");
}
// Set up the listener once when the bot starts
const initializeApprovalListener = async(ctx) => {
    // Listen for admin's theme response
        const adminId = ctx.from.id;
    
        if (pendingApprovals.has(adminId)) {
            const { quoteId, pendingQuote } = pendingApprovals.get(adminId);
    
            // Capture the theme
            const theme = ctx.message.text;
            const db = getDb();
    
            const approvedQuote = {
                Author: pendingQuote.Author,
                Quote: pendingQuote.Quote,
                Theme: theme,
                Source: pendingQuote.Source,
                Sent: false,
            };
    
            // Insert into the Quotes collection
            await db.collection('Quotes').insertOne(approvedQuote);
            await db.collection('Pendings').deleteOne({ _id: new ObjectId(quoteId) });
    
            await ctx.reply('✅ Quote approved and added to the database.');
    
            console.log('Quote approved:', approvedQuote);
    
            // Remove from pending approvals
            pendingApprovals.delete(adminId);
        }
    console.log("Approval listener initialized");
 }

// Reject Pending Quote
const rejectPendingQuote = async (quoteId) => {
    try {
        const db = getDb();
         await db.collection('Pendings').deleteOne({_id: new ObjectId(quoteId)});
        console.log('Pending quote rejected and deleted:', quoteId);
        return true;
    } catch (error) {
        console.error('Error rejecting pending quote:', error);
        return false;
    }
};

module.exports = {
    getRandomQuote,
    addPendingQuote,
    approvePendingQuote,
    rejectPendingQuote,
    handleQuoteCallbackQuery,
    initializeApprovalListener,
};