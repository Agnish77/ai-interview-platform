const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Auto-delete after 24 hours (matches JWT expiry)
    }
});

const BlacklistModel = mongoose.model("blacklist", blacklistSchema);
module.exports = BlacklistModel;
