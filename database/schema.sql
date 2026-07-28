

-- Reset database
DROP TABLE IF EXISTS users;

--Create table
CREATE TABLE users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR (50) NOT NULL,
    last_name VARCHAR (50) NOT NULL,
    username VARCHAR (30) NOT NULL UNIQUE,
    email VARCHAR (255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    totp_secret VARCHAR(32),
    totp_enabled BOOLEAN NOT NULL,
    failed_login_attempts INTEGER NOT NULL, 
    locked_until TIMESTAMPTZ, 
    email_verified BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL, 
    updated_at TIMESTAMPTZ NOT NULL
);

DROP  TABLE IF EXISTS conversation_sesions

CREATE TABLE conversation_sesions(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
    

);