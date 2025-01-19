// Admin Handler Module: adminHandler.js
const { Pending } = require('../models');
const { approvePendingQuote, rejectPendingQuote } = require('./quoteHandler');

// Get All Pending Quotes
const getPendingQuotes = async () => {
    try {
        const pendingQuotes = await Pending.find();
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
            "${quote.quote}"
            - ${quote.author}
            
            Approve or Reject this quote?`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: 'Approve', callback_data: `approve_${quote._id}` },
                    { text: 'Reject', callback_data: `reject_${quote._id}` },
                ],
            ],
        };

        await ctx.reply(message, { reply_markup: keyboard });
    }
};

// Handle Admin Callback Queries
const handleCallbackQuery = async (ctx) => {
    try {
        const data = ctx.callbackQuery.data;
        const [action, quoteId] = data.split('_');

        switch (action) {
            case 'approve':
                await approvePendingQuote(ctx, quoteId);
                await ctx.reply('Quote approved successfully.');
                break;

            case 'reject':
                const rejectSuccess = await rejectPendingQuote(quoteId);
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
