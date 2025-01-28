// Scheduler Module: scheduler.js
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
const { CronJob } = require('cron');
const quoteHandler = require('./quoteHandler');
require('dotenv').config({path: '../.env'});

const timeZones = [
    { zone: 'Asia/Tokyo', hour: 6 },
    { zone: 'Europe/London', hour: 6 },
    { zone: 'US/Eastern', hour: 6 },
    { zone: 'Africa/Addis_Ababa', hour: 6 },
    { zone: 'Australia/Sydney', hour: 6 },
    { zone: 'America/Los_Angeles', hour: 6 },
];
const date = new Date();
let dailyQuote = null; // Cache for the day's quote

// Function to choose the daily quote
const chooseDailyQuote = async () => {
    try {
        const db = getDb();
        // Step 1: Fetch a random unsent user-contributed quote
        dailyQuote = await db.collection('Quotes').aggregate([
            { $match: { Source: { $ne: 'admin' }, Sent: false } },
            { $sample: { size: 1 } },
        ]).toArray().then(results => results[0]);


        // Step 2: If no user-contributed quotes exist, fetch a random unsent admin-sourced quote
        if (!dailyQuote) {
            dailyQuote = await db.collection('Quotes').aggregate([
                { $match: { Source: 'admin', Sent: false } },
                { $sample: { size: 1 } },
            ]).toArray().then(results => results[0]);
        }

        // Step 3: If no unsent quotes exist, reset all quotes to unsent and retry
        if (!dailyQuote) {
            await db.collection('Quotes').updateMany({}, { $set: { Sent: false } });
            console.log('All quotes have been reset to unsent. Retrying to choose a quote.');
            return await chooseDailyQuote();
        }

        // Mark the quote as sent to avoid duplication
        await db.collection('Quotes').updateOne({ _id: new ObjectId(dailyQuote._id) }, { $set: { Sent: true } });

        console.log('Daily quote chosen:', dailyQuote);
    } catch (error) {
        console.error('Error choosing daily quote:', error);
    }
};

// Function to send the daily quote
const sendDailyQuote = async (bot, timeZone) => {
    try {
         const db = getDb();
        if (!dailyQuote) {
            console.error('Daily quote is not set.');
            return;
        }

        // Fetch users in the specific time zone
        const users = await db.collection('Users').find({ Time_zone: timeZone }).toArray();
        const emoji = quoteHandler.getEmoji(dailyQuote.Theme);
        const dayName = date.toLocaleString('en-US', { weekday: 'long', timeZone: timeZone });
        let text = `Have a wonderfull ${dayName}!`;
        if (dayName === 'Monday') {
            text = `Happy Monday!`;
        }
        for (const user of users) {
            await bot.telegram.sendMessage(
                user.User_id,
                `<blockquote><b>${dailyQuote.Quote}</b></blockquote>\n \t- ${dailyQuote.Author}\n\n <i>#${dailyQuote.Theme}</i> ${emoji}\n`, {parse_mode:"HTML"}
            );
            await bot.telegram.sendMessage(
                user.User_id,
                `<i>${text}</i>`, {parse_mode:"HTML"}
            );
        }

        console.log(`Daily quote sent to users in ${timeZone}.`);
    } catch (error) {
        console.error(`Error sending daily quote to ${timeZone}:`, error);
    }
};

// Start Scheduler for Time Zones
const startDailyQuoteScheduler = (bot) => {
    timeZones.forEach(({ zone, hour }) => {
        const job = new CronJob(
            `0 ${hour} * * *`,
            async () => {
                if (zone === 'Asia/Tokyo') {
                    // Choose the daily quote for the first time zone
                    await chooseDailyQuote();
                }
                await sendDailyQuote(bot, zone);
            },
            null,
            true,
            zone
        );
        job.start();
        console.log(`Scheduler started for ${zone}.`);
    });
};

module.exports = { startDailyQuoteScheduler };