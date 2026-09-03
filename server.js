// 🟩 Node — loads .env variables into process.env
require('dotenv/config')

const express = require('express')

const session = require('express-session')

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

const pool = new POOL({connectionString: process.env.DATABASE_URL})

// Middleware 

app.use(express.json())

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
 })
)
//
// NEED TO ADD THESE TO .env
//
const oidcConfig = {
    //don't req auth for every req
    authRequired: false,
    //if /login route is used,logout by redirecting to OIDC provider's own logout endpoint
    auth0Logout: true,
    //secret used to encrypt OIDC session cookie
    secret: process.env.OIDC_SECRET,
    baseURL: process.env.BASE_URL,
    //client ID (Google/Mircosoft/AUTH0) issues
    clientID: process.env.OIDC_CLIENT_ID,
    //tells the lib where to find OIDC metadata
    issuerBaseURL: process.env.OIDC_ISSUER_URL
}
//regusters middleware; uses OIDC middleware
app.use(auth(oidcConfig))

//WEBAUTHN - REGISTRATION (creating a new passkey)

// Express Core
app.post('/webauthn/register/options', async (req, res) => {
    try {
        const user = req.session.user

        if(!user) {
            return res.status(401).json({message: 'Authentication required'})
        }
        const options = await generateRegistrationOptions({
            rpName: 'Anchor',
            rpID: process.env.WEBAUTHN_RP_ID,
            userName: user.email,
            excludeCredentials: user.credentials || []
        })

        //save challange in session so /verify can confirm it matches later
        req.session.currentChallange

        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Unable to verify passkey registration'})
    }
})