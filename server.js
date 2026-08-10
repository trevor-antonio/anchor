
// 'express' and 'app' are conventions
//'require('express') allows layering middleware (api bridge builder)
const express = require('express')

//'express-session' is the name of an npm package that adds session-management functionality - gives tje server the ability to remember a user between HTTP req
const session = require('express-session')

//'bcrypt' is a password hashing lib
const bcrypt = require('bcrypt')

//'pool' is a data bank of open conections, saving time from having to find a new one on the fly each time the server runs
//'pg' is the translator here allowing node to communicste with postgres
const {Pool} = require('pg')

//'express()' is a function that acts like a blueprint and when called, allows the server spins up fresh instance
const app = express()

const port = 3000

// database
//this code block is fixed syntax
//creates 'pool' object
//'pool' object is created when the app starts
//'process.env' connects with the currently stored data in Node under the 'database_url' name 
const pool = new Pool({
    connectionString: process.env.DATABSE_URL
});

app.listen(port)

//middleware

//middleware is a function that sits in the middle of (req, res), doing something with the req before it reaches the final route handler (function)

//app receives JSON data that arrives as raw data bytes and 'express.json' translates the bytes into usable data
app.use(express.json())

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
)