const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
async function registerUserContoller(req, res) {
    const { username, email, password } = req.body //destructuring
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }
    const isuserExists = await userModel.findOne({

        $or: [{ username }, { email }] //jekono ekta lagbe username or email
    })
    if (isuserExists) {
        return res.status(400).json({ message: "User already exists" })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = await userModel.create({
        username,
        email,
        password: hash
    })
    const token = jwt.sign(
        { id: user._id }, username: user.username},
process.env.JWT_SECRET,
    { expiresIn: "1d" }
    )
res.cookie("token", token)
res.status(201).json({ //201 when resource created at backend
    message: "User registered successfully",
    user: {
        id: user._id,
        username: user.username,
        email: user.email
    }

})
    
}
/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 *@access Public
 */
async function loginUserController(req, res) {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" })
    }
    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(400).json({ message: "User not found" })
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid password" })
    }
    const token = jwt.sign(
        { id: user._id }, username: user.username},
process.env.JWT_SECRET,
    { expiresIn: "1d" }
    )
res.cookie("token", token)
res.status(200).json({ //200 when resource created at backend
    message: "User logged in successfully",
    user: {
        id: user._id,
        username: user.username,
        email: user.email
    }

})
    
}
module.exports = {
    registerUserController,
    loginUserController

}