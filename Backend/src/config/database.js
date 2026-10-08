const mongoose = require("mongoose");

async function connectToDB() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });
        console.log("Connected to Database");
    } catch (error) {
        console.error(`Database connection failed: ${error.message}`);
        throw error;
    }
}

module.exports = connectToDB;
