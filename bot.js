// Main file: bot.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const schedule = require('./modules/scheduler');
const db = require('./modules/db');
const userHandler = require('./modules/userHandler');
const quoteHandler = require('./modules/quoteHandler');
const adminHandler = require('./modules/adminHandler');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Bot Commands
bot.start(async (ctx) => {
    await userHandler.handleNewUser(ctx);
    ctx.reply(`🔥 Welcome to QOTD!\nGet daily inspiring masculine quotes. 💪🏾\n👉🏾 /contribute to share your own quote.\n👉🏾 /random for a fresh quote anytime.`);
});

bot.command('random', async (ctx) => {
    const helpMsg = "\t Your Daily Source of Motivation \nThis bot is designed to deliver a powerful, masculine quote each day to fuel your drive and inspire greatness. The quotes are collected by advanced AIs to keep you motivated and on track.\n Got a quote that can inspire others? Don't hesitate to /contribute and share it with the community!\n Need an extra boost? Just type 👉🏾 /random for an additional dose of motivation. Created by @Ya_red7 .";
    ctx.reply(helpMsg);
});

bot.command('help', async (ctx) => {
    const quote = await quoteHandler.getRandomQuote();
    ctx.reply(`${quote.text}\n\t -${quote.author}\n ${quote.theme}`);
});

bot.command('contribute', async (ctx) => {
    const message = await ctx.reply("Send the Quote:", { reply_markup: { force_reply: true } });
    bot.on('message', async (msgCtx) => {
        if (msgCtx.message.reply_to_message && msgCtx.message.reply_to_message.message_id === message.message_id) {
            await quoteHandler.addPendingQuote(msgCtx, ctx.from.id);
        }
    });
});

bot.command('miAdmin', async (ctx) => {
    const isAdmin = await userHandler.checkAdmin(ctx.from.id);
    if (isAdmin) {
        const pendingQuotes = await adminHandler.getPendingQuotes();
        adminHandler.showPendingQuotes(ctx, pendingQuotes);
    }//  else {
    //     ctx.reply("You do not have admin privileges.");
    // }
});

// Middleware for callback queries
bot.on('callback_query', async (ctx) => {
    await adminHandler.handleCallbackQuery(ctx);
});

// Start Scheduler
schedule.startDailyQuoteScheduler(bot);

// Start Bot
bot.launch();
console.log("Bot is running...");
