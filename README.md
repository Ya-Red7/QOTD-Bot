# QOTD Bot Documentation

## Overview

The QOTD (Quote of the Day) Bot is a Telegram bot designed to deliver daily motivational quotes to users. The bot allows users to contribute their own quotes, which are then reviewed by admins before being added to the database. Users can also request a random quote at any time. The bot is built using the Telegraf library for Telegram bots, MongoDB for data storage, and Express for handling webhooks.

## Features

- **Daily Quotes**: Users receive a daily motivational quote at a specified time based on their time zone.
- **Random Quotes**: Users can request a random quote at any time using the `/random` command.
- **Quote Contribution**: Users can contribute their own quotes using the `/contribute` command. These quotes are reviewed by admins before being added to the database.
- **Admin Review**: Admins can review pending quotes and approve or reject them using the `/miAdmin` command.
- **Time Zone Selection**: Users can select their time zone to receive quotes at the appropriate time.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Telegram Bot Token (obtained from [BotFather](https://core.telegram.org/bots#botfather))
- Environment variables (see `.env.example` below)

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ya-Red7/QOTD-Bot.git
   cd qotd-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with the following content:
   ```env
   BOT_TOKEN=your-telegram-bot-token
   MONGO_URI=mongodb://localhost:27017/qotd
   WEBHOOK_URL=https://your-webhook-url.com  # Required only for production
   PORT=3000
   ADMINS=admin1_user_id,admin2_user_id  # Telegram user IDs of admins
   ```

4. **Start the bot**:
   ```bash
   node bot.js
   ```

## File Structure

- **bot.js**: The main file that initializes the bot, sets up webhooks, and handles commands.
- **adminHandler.js**: Handles admin-specific functionality, such as reviewing and approving pending quotes.
- **db.js**: Manages the connection to the MongoDB database.
- **quoteHandler.js**: Handles quote-related functionality, such as fetching random quotes and managing pending quotes.
- **scheduler.js**: Manages the scheduling of daily quotes based on user time zones.
- **userHandler.js**: Handles user-related functionality, such as new user registration and time zone selection.

## Commands

- **/start**: Starts the bot and welcomes the user.
- **/help**: Provides information about the bot and its commands.
- **/random**: Sends a random quote to the user.
- **/contribute**: Allows users to contribute their own quotes.
- **/miAdmin**: Allows admins to review pending quotes (admin-only command).

## Database Schema

### Collections

- **Users**: Stores user information.
  ```json
  {
    "User_id": "string",
    "Time_zone": "string"
  }
  ```

- **Quotes**: Stores approved quotes.
  ```json
  {
    "Quote": "string",
    "Author": "string",
    "Theme": "string",
    "Source": "string",
    "Sent": "boolean"
  }
  ```

- **Pendings**: Stores pending quotes awaiting admin approval.
  ```json
  {
    "Quote": "string",
    "Author": "string",
    "Source": "string"
  }
  ```

## Environment Variables

- `BOT_TOKEN`: Your Telegram bot token.
- `MONGO_URI`: MongoDB connection URI.
- `WEBHOOK_URL`: URL for the webhook (required only for production).
- `PORT`: Port for the Express server.
- `ADMINS`: Comma-separated list of admin Telegram user IDs.

## Time Zones

The bot supports the following fixed time zones:

- Asia/Tokyo
- Europe/London
- US/Eastern
- Africa/Addis_Ababa
- Australia/Sydney
- America/Los_Angeles

Users can select their preferred time zone during the initial setup.

## Quote Themes

The bot uses predefined themes for quotes. Admins can assign one of the following themes when approving a quote:

- Stoic_Strength
- Lead_with_Power
- Endure_and_Conquer
- Grit_and_Grind
- Strength_Unleashed
- Bold_and_Brave
- Honor_Code
- Relentless_Growth
- Adversity_Armor
- Wise_Warrior
- Confident_Ambition
- Master_of_Self
- Unbreakable_Will
- Warrior_Spirit
- Never_Back_Down
- Mental_Muscle
- Victory_Mindset
- Physical_Strength

Each theme is associated with a specific emoji to make the quotes more engaging.

