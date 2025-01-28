// Database connection: db.js
const { MongoClient } = require('mongodb');
require('dotenv').config({path: '../.env'});

let db = null;
const connect = async () => {
    const uri = process.env.MONGO_URI ;
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    //console.log(client);
    try {
        await client.connect();
        console.log('Connected to MongoDB successfully.');
        db = client.db(); // Store the database object
        return db // Return the database object
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        await client.close();
        process.exit(1); // Exit process with failure
     }
};
const getDb = () => {
    if (!db) {
        throw new Error('Database connection is not established. Call connectToDatabase first.');
    }
    return db;
}

module.exports = { connect, getDb };
