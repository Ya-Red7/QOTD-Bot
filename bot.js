// Main file: bot.js
const { Telegraf } = require('telegraf');
const express = require('express');
const schedule = require('./modules/scheduler');
const db = require('./modules/db');
const userHandler = require('./modules/userHandler');
const quoteHandler = require('./modules/quoteHandler');
const adminHandler = require('./modules/adminHandler');
require('dotenv').config();


const bot = new Telegraf(process.env.BOT_TOKEN);
db.connect(); //connect to db on startup
const app = express();
app.use(express.json());

const WEBHOOK_URL = process.env.WEBHOOK_URL; 
const PORT = process.env.PORT || 3000;

// Set webhook
bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook`).then(() => {
    console.log("✅ Webhook set successfully!");
}).catch(err => console.error("❌ Error setting webhook:", err));

// Handle webhook updates
app.post('/webhook', (req, res) => {
    bot.handleUpdate(req.body); // Telegraf processes incoming messages
    res.sendStatus(200);
});


// Bot Commands
bot.start(async (ctx) => {
    ctx.reply("<b>🔥 Welcome to QOTD!</b>\n Get daily inspiring masculine quotes. 💪🏾\n👉🏾 <i>/contribute</i> to share your own quote.\n👉🏾 <i>/random</i> for a fresh quote anytime.", {parse_mode: "HTML"});
    await userHandler.handleNewUser(ctx);
});

bot.command('help', async (ctx) => {
    const helpMsg = `<b>Your Daily Source of Motivation</b> \n\nThis bot is designed to deliver a <i>powerful, masculine</i> quote each day to fuel your drive and inspire greatness. The quotes are collected by advanced AIs to keep you motivated and on track.\n Got a quote that can inspire others? Don't hesitate to <i>/contribute</i> and share it with the community!\n Need an extra boost? Just type 👉🏾 <i>/random</i> for an additional dose of motivation. \nCreated by <a href="https://t.me/Ya_red7">Yared W.</a>`;
    ctx.reply(helpMsg, {parse_mode: "HTML"});
});

bot.command('random', async (ctx) => {
    const quote = await quoteHandler.getRandomQuote();
    if (!quote) {
        ctx.reply("No quotes are available at the moment. Please try again later.");
        return;
    }
    const emoji = quoteHandler.getEmoji(quote.Theme);
    ctx.reply(`<blockquote><b>${quote.Quote}</b></blockquote>\n \t- ${quote.Author}\n\n <i>#${quote.Theme}</i> ${emoji}`, {parse_mode:"HTML"});
});

bot.command('miAdmin', async (ctx) => {
    const isAdmin = await userHandler.checkAdmin(ctx.from.id);
    if (isAdmin) {
        const pendingQuotes = await adminHandler.getPendingQuotes();
        adminHandler.showPendingQuotes(ctx, pendingQuotes);
    }//   else {
    //     ctx.reply("You do not have admin privileges.");
    // }
});

// Global user state tracker
const userState = new Map();

// Command to start the contribution process
bot.command('contribute', async (ctx) => {
    const userId = ctx.from.id;
    //const username = ctx.from.username || ctx.from.first_name;

    // Step 1: Ask for the quote
    await ctx.reply("Send the Quote:",
        { reply_markup: { force_reply: true } });

    // Set user state to track the contribution process
    userState.set(userId, { step: 'waiting_for_quote'});
});
// Global message listener
bot.on('message', async (ctx) => {
    quoteHandler.initializeApprovalListener(bot, ctx); //pass bot to handleQuoteCallbackQuery, so it can listen in quoteHandler
    const userId = ctx.from.id;
    const state = userState.get(userId); // Get the user's current state

    if (!state) {
        // If no active state, ignore the message
        return;
    }

    if (state.step === 'waiting_for_quote') {
        // Step 2: Capture the quote and ask for the author
        const quoteText = ctx.message.text;

        // Save the quote in the user's state
        userState.set(userId, { step: 'waiting_for_author', quoteText });

        await ctx.reply("Please provide the author of the quote:",
            { reply_markup: { force_reply: true } });
    } else if (state.step === 'waiting_for_author') {
        // Step 3: Capture the author and save to the database
        const author = ctx.message.text;
        const { quoteText } = state;

        // Add the pending quote to the database
        await quoteHandler.addPendingQuote(bot, quoteText, author, userId, ctx);

        // Clear the user's state
        userState.delete(userId);
    }
});

bot.action(/approve_(.+)/, async (ctx) => {
    const quoteId = ctx.match[1]; // Extract quoteId from callback query data
    console.log(quoteId);
    await quoteHandler.approvePendingQuote(bot, ctx, quoteId)
});

// Middleware for callback queries
bot.on('callback_query', async (ctx) => {
    //await adminHandler.handleCallbackQuery(ctx);
    const data = ctx.callbackQuery.data;

         if (data.startsWith('user_timezone_select')) {
            await userHandler.handleTimeZoneCallbackQuery(ctx);
         }else if (data.startsWith('admin_')) {
            await adminHandler.handleCallbackQuery(bot, ctx)
          }else if (data.startsWith('quote_')) {
             await quoteHandler.handleQuoteCallbackQuery(ctx);
         }
});

// Start Scheduler
schedule.startDailyQuoteScheduler(bot);

// Start Bot
// Start Express server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
console.log("Bot is running...");
