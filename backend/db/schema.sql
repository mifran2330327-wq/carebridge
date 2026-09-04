-- =========================================================================
-- CareBridge — PostgreSQL schema
-- Run this against an empty database to create every table, type, and
-- foreign key relationship the API relies on. Written in plain SQL (no
-- ORM) so it's easy to read top-to-bottom and easy to inspect in psql.
--
--   createdb carebridge
--   psql -d carebridge -f db/schema.sql
--   psql -d carebridge -f db/seed.sql   (optional demo data)
-- =========================================================================

-- Lets us use gen_random_uuid() further down if we ever want UUID keys.
-- Not required for the integer-PK design below, but harmless to enable.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------
-- ENUM types — constrains a handful of columns to a fixed set of values
-- instead of free-text, which keeps the data consistent at the DB level.
-- -------------------------------------------------------------------------
CREATE TYPE appointment_mode   AS ENUM ('In-person', 'Video call');
CREATE TYPE appointment_status AS ENUM ('upcoming', 'completed', 'cancelled');
CREATE TYPE favorite_target    AS ENUM ('professional', 'school');
CREATE TYPE recommendation_type AS ENUM ('Professional', 'School', 'Resource');

-- -------------------------------------------------------------------------
-- USERS  (parents / caregivers — the accounts that log in)
-- -------------------------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  password_hash TEXT          NOT NULL,
  phone         VARCHAR(30),
  location_text VARCHAR(160),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- CHILDREN  (one parent → many children)
-- -------------------------------------------------------------------------
CREATE TABLE children (
  id             SERIAL PRIMARY KEY,
  parent_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(120) NOT NULL,
  age            SMALLINT CHECK (age >= 0 AND age <= 25),
  diagnosis      VARCHAR(200),
  support_level  VARCHAR(20),   -- 'Level 1' | 'Level 2' | 'Level 3'
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_children_parent_id ON children(parent_id);

-- -------------------------------------------------------------------------
-- PROFESSIONALS  (therapist / doctor / tutor directory entries)
-- -------------------------------------------------------------------------
CREATE TABLE professionals (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  role             VARCHAR(120) NOT NULL,      -- e.g. "Speech & Language Therapist"
  bio              TEXT,
  location_text    VARCHAR(160),
  latitude         DOUBLE PRECISION,
  longitude        DOUBLE PRECISION,
  price_text       VARCHAR(60),                -- e.g. "৳1500/session" (kept as text — currency/unit varies)
  availability_text VARCHAR(120),               -- e.g. "Available this week"
  rating           NUMERIC(2,1) DEFAULT 0,      -- denormalized average, refreshed by trigger below
  reviews_count    INTEGER DEFAULT 0,
  verified         BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_professionals_location ON professionals(location_text);

-- -------------------------------------------------------------------------
-- SPECIALTIES  (lookup table) + PROFESSIONAL_SPECIALTIES (junction table)
-- Normalized many-to-many instead of a text array, so specialties can be
-- filtered/joined efficiently and renamed in one place.
-- -------------------------------------------------------------------------
CREATE TABLE specialties (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE professional_specialties (
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  specialty_id    INTEGER NOT NULL REFERENCES specialties(id)    ON DELETE CASCADE,
  PRIMARY KEY (professional_id, specialty_id)
);

-- -------------------------------------------------------------------------
-- SCHOOLS  (special / inclusive school & center directory entries)
-- -------------------------------------------------------------------------
CREATE TABLE schools (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(160) NOT NULL,
  type           VARCHAR(80)  NOT NULL,   -- e.g. "Inclusive (mainstream + special needs)"
  location_text  VARCHAR(160),
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  age_range_text VARCHAR(40),             -- e.g. "4–12 yrs"
  rating         NUMERIC(2,1) DEFAULT 0,
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- FACILITIES  (lookup table) + SCHOOL_FACILITIES (junction table)
-- Same normalization pattern as specialties above.
-- -------------------------------------------------------------------------
CREATE TABLE facilities (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE school_facilities (
  school_id    INTEGER NOT NULL REFERENCES schools(id)    ON DELETE CASCADE,
  facility_id  INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  PRIMARY KEY (school_id, facility_id)
);

-- -------------------------------------------------------------------------
-- APPOINTMENTS  (a booking between a parent's child and a professional)
-- -------------------------------------------------------------------------
CREATE TABLE appointments (
  id              SERIAL PRIMARY KEY,
  parent_id       INTEGER NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
  child_id        INTEGER NOT NULL REFERENCES children(id)       ON DELETE CASCADE,
  professional_id INTEGER NOT NULL REFERENCES professionals(id)  ON DELETE CASCADE,
  appointment_date DATE       NOT NULL,
  appointment_time TIME       NOT NULL,
  mode            appointment_mode   NOT NULL DEFAULT 'In-person',
  status          appointment_status NOT NULL DEFAULT 'upcoming',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_parent_id  ON appointments(parent_id);
CREATE INDEX idx_appointments_pro_id     ON appointments(professional_id);
CREATE INDEX idx_appointments_date       ON appointments(appointment_date);

-- -------------------------------------------------------------------------
-- FORUM  (parent community discussion threads + replies)
-- -------------------------------------------------------------------------
CREATE TABLE forum_posts (
  id             SERIAL PRIMARY KEY,
  author_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(200) NOT NULL,
  child_context  VARCHAR(160),   -- e.g. "Parent of a 5-year-old with ASD"
  tag            VARCHAR(60),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE forum_replies (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id   INTEGER NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forum_replies_post_id ON forum_replies(post_id);

-- -------------------------------------------------------------------------
-- RESOURCES  (educational content library articles)
-- -------------------------------------------------------------------------
CREATE TABLE resources (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  category     VARCHAR(60)  NOT NULL,
  excerpt      TEXT,
  body         TEXT,
  read_time    VARCHAR(20),   -- e.g. "6 min read"
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- FAVORITES  (a parent saving a professional or a school)
-- Two dedicated join tables (rather than one polymorphic table) so a real
-- foreign key can enforce that the saved id actually exists.
-- -------------------------------------------------------------------------
CREATE TABLE favorite_professionals (
  user_id         INTEGER NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, professional_id)
);

CREATE TABLE favorite_schools (
  user_id     INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, school_id)
);

-- -------------------------------------------------------------------------
-- REVIEWS  (parent reviews of a professional — feeds professionals.rating)
-- -------------------------------------------------------------------------
CREATE TABLE reviews (
  id              SERIAL PRIMARY KEY,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  parent_id       INTEGER NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, parent_id)  -- one review per parent per professional
);

-- -------------------------------------------------------------------------
-- AI RECOMMENDATIONS  (per-child suggestions, generated server-side)
-- target_id points at a professionals/schools/resources row depending on
-- `type` — application-enforced rather than a DB foreign key, since it can
-- point at three different tables.
-- -------------------------------------------------------------------------
CREATE TABLE ai_recommendations (
  id          SERIAL PRIMARY KEY,
  child_id    INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  type        recommendation_type NOT NULL,
  target_id   INTEGER NOT NULL,
  title       VARCHAR(200) NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- Trigger: keep professionals.rating / reviews_count in sync with reviews.
-- Demonstrates a computed/denormalized column kept fresh automatically,
-- so the API can read professionals.rating directly instead of averaging
-- reviews on every request.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_professional_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE professionals
  SET rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE professional_id = COALESCE(NEW.professional_id, OLD.professional_id)
      ), 0),
      reviews_count = (
        SELECT COUNT(*) FROM reviews WHERE professional_id = COALESCE(NEW.professional_id, OLD.professional_id)
      )
  WHERE id = COALESCE(NEW.professional_id, OLD.professional_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_after_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION refresh_professional_rating();
