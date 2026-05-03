const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 7 * 24 * 60 * 60 // Auto-delete after 7 days
    }
});

const RefreshTokenModel = mongoose.model("refresh_tokens", refreshTokenSchema);
module.exports = RefreshTokenModel;
