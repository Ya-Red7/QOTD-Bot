// Main file: bot.js
const { Telegraf } = require('telegraf');
const schedule = require('./modules/scheduler');
const db = require('./modules/db');
const userHandler = require('./modules/userHandler');
const quoteHandler = require('./modules/quoteHandler');
const adminHandler = require('./modules/adminHandler');
require('dotenv').config();


const bot = new Telegraf(process.env.BOT_TOKEN);
db.connect(); //connect to db on startup
// Bot Commands
bot.start(async (ctx) => {
    ctx.reply(`🔥 Welcome to QOTD!\nGet daily inspiring masculine quotes. 💪🏾\n👉🏾 /contribute to share your own quote.\n👉🏾 /random for a fresh quote anytime.`);
    await userHandler.handleNewUser(ctx);
});

bot.command('help', async (ctx) => {
    const helpMsg = "\t Your Daily Source of Motivation \nThis bot is designed to deliver a powerful, masculine quote each day to fuel your drive and inspire greatness. The quotes are collected by advanced AIs to keep you motivated and on track.\n Got a quote that can inspire others? Don't hesitate to /contribute and share it with the community!\n Need an extra boost? Just type 👉🏾 /random for an additional dose of motivation. Created by @Ya_red7 .";
    ctx.reply(helpMsg);
});

bot.command('random', async (ctx) => {
    const quote = await quoteHandler.getRandomQuote();
    if (!quote) {
        ctx.reply("No quotes are available at the moment. Please try again later.");
        return;
    }
    ctx.reply(`${quote.Quote}\n\t -${quote.Author}\n ${quote.Theme}`);
});

bot.command('miAdmin', async (ctx) => {
    const isAdmin = await userHandler.checkAdmin(ctx.from.id);
    if (isAdmin) {
        const pendingQuotes = await adminHandler.getPendingQuotes();
        adminHandler.showPendingQuotes(ctx, pendingQuotes);
    }  else {
        ctx.reply("You do not have admin privileges.");
    }
});

// Global user state tracker
const userState = new Map();

// Command to start the contribution process
bot.command('contribute', async (ctx) => {
    const userId = ctx.from.id;

    // Step 1: Ask for the quote
    await ctx.reply("Send the Quote:");

    // Set user state to track the contribution process
    userState.set(userId, { step: 'waiting_for_quote' });
});

// Global message listener
bot.on('message', async (ctx) => {
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

        await ctx.reply("Please provide the author of the quote:");
    } else if (state.step === 'waiting_for_author') {
        // Step 3: Capture the author and save to the database
        const author = ctx.message.text;
        const { quoteText } = state;

        // Add the pending quote to the database
        await quoteHandler.addPendingQuote(quoteText, author, userId, ctx);

        // Clear the user's state
        userState.delete(userId);
    }
});


// Middleware for callback queries
bot.on('callback_query', async (ctx) => {
    //await adminHandler.handleCallbackQuery(ctx);
    const data = ctx.callbackQuery.data;

         if (data.startsWith('user_timezone_select')) {
            await userHandler.handleTimeZoneCallbackQuery(ctx);
         }else if (data.startsWith('admin_')) {
            await adminHandler.handleCallbackQuery(ctx)
          }else if (data.startsWith('quote_')) {
             await quoteHandler.handleQuoteCallbackQuery(ctx);
         }
});

// Start Scheduler
schedule.startDailyQuoteScheduler(bot);

// Start Bot
bot.launch();
console.log("Bot is running...");
