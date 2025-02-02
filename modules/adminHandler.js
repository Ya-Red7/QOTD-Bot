// Admin Handler Module: adminHandler.js
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
const { approvePendingQuote, rejectPendingQuote } = require('./quoteHandler');
require('dotenv').config({path: '../.env'});

// Get All Pending Quotes
const getPendingQuotes = async () => {
    try {
        const db = getDb();
        const pendingQuotes = await db.collection('Pendings').find().toArray();
        return pendingQuotes;
    } catch (error) {
        console.error('Error fetching pending quotes:', error);
        return [];
    }
};

// Show Pending Quotes to Admin
const showPendingQuotes = async (ctx, pendingQuotes) => {
    if (pendingQuotes.length === 0) {
        await ctx.reply('No pending quotes to review.');
        return;
    }

    for (const quote of pendingQuotes) {
        const message = `
            Pending Quote:
            "${quote.Quote}"
            - ${quote.Author}
            ⭐Submitted by: @${quote.Username}
            
            Approve or Reject this quote?`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: 'Approve', callback_data: `admin_approve_${quote._id}` },
                    { text: 'Reject', callback_data: `admin_reject_${quote._id}` },
                ],
            ],
        };

        await ctx.reply(message, { reply_markup: keyboard });
    }
};

// Handle Admin Callback Queries
const handleCallbackQuery = async (bot, ctx) => {
    try {
        const data = ctx.callbackQuery.data;
        console.log(data);
        const [admin, action, quoteId] = data.split('_');

        switch (action) {
            case 'approve':
                await approvePendingQuote(bot, ctx, quoteId);
                await ctx.reply('Quote approved successfully.');
                break;

            case 'reject':
                const rejectSuccess = await rejectPendingQuote(bot, quoteId);
                if (rejectSuccess) {
                    await ctx.reply('Quote rejected successfully.');
                } else {
                    await ctx.reply('Error rejecting quote.');
                }
                break;

            default:
                await ctx.reply('Unknown action.');
                break;
        }

        // Delete the callback message
        await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    } catch (error) {
        console.error('Error handling callback query:', error);
        await ctx.reply('An error occurred while processing your request.');
    }
};

module.exports = {
    getPendingQuotes,
    showPendingQuotes,
    handleCallbackQuery,
};