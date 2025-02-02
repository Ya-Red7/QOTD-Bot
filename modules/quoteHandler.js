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
const addPendingQuote = async (bot, quoteText, author, userId, ctx) => {
    try {
        const db = getDb(); // Get the database connection

        const pendingQuote = {
            Quote: quoteText,
            Author: author,
            Source: userId,
            Username: ctx.from.username || ctx.from.first_name,
        };

        await db.collection('Pendings').insertOne(pendingQuote); // Save the quote
        await ctx.reply('Your quote has been submitted for review. Thank you!');
        const message = await bot.telegram.sendMessage(userId, "⏳ Pending") ;

        await db.collection('Pendings').updateOne({ _id: pendingQuote._id }, { $set: { MessageId: message.message_id } });

        const pendingQuoteNumber = await db.collection('Pendings').countDocuments();
        if (pendingQuoteNumber % 10 === 0) {
            await bot.telegram.sendMessage(
                process.env.ADMINS,
                `🔔 *Attention Admin* 🔔\n\nThere are now <b>${pendingQuoteNumber}</b> pending quotes awaiting review.\n /miAdmin`,
                { parse_mode: 'HTML' }
            );
        }
        console.log('Pending quote added:', pendingQuote);
    } catch (error) {
        console.error('Error adding pending quote:', error);
        await ctx.reply('An error occurred while submitting your quote. Please try again.');
    }
};

const pendingApprovals = new Map(); // Tracks admin and pending approval process
// Approve Pending Quote
const approvePendingQuote = async (bot, ctx, quoteId) => {
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
const initializeApprovalListener = async(bot, ctx) => {
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
            
            try {
                await bot.telegram.editMessageText(
                    pendingQuote.Source,
                    pendingQuote.MessageId,
                    null,
                    "✅ Aproved"
                );
            } catch (editError) {
                console.error('editMessageText failed, sending new message instead:', editError);
                //await bot.sendMessage(pendingQuote.Source, "❌ Your quote has been rejected.");
            }
            await ctx.reply('✅ Quote approved and added to the database.');
    
            console.log('Quote approved:', approvedQuote);
    
            // Remove from pending approvals
            pendingApprovals.delete(adminId);
        }
    console.log("Approval listener initialized");
 }

// Reject Pending Quote
const rejectPendingQuote = async (bot, quoteId) => {
    try {
        const db = getDb();
        const pendingQuote = await db.collection('Pendings').findOne({ _id: new ObjectId(quoteId) });

        if (!pendingQuote) {
            console.error('Quote not found:', quoteId);
            return false;
        }

        // Delete from pending collection
        await db.collection('Pendings').deleteOne({ _id: new ObjectId(quoteId) });

        // Edit the existing message (if possible)
        try {
            await bot.telegram.editMessageText(
                pendingQuote.Source,
                pendingQuote.MessageId,
                null,
                "❌ Rejected"
            );
        } catch (editError) {
            console.error('editMessageText failed, sending new message instead:', editError);
            //await bot.sendMessage(pendingQuote.Source, "❌ Your quote has been rejected.");
        }

        console.log('Pending quote rejected and deleted:', quoteId);
        return true;
    } catch (error) {
        console.error('Error rejecting pending quote:', error);
        return false;
    }
};


const getEmoji = (theme) => {
    const emojiMap = {
        "Stoic_Strength": "🗿🔥",
        "Lead_with_Power": "🦍🔥",
        "Endure_and_Conquer": "👑🔥",
        "Grit_and_Grind": "⚒️🔥",
        "Strength_Unleashed": "🗝️🔥",
        "Bold_and_Brave": "🦅🔥",
        "Honor_Code": "⚔️🔥",
        "Relentless_Growth": "⚡🔥",
        "Adversity_Armor": "🛡️🔥",
        "Wise_Warrior": "🏹🔥",
        "Confident_Ambition": "🦁🔥",
        "Master_of_Self": "⭐🔥",
        "Unbreakable_Will": "🔗🔥",
        "Warrior_Spirit": "🛡️🔥",
        "Never_Back_Down": "🥷🏾🔥",
        "Mental_Muscle": "♟️🔥",
        "Victory_Mindset": "🥇🔥",
        "Physical_Strength": "💪🏾🔥"
      };
    return emojiMap[theme];
};
module.exports = {
    getRandomQuote,
    addPendingQuote,
    approvePendingQuote,
    rejectPendingQuote,
    handleQuoteCallbackQuery,
    initializeApprovalListener,
    getEmoji,
};