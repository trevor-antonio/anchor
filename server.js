//json (javascript object notation) is a format, not a file, 


// 'express' and 'app' are conventions
//'require('express') allows layering middleware (api bridge builder)
const express = require('express')

//'express-session' is the name of an npm package that adds session-management functionality - gives tje server the ability to remember a user between HTTP req
const session = require('express-session')

//'bcrypt' is a password hashing lib
const bcrypt = require('bcrypt')

//'pool' is a data bank of open conections, saving time from having to find a new one on the fly each time the server runs
//'pg' is the translator here allowing node to communicste with postgres
//import 'pool' class 
//'pool' has nothing to do with express, it's just the db
const {Pool} = require('pg')

//'express()' is a function that acts like a blueprint and when called, allows the server spins up fresh instance
//'app' is an Express app object
const app = express()

const port = 3000

// database
//this code block is fixed syntax
//creates 'pool' object
//'pool' object is created when the app starts
//'process.env' connects with the currently stored data in Node under the 'database_url' name 
//instiating a new pool object
//'new' tell js to create  new object from the class
//constructor is set up recipe inside class
const pool = new Pool({
    connectionString: process.env.DATABSE_URL
});

app.listen(port)

//middleware

//middleware is a function that sits in the middle of (req, res), doing something with the req before it reaches the final route handler (function)

//app receives JSON data that arrives as raw data bytes and 'express.json' translates the bytes into usable data
app.use(express.json())

//app.use is a core express method used to add middleware functions to the request-processing pipline. 
//it's telling the session (express) how to manage the session configuration
app.use(
    //'session' is a function that creates and returns an annonymous middleware function
    session({
        //a secret value used when creating/verifying the session's cookie signature and that value is received by session middleware
        secret: process.env.SESSION_SECRET,
        //tells session middleware not to save the value, if the value hasn't changed
        resave: false,
        //another config session just telling the middleware not to save a session  that hasn't been initialized 
        saveUninitialized: false
    })
)

//api routes

app.post('/register', async (req, res) => {
    const { email, username, password} = req.body

    //'bcrypt' is intentionally slow
    //'12' is a cost factor that requires more compute power for eah hash
    //'bcrypt' generates a unique random salt for each password like a random seasoning packet that gets added to keep similar passwords assigned to differet hashes
    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
        //'INSERT INTO' adds data to each column
        
        //'$' is leaving space for value in each column

        `
        INSERT INTO users (email, username, password_hash)
   
        VALUES ($1, $2, $3)
        
        RETURNING id, email, username`

        [email, user, passwordHash]
    )
    //take this JS data structure and serialize (translate) into JSON so it can be transmitted in an HTTP response
    res.json(result.rows[0])
})   
    
    app.post("/login", async (req, res) => {
    const { email, password } = req.body

    const result = await pool.query(
        `
        SELECT id, email, username, password_hash
        FROM users
        WHERE email = $1
        `,
        [email]
    )

    const user = result.rows[0]

    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    )
    //try {
        if (passwordMatch) {
        req.session.userId = user.id

        res.json({
            message: "Logged in"
        })

        return
    }

    res.status(401).json({
        message: "Invalid credentials"
    })
    //catch (error) {
    //    console.log(error)
    //}

})

// 2FA
app.post("/verify-2fa", (req, res) => {
    // TOTP verification would go here
    res.json({
        message: "2FA verification not implemented"
    })
})

// server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

