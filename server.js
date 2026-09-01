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