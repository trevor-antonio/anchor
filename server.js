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

const PORT = 3000

// database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

//middleware

app.use(express.json())

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
)

//api routes

app.post('/register', async (req, res) => {
    const { email, username, password } = req.body

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
        `
        INSERT INTO users (email, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, email, username`,
        [email, username, passwordHash]
    )

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

    // TODO: what should happen here if `user` is undefined
    // (no matching email found)? Think about what runs on the
    // next line if you skip this check.

    try {
        // TODO: should this bcrypt.compare call be inside or
        // outside this try block? What happens right now if
        // `user` is undefined by the time this line runs?
        const passwordMatch = await bcrypt.compare(
            password,
            user?.password_hash
        )

        if (passwordMatch) {
            req.session.userId = user.id
            res.json({
                message: "Logged in"
            })
            return
        }
        if (!user) {

        }
        res.status(401).json({
            message: "Invalid credentials"
        })
    } catch (error) {
        console.log(error)
    }
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