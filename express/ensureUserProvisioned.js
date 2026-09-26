
const { pool } = require('../server')

async function ensureUserProvisioned(req, res, next) {
    try {
        // pulls the logged-in user's unique ID (string) off the request
        const auth0Sub = req.oidc.user.sub

        // Look for an existing user with this auth0_sub
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE auth0_sub = $1',
            [auth0Sub]
        )
        if (existingUser.rows.length > 0) {
            //found them - attach and move on
            req.dbUser = existingUser.rows[0]
            return next()
        }
        //First time logging in, create their row

        const newUser = await pool.query(
            'INSERT INTO users (auth0_sub, email) VALUES ($1, $2) RETURNING *',
            [auth0Sub, req.oidc.user.email]
        )
        req.dbUser = newUser.rows[0]
        next()

    } catch (err) {
        next(err)
    }
}

module.exports = { ensureUserProvisioned }