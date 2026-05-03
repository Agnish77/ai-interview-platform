const mongoose = require("mongoose")
const dns = require('dns');

// Fix for Node.js DNS resolution issues on Windows for SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to Database")
    }
    catch (err) {
        console.log(err)
    }
}

module.exports = connectToDB