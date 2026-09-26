// 🟩 Node — loads .env variables into process.env
require('dotenv/config')

const express = require('express')

const session = require('express-session')

const { ensureUserProvisioned } = require('./middleware/ensureUserProvisioned')

app.get('/test-provision', requiresAuth(), ensureUserProvisioned, (req, res) => res.json(req.dbUser()))

//🟨 Third-party — the express-openid-connect wrapper; auth() builds the OIDC middleware, requiresAuth() protects routes
const { auth, requiresAuth} = require('express-openid-connect')


//🟨 Third-party — WebAuthn functions for generating/verifying passkey challenges
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server')

//destructing the pg import to only use 'pool' property (class)
const { Pool } = require('pg')

const app = express()

//use process.env.PORT OR fall back to 3000
const PORT = process.env.PORT || 3000

const pool = new Pool({connectionString: process.env.DATABASE_URL})

module.exports = { pool }

// Middleware 

app.use(express.json())

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    })
)

//

//
const oidcConfig = {
    
    authRequired: false,
   
    auth0Logout: true,
    
    secret: process.env.OIDC_SECRET,
    baseURL: process.env.BASE_URL,
    
    clientID: process.env.OIDC_CLIENT_ID,

    issuerBaseURL: process.env.OIDC_ISSUER_URL
}
//registers middleware; uses OIDC middleware
app.use(auth(oidcConfig))

