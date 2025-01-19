// Scheduler Module: scheduler.js
const { Quote } = require('../models');
const { CronJob } = require('cron');
const timeZones = [
    { zone: 'Asia/Tokyo', hour: 6 },
    { zone: 'Europe/London', hour: 6 },
    { zone: 'US/Eastern', hour: 6 },
    { zone: 'Africa/Addis_Ababa', hour: 6 },
    { zone: 'Australia/Sydney', hour: 6 },
    { zone: 'America/Los_Angeles', hour: 6 },
];

let dailyQuote = null; // Cache for the day's quote

// Function to choose the daily quote
const chooseDailyQuote = async () => {
    try {
        // Step 1: Fetch a random unsent user-contributed quote
        dailyQuote = await Quote.aggregate([
            { $match: { source: { $ne: 'admin' }, sent: false } },
            { $sample: { size: 1 } },
        ]).then((results) => results[0]);

        // Step 2: If no user-contributed quotes exist, fetch a random unsent admin-sourced quote
        if (!dailyQuote) {
            dailyQuote = await Quote.aggregate([
                { $match: { source: 'admin', sent: false } },
                { $sample: { size: 1 } },
            ]).then((results) => results[0]);
        }

        // Step 3: If no unsent quotes exist, reset all quotes to unsent and retry
        if (!dailyQuote) {
            await Quote.updateMany({}, { $set: { sent: false } });
            console.log('All quotes have been reset to unsent. Retrying to choose a quote.');
            return await chooseDailyQuote();
        }

        // Mark the quote as sent to avoid duplication
        await Quote.updateOne({ _id: dailyQuote._id }, { $set: { sent: true } });

        console.log('Daily quote chosen:', dailyQuote);
    } catch (error) {
        console.error('Error choosing daily quote:', error);
    }
};

// Function to send the daily quote
const sendDailyQuote = async (bot, timeZone) => {
    try {
        if (!dailyQuote) {
            console.error('Daily quote is not set.');
            return;
        }

        // Fetch users in the specific time zone
        const users = await require('./models').User.find({ time_zone: timeZone });

        for (const user of users) {
            await bot.telegram.sendMessage(
                user.user_id,
                `${dailyQuote.quote}\n\t -${dailyQuote.author}\n ${dailyQuote.theme}`
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
