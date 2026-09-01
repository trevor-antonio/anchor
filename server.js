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