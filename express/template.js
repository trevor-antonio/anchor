// ============================================================
// ANCHOR — AUTH TEMPLATE (OIDC + WebAuthn only, no passwords)
// ============================================================
// Legend: 🟦 Express core | 🟨 Third-party lib | 🟥 Your app code

// 🟩 Node — loads .env variables into process.env
require('dotenv/config')

// 🟨 Third-party — the Express framework itself
const express = require('express')

// 🟨 Third-party — session middleware, lets the server remember a user across requests
const session = require('express-session')

// 🟨 Third-party — the express-openid-connect wrapper; auth() builds the OIDC middleware, requiresAuth() protects routes
const { auth, requiresAuth } = require('express-openid-connect')

// 🟨 Third-party — WebAuthn functions for generating/verifying passkey challenges
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server')

// 🟨 Third-party — Postgres connection pool, reused across requests instead of opening a new one each time
const { Pool } = require('pg')

// 🟥 Your app — spins up the actual Express application instance
const app = express()

// 🟥 Your app — port the server listens on
const PORT = process.env.PORT || 3000

// 🟥 Your app — the shared Postgres connection pool, using the DB URL from .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// ============================================================
// MIDDLEWARE
// ============================================================

// 🟦 Express core — parses incoming JSON request bodies into req.body
app.use(express.json())

// 🟦 Express core — registers session middleware on every request
app.use(
    session({
        // 🟥 Your config — secret used to cryptographically sign the session cookie
        secret: process.env.SESSION_SECRET,
        // 🟥 Your config — don't re-save session to store if nothing changed
        resave: false,
        // 🟥 Your config — don't create a session until something actually needs one
        saveUninitialized: false
    })
)

// 🟥 Your config — options object express-openid-connect needs to talk to your OIDC provider
const oidcConfig = {
    // 🟥 Your config — enables the /login, /logout, /callback routes automatically
    authRequired: false,
    // 🟥 Your config — allows the wrapper to auto-refresh its internal state
    auth0Logout: true,
    // 🟥 Your config — secret used to encrypt the OIDC session cookie
    secret: process.env.OIDC_SECRET,
    // 🟥 Your config — the URL of your own running app
    baseURL: process.env.BASE_URL,
    // 🟥 Your config — the client ID your provider (Google/Microsoft/Auth0) issued you
    clientID: process.env.OIDC_CLIENT_ID,
    // 🟥 Your config — your provider's issuer URL, tells the library where to find their OIDC metadata
    issuerBaseURL: process.env.OIDC_ISSUER_URL
}

// 🟦 Express core — app.use() registers middleware; auth(oidcConfig) is the OIDC middleware itself
app.use(auth(oidcConfig))

// ============================================================
// WEBAUTHN — REGISTRATION (creating a new passkey)
// ============================================================

// 🟦 Express core — defines a POST route
app.post('/webauthn/register/options', async (req, res) => {
    try {
        // 🟥 Your app — pull the current user's identity from session (set after OIDC login, or from a prior passkey login)
        const user = req.session.user

        // 🟥 Your app — reject if nobody is authenticated yet
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' })
        }

        // 🟨 Third-party — builds the cryptographic challenge + options to send to the browser
        const options = await generateRegistrationOptions({
            // 🟥 Your config — display name for your app, shown in the OS passkey prompt
            rpName: 'Anchor',
            // 🟥 Your config — your app's domain, ties the passkey to this site specifically
            rpID: process.env.WEBAUTHN_RP_ID,
            // 🟥 Your app — identifies which account this credential belongs to
            userName: user.email,
            // 🟥 Your app — credentials the user already has, so the OS doesn't offer to re-register them
            excludeCredentials: user.credentials || []
        })

        // 🟥 Your app — save the challenge in session so /verify can confirm it matches later
        req.session.currentChallenge = options.challenge

        // 🟦 Express core — sends the options back to the browser as JSON
        res.json(options)
    } catch (error) {
        // 🟥 Your app — log the real error server-side
        console.log(error)
        // 🟦 Express core — send a generic error response to the client
        res.status(500).json({ message: 'Unable to create registration options' })
    }
})

// 🟦 Express core — defines the route that verifies the browser's passkey response
app.post('/webauthn/register/verify', async (req, res) => {
    try {
        const user = req.session.user

        if (!user) {
            return res.status(401).json({ message: 'Authentication required' })
        }

        // 🟨 Third-party — checks the signed challenge response against what we stored
        const verification = await verifyRegistrationResponse({
            // 🟥 Your app — the raw credential data the browser sent back
            response: req.body,
            // 🟥 Your app — the challenge we generated and stored a moment ago
            expectedChallenge: req.session.currentChallenge,
            // 🟥 Your config — the origin (protocol + domain) requests must come from
            expectedOrigin: process.env.WEBAUTHN_ORIGIN,
            // 🟥 Your config — must match rpID used above
            expectedRPID: process.env.WEBAUTHN_RP_ID
        })

        // 🟥 Your app — bail out if the cryptographic check failed
        if (!verification.verified) {
            return res.status(400).json({ message: 'Passkey verification failed' })
        }

        // 🟥 Your app — TODO: save verification.registrationInfo (credential ID, public key, counter) to Postgres, linked to this user's account

        // 🟥 Your app — one-time challenge is used up, remove it
        delete req.session.currentChallenge

        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Unable to verify passkey registration' })
    }
})

// ============================================================
// WEBAUTHN — AUTHENTICATION (logging in with an existing passkey)
// ============================================================

app.post('/webauthn/login/options', async (req, res) => {
    try {
        // 🟥 Your app — TODO: look up the user by whatever identifier they submit (e.g. email) — findUserByEmail(req.body.email)
        const user = null // placeholder — replace with real lookup

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        // 🟨 Third-party — builds the login challenge, scoped to this user's known credentials
        const options = await generateAuthenticationOptions({
            rpID: process.env.WEBAUTHN_RP_ID,
            // 🟥 Your app — only these specific credential IDs are allowed to answer the challenge
            allowCredentials: user.credentials.map(cred => ({ id: cred.id }))
        })

        req.session.currentChallenge = options.challenge

        res.json(options)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Unable to create authentication options' })
    }
})

app.post('/webauthn/login/verify', async (req, res) => {
    try {
        // 🟥 Your app — TODO: same user lookup as above
        const user = null // placeholder — replace with real lookup

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        // 🟨 Third-party — verifies the signed challenge proves possession of the private key
        const verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge: req.session.currentChallenge,
            expectedOrigin: process.env.WEBAUTHN_ORIGIN,
            expectedRPID: process.env.WEBAUTHN_RP_ID,
            // 🟥 Your app — the specific stored credential (public key + counter) being challenged
            credential: user.credentials[0]
        })

        if (!verification.verified) {
            return res.status(401).json({ message: 'Authentication failed' })
        }

        // 🟥 Your app — establish the logged-in session, same shape used by OIDC so requireAuthentication works for both
        req.session.user = { id: user.id, email: user.email }

        delete req.session.currentChallenge

        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Unable to authenticate' })
    }
})

// ============================================================
// SHARED AUTH CHECK — works for either OIDC or passkey login
// ============================================================

// 🟥 Your app — not built into Express or any library; you're writing this
function requireAuthentication(req, res, next) {
    // 🟥 Your app — true if express-openid-connect says this request has a valid OIDC session
    const oidcAuthed = req.oidc && req.oidc.isAuthenticated()

    // 🟥 Your app — true if a passkey login already set req.session.user
    const passkeyAuthed = !!req.session.user

    // 🟥 Your app — either path counts as authenticated
    if (!oidcAuthed && !passkeyAuthed) {
        return res.status(401).json({ message: 'Authentication required' })
    }

    // 🟦 Express core — continue to the next middleware or route handler
    next()
}

// 🟦 Express core — example of a protected route using the middleware above
app.get('/protected', requireAuthentication, (req, res) => {
    res.json({ message: 'You are authenticated' })
})

// ============================================================
// SERVER START
// ============================================================

// 🟦 Express core — starts the HTTP server listening on PORT
app.listen(PORT, () => {
    // 🟩 Node — logs to the console once the server is up
    console.log(`Server running on port ${PORT}`)
})