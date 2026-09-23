
const { pool } = require('../server')

async function ensureUserProvisioned(req, res, next) {
    try {
        // pulls the logged-in user's unique ID off the request
        const auth0sub = req.oidc.user.sub

        // Look for an existing user with this auth0_sub
        const existingUser = await pool.query (
            'SELECT * FROM users WHERE auth0_sub = $1',
            [auth0Sub]
        )
        if (existingUser.rows.length > 0) {
            //found them - attach and move on
            req.dbUser = existingUser.rows[0]
            return next

        }

    } catch (err){
        next (err)
}
} 
