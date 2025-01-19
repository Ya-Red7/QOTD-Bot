// Quote Handler Module: quoteHandler.js
const { Quote, Pending } = require('../models');

// Fetch a Random Quote (Admin-Sourced or User-Contributed)
const getRandomQuote = async () => {
    try {
        const quote = await Quote.aggregate([{ $sample: { size: 1 } }]);
        return quote[0];
    } catch (error) {
        console.error('Error fetching random quote:', error);
        return null;
    }
};

// Add Pending Quote
const addPendingQuote = async (ctx, userId) => {
    try {
        const quoteText = ctx.message.text;
        const authorMessage = await ctx.reply(
            'Please provide the author of the quote:',
            { reply_markup: { force_reply: true } }
        );

        ctx.bot.on('message', async (authorCtx) => {
            if (authorCtx.message.reply_to_message?.message_id === authorMessage.message_id) {
                const author = authorCtx.message.text;
                const pendingQuote = new Pending({
                    quote: quoteText,
                    author: author,
                    source: userId,
                });

                await pendingQuote.save();
                await ctx.reply('Your quote has been submitted for review. Thank you!');
                console.log('Pending quote added:', pendingQuote);
            }
        });
    } catch (error) {
        console.error('Error adding pending quote:', error);
        await ctx.reply('An error occurred while submitting your quote. Please try again.');
    }
};

// Approve Pending Quote
const approvePendingQuote = async (ctx, quoteId) => {
    try {
        const pendingQuote = await Pending.findById(quoteId);

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
                const approvedQuote = new Quote({
                    author: pendingQuote.author,
                    quote: pendingQuote.quote,
                    theme: theme,
                    source: pendingQuote.source,
                    sent: false,
                });

                await approvedQuote.save();
                await Pending.findByIdAndDelete(quoteId);

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

// Reject Pending Quote
const rejectPendingQuote = async (quoteId) => {
    try {
        await Pending.findByIdAndDelete(quoteId);
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
};
