const express = require("express");

const app = express();

app.use(express.json()); //middleware to parse json data

module.exports = app //exporting app
