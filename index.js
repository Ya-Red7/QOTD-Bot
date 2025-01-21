const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

// 1. Define Your Mongoose Model (adjust this based on your schema)
const quoteSchema = new mongoose.Schema({
    Author: { type: String, required: true },
    Quote: { type: String, required: true },
    Theme: { type: String },
    Source: { type: String, required: true },
    Sent: { type: Boolean, default: false },
});

//const Quote = mongoose.model('Quote', quoteSchema);
const Quote = mongoose.model('Quote', quoteSchema, 'Quotes'); 
// 2. Connection String
const mongoUrl = "mongodb+srv://yaredwondatir:Yardadoya7321@cluster0.lcoyg.mongodb.net/";

// 3. Function to Fetch a Quote by ID
async function fetchQuoteById(quoteId) {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully.');


        // Query the database to fetch a specific quote
        const quotes = await Quote.find({ Author: quoteId });
        if (quotes.length === 0) {
          console.log(`No quotes found with author: ${quoteId}`);
          return [];
        }
        console.log('Quotes found:', quotes);

        return quote;
    } catch (error) {
        console.error('Error fetching quote:', error);
        return null;
    } finally {
      // close the connection when finished
        await mongoose.disconnect()
        console.log("Disconnected from MongoDB")
    }
}


// 4. Example Usage with a hard coded ID
const quoteIdToFetch = "Marcus Aurelius"; // Replace with actual ID

fetchQuoteById(quoteIdToFetch).then(quote => console.log(quote));