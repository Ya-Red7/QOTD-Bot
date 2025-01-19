// User Handler Module: userHandler.js
const { User } = require('../models');

// Handle New User Registration
const handleNewUser = async (ctx) => {
    try {
        const userId = ctx.from.id;
        const existingUser = await User.findOne({ user_id: userId });

        if (existingUser) {
            console.log(`User ${userId} already registered.`);
            return;
        }

        // Default registration with time zone placeholder
        const newUser = new User({
            user_id: userId,
            time_zone: '', // Time zone must be updated
        });

        await newUser.save();
        console.log(`New user registered: ${userId}`);

        // Ask the user for their time zone
        await askTimeZone(ctx);
    } catch (error) {
        console.error('Error handling new user:', error);
    }
};

// Ask User for Time Zone
const askTimeZone = async (ctx) => {
    const timeZoneOptions = [
        { text: 'Asia/Tokyo', callback_data: 'Asia/Tokyo' },
        { text: 'Europe/London', callback_data: 'Europe/London' },
        { text: 'US/Eastern', callback_data: 'US/Eastern' },
        { text: 'Africa/Addis_Ababa', callback_data: 'Africa/Addis_Ababa' },
        { text: 'Australia/Sydney', callback_data: 'Australia/Sydney' },
        { text: 'America/Los_Angeles', callback_data: 'America/Los_Angeles' },
    ];

    const keyboard = timeZoneOptions.map((option) => [{ text: option.text, callback_data: option.callback_data }]);

    await ctx.reply('Please select your time zone:', {
        reply_markup: { inline_keyboard: keyboard },
    });
};

// Handle Time Zone Selection
const handleTimeZoneSelection = async (ctx) => {
    try {
        const userId = ctx.from.id;
        const selectedTimeZone = ctx.callbackQuery.data;

        await User.updateOne(
            { user_id: userId },
            { $set: { time_zone: selectedTimeZone } }
        );

        await ctx.reply(`Time zone set to ${selectedTimeZone}.`);
        console.log(`User ${userId} updated time zone to ${selectedTimeZone}.`);
    } catch (error) {
        console.error('Error handling time zone selection:', error);
    }
};

// Check if User is Admin
const checkAdmin = async (userId) => {
    try {
        const admins = process.env.ADMINS ? process.env.ADMINS.split(',') : [];
        return admins.includes(userId.toString());
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

module.exports = {
    handleNewUser,
    askTimeZone,
    handleTimeZoneSelection,
    checkAdmin,
};
