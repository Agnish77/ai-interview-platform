const { Router } = require('express')
const authController = require("../controllers/auth.controller") // all logic in controller
const authRouter = Router()

/**
 * @route POST/api/register
 * @description Register a new user
 * @acess Public
 */
authRouter.post("/register", authController.registerUserController)

/**
 * @route POST/api/login
 * @description login a user
 * @acess Public
 */
authRouter.post("/login", authController.loginUserController)
module.exports = authRouter