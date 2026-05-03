const mongoose = require("mongoose")

const userSchema = new mongoose.SchemaTypes({
    username: {
        type: String,
        unique: [true, "username already taken"],
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: [true, "Account already exits with this email address"
    },
    password: {
        type: String,
        required: true
    }
})
const userModel = mongoose.model("users", userSchema)
module.exports = userModel