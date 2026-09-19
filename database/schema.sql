\connect anchor_db;

-- Reset database
DROP TABLE IF EXISTS webauthn_credentials;
DROP TABLE IF EXISTS needs_assessments;
DROP TABLE IF EXISTS consent;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;

-- ============================================================
-- USERS — identity only. Created at first Auth0/OIDC login.
-- ============================================================
CREATE TABLE users (
    user_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth0_sub TEXT NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- USER_PROFILES — filled in during a separate service-registration
-- step, after login. One-to-one with users.
-- ============================================================
CREATE TABLE user_profiles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(user_id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    zip_code VARCHAR(10) NOT NULL,
    age INT NOT NULL,
    primary_language VARCHAR(60) NOT NULL,
    gender_identity VARCHAR(60),
    pronouns VARCHAR(60),
    sexual_orientation VARCHAR(60),
    race_ethnicity VARCHAR(60),
    veteran_status VARCHAR(60),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CONSENT
-- ============================================================
CREATE TABLE consent (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    is_of_age BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_services BOOLEAN NOT NULL DEFAULT FALSE,
    consented_at TIMESTAMPTZ,
    terms_version TEXT
);

-- ============================================================
-- NEEDS_ASSESSMENTS
-- ============================================================
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

-- ============================================================
-- WEBAUTHN_CREDENTIALS
-- ============================================================
CREATE TABLE webauthn_credentials (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);