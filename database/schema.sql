

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

ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;

ALTER TABLE users ADD COLUMN age INT NOT NULL;

ALTER TABLE users ADD COLUMN gender_identity VARCHAR (60) NOT NULL;

ALTER TABLE users ALTER COLUMN gender_identity DROP NOT NULL;

ALTER TABLE users ADD COLUMN pronouns VARCHAR(60) NOT NULL;

ALTER TABLE users ALTER COLUMN pronouns DROP NOT NULL;

ALTER TABLE users ADD COLUMN sexual_orientation VARCHAR(60);

ALTER TABLE users ADD COLUMN race_ethnicity VARCHAR(60);

ALTER TABLE users ADD COLUMN primary_language VARCHAR(60) NOT NULL;

ALTER TABLE users ADD COLUMN veteran_status VARCHAR(60);

-- CONSENT TABLE

CREATE TABLE consent (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    is_of_age BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_services BOOLEAN NOT NULL DEFAULT FALSE,
    consented_at TIMESTAMPTZ,
    terms_version TEXT
);

-- NEEDS ASSESSMENT TABLE

CREATE TABLE needs_assessments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    housing_status VARCHAR(50),
    has_id BOOLEAN,
    has_social_security_card BOOLEAN,
    has_birth_certificate BOOLEAN,
    uses_substances BOOLEAN,
    needs_medication BOOLEAN,
    behavioral_health_symptoms BOOLEAN,
    has_support_system BOOLEAN,
    assessed_at TIMESTAMPTZ
);