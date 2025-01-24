// Quote Handler Module: quoteHandler.js
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
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

// Approve Pending Quote
const approvePendingQuote = async (ctx, quoteId) => {
    try {
        const db = getDb();
        const pendingQuote = await db.collection('Pendings').findOne({_id:new ObjectId(quoteId)});

        if (!pendingQuote) {
            console.error('Pending quote not found:', quoteId);
            return false;
        }

        const themeMessage = await ctx.reply(
            'Please provide the theme for this quote:',
            { reply_markup: { force_reply: true } }
        );

        ctx.bot.on('message', async (themeCtx) => {
            if (themeCtx.message.reply_to_message?.message_id === themeMessage.message_id) {
                const theme = themeCtx.message.text;
                const approvedQuote = {
                    Author: pendingQuote.author,
                    Quote: pendingQuote.quote,
                    Theme: theme,
                    Source: pendingQuote.source,
                    Sent: false,
                };

                await db.collection('Quotes').insertOne(approvedQuote);
                await db.collection('Pendings').deleteOne({_id:new ObjectId(quoteId)});

                await ctx.reply('Quote approved and added to the database.');
                console.log('Pending quote approved and moved to quotes:', approvedQuote);
            }
        });

        return true;
    } catch (error) {
        console.error('Error approving pending quote:', error);
        return false;
    }
};

// Handle Quote Callback
const handleQuoteCallbackQuery = async (ctx) => {
    console.log("Quote callback called")
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
};