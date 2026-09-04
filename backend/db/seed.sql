-- =========================================================================
-- CareBridge — demo seed data
-- Mirrors the mock data the frontend currently ships with, so switching
-- the frontend over to real API calls doesn't change what's on screen.
-- Run after schema.sql:
--   psql -d carebridge -f db/seed.sql
--
-- The demo parent's password is: password123
-- (bcrypt hash generated with 10 salt rounds — see backend/src/utils)
-- =========================================================================

-- -------------------------------------------------------------------------
-- Users
-- -------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, location_text) VALUES
  ('Nusrat Jahan', 'nusrat.jahan@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8G6d3lC5t7lRnAX4Wf9c8ZmDVEK6Nq', 'Dhanmondi, Dhaka');

-- -------------------------------------------------------------------------
-- Children
-- -------------------------------------------------------------------------
INSERT INTO children (parent_id, name, age, diagnosis, support_level, notes) VALUES
  (1, 'Arham',   6, 'Autism Spectrum Disorder', 'Level 2', 'Responds well to visual schedules and sensory breaks.'),
  (1, 'Meherin', 9, 'ADHD, Dyslexia',           'Level 1', 'Needs extended time for reading tasks.');

-- -------------------------------------------------------------------------
-- Specialties (lookup)
-- -------------------------------------------------------------------------
INSERT INTO specialties (name) VALUES
  ('Autism'), ('Apraxia'), ('Non-verbal communication'), ('Sensory Integration'),
  ('Fine motor skills'), ('ADHD'), ('Behavioral therapy'), ('Anxiety'),
  ('Dyslexia'), ('Learning disabilities'), ('Early intervention'),
  ('Developmental delay'), ('Cerebral Palsy'), ('Motor delay');

-- -------------------------------------------------------------------------
-- Professionals
-- -------------------------------------------------------------------------
INSERT INTO professionals (name, role, location_text, price_text, availability_text, rating, reviews_count, verified) VALUES
  ('Dr. Farhana Islam',    'Speech & Language Therapist', 'Gulshan, Dhaka',    '৳1500/session', 'Available this week', 4.9, 128, true),
  ('Tanvir Ahmed',         'Occupational Therapist',      'Uttara, Dhaka',     '৳1200/session', 'Next slot: Mon',      4.7, 84,  true),
  ('Dr. Shirin Akter',     'Child Psychologist',          'Dhanmondi, Dhaka',  '৳2000/session', 'Available today',     5.0, 203, true),
  ('Rezaul Karim',         'Special Education Tutor',     'Mirpur, Dhaka',     '৳900/session',  'Available this week', 4.5, 41,  false),
  ('Dr. Nabila Chowdhury', 'Developmental Pediatrician',  'Banani, Dhaka',     '৳2500/session', 'Next slot: Wed',      4.8, 156, true),
  ('Imran Hossain',        'Physiotherapist',             'Mohammadpur, Dhaka','৳1300/session', 'Available this week', 4.6, 67,  true);

INSERT INTO professional_specialties (professional_id, specialty_id)
SELECT p.id, s.id FROM professionals p, specialties s WHERE
  (p.name = 'Dr. Farhana Islam'    AND s.name IN ('Autism', 'Apraxia', 'Non-verbal communication')) OR
  (p.name = 'Tanvir Ahmed'         AND s.name IN ('Sensory Integration', 'Fine motor skills')) OR
  (p.name = 'Dr. Shirin Akter'     AND s.name IN ('ADHD', 'Behavioral therapy', 'Anxiety')) OR
  (p.name = 'Rezaul Karim'         AND s.name IN ('Dyslexia', 'Learning disabilities')) OR
  (p.name = 'Dr. Nabila Chowdhury' AND s.name IN ('Early intervention', 'Autism', 'Developmental delay')) OR
  (p.name = 'Imran Hossain'        AND s.name IN ('Cerebral Palsy', 'Motor delay'));

-- -------------------------------------------------------------------------
-- Facilities (lookup)
-- -------------------------------------------------------------------------
INSERT INTO facilities (name) VALUES
  ('Sensory room'), ('Speech therapy on-site'), ('Small class size'),
  ('Occupational therapy'), ('Vocational training'), ('Transport'),
  ('1:1 therapy rooms'), ('Parent training'), ('Play-based curriculum'),
  ('Resource room'), ('Shadow teachers'), ('Counseling');

-- -------------------------------------------------------------------------
-- Schools
-- -------------------------------------------------------------------------
INSERT INTO schools (name, type, location_text, age_range_text, rating, image_url) VALUES
  ('Bright Horizons Inclusive School', 'Inclusive (mainstream + special needs)', 'Dhanmondi, Dhaka', '4–12 yrs', 4.6,
    'https://images.unsplash.com/photo-1704708798584-e63237feaff1?auto=format&fit=crop&w=800&q=80'),
  ('Shishu Bikash Special School',     'Special needs school',                   'Mirpur, Dhaka',    '5–16 yrs', 4.4,
    'https://images.unsplash.com/photo-1540151812223-c30b3fab58e6?auto=format&fit=crop&w=800&q=80'),
  ('Little Steps Learning Center',     'Early intervention center',              'Gulshan, Dhaka',   '2–7 yrs',  4.9,
    'https://images.unsplash.com/photo-1647621148696-ba59c4d8fca1?auto=format&fit=crop&w=800&q=80'),
  ('Asha Inclusive Academy',           'Inclusive (mainstream + special needs)', 'Uttara, Dhaka',    '6–14 yrs', 4.3,
    'https://images.unsplash.com/photo-1704708798584-e63237feaff1?auto=format&fit=crop&w=800&q=80');

INSERT INTO school_facilities (school_id, facility_id)
SELECT sc.id, f.id FROM schools sc, facilities f WHERE
  (sc.name = 'Bright Horizons Inclusive School' AND f.name IN ('Sensory room', 'Speech therapy on-site', 'Small class size')) OR
  (sc.name = 'Shishu Bikash Special School'     AND f.name IN ('Occupational therapy', 'Vocational training', 'Transport')) OR
  (sc.name = 'Little Steps Learning Center'     AND f.name IN ('1:1 therapy rooms', 'Parent training', 'Play-based curriculum')) OR
  (sc.name = 'Asha Inclusive Academy'           AND f.name IN ('Resource room', 'Shadow teachers', 'Counseling'));

-- -------------------------------------------------------------------------
-- Resources (educational content library)
-- -------------------------------------------------------------------------
INSERT INTO resources (title, category, excerpt, read_time, image_url) VALUES
  ('Understanding Your Child’s IEP: A Parent’s Guide', 'Education',
    'What an Individualized Education Plan actually covers, and the questions worth asking at your next school meeting.',
    '6 min read', 'https://images.unsplash.com/photo-1540151812223-c30b3fab58e6?auto=format&fit=crop&w=800&q=80'),
  ('Sensory-Friendly Routines for Mornings That Don’t Melt Down', 'Daily Life',
    'Small, practical changes to morning routines that reduce sensory overload before school.',
    '4 min read', 'https://images.unsplash.com/photo-1647621148696-ba59c4d8fca1?auto=format&fit=crop&w=800&q=80'),
  ('ADHD in Girls: Why It’s Often Missed', 'Health',
    'Recognizing the quieter signs of ADHD that don’t match the classic hyperactive stereotype.',
    '8 min read', 'https://images.unsplash.com/photo-1540593463874-59835505e99d?auto=format&fit=crop&w=800&q=80'),
  ('Choosing Between Inclusive and Special Schools', 'Education',
    'A side-by-side look at what each setting offers, and how to match it to your child’s needs.',
    '7 min read', 'https://images.unsplash.com/photo-1704708798584-e63237feaff1?auto=format&fit=crop&w=800&q=80'),
  ('Talking to Siblings About Autism', 'Family',
    'Age-appropriate ways to help siblings understand and support their brother or sister.',
    '5 min read', 'https://images.unsplash.com/photo-1763478986815-99cfdf2f7c79?auto=format&fit=crop&w=800&q=80'),
  ('Building a Visual Schedule at Home', 'Daily Life',
    'A step-by-step template for a visual schedule that actually gets used.',
    '3 min read', 'https://images.unsplash.com/photo-1647621148696-ba59c4d8fca1?auto=format&fit=crop&w=800&q=80');

-- -------------------------------------------------------------------------
-- Forum posts
-- -------------------------------------------------------------------------
INSERT INTO forum_posts (author_id, title, child_context, tag) VALUES
  (1, 'Any recommendations for a good OT near Mirpur?', 'Parent of a 5-year-old with ASD', 'Recommendations'),
  (1, 'How do you handle homework meltdowns?', 'Parent of a 9-year-old with ADHD', 'Daily Life'),
  (1, 'Our IEP meeting went badly — what would you have asked?', 'Parent of a 7-year-old with Dyslexia', 'Education'),
  (1, 'Early intervention center suggestions in Dhaka?', 'Parent of a 4-year-old with global developmental delay', 'Recommendations');

-- -------------------------------------------------------------------------
-- Appointments
-- -------------------------------------------------------------------------
INSERT INTO appointments (parent_id, child_id, professional_id, appointment_date, appointment_time, mode, status)
SELECT 1, c.id, p.id, '2026-09-08', '10:30', 'In-person', 'upcoming'
FROM children c, professionals p WHERE c.name = 'Arham' AND p.name = 'Dr. Farhana Islam';

INSERT INTO appointments (parent_id, child_id, professional_id, appointment_date, appointment_time, mode, status)
SELECT 1, c.id, p.id, '2026-09-10', '16:00', 'Video call', 'upcoming'
FROM children c, professionals p WHERE c.name = 'Meherin' AND p.name = 'Dr. Shirin Akter';

-- -------------------------------------------------------------------------
-- AI recommendations (normally generated server-side — seeded here so the
-- Recommendations page has something to show before that logic runs)
-- -------------------------------------------------------------------------
INSERT INTO ai_recommendations (child_id, type, target_id, title, reason)
SELECT c.id, 'Professional', p.id, 'Dr. Farhana Islam — Speech & Language Therapist',
       'Matches Arham’s non-verbal communication goals and is close by.'
FROM children c, professionals p WHERE c.name = 'Arham' AND p.name = 'Dr. Farhana Islam';

INSERT INTO ai_recommendations (child_id, type, target_id, title, reason)
SELECT c.id, 'Resource', r.id, 'Building a Visual Schedule at Home',
       'You noted Arham responds well to visual schedules.'
FROM children c, resources r WHERE c.name = 'Arham' AND r.title = 'Building a Visual Schedule at Home';

INSERT INTO ai_recommendations (child_id, type, target_id, title, reason)
SELECT c.id, 'Professional', p.id, 'Rezaul Karim — Special Education Tutor',
       'Specializes in dyslexia support with flexible after-school slots.'
FROM children c, professionals p WHERE c.name = 'Meherin' AND p.name = 'Rezaul Karim';

INSERT INTO ai_recommendations (child_id, type, target_id, title, reason)
SELECT c.id, 'School', sc.id, 'Bright Horizons Inclusive School',
       'Small class sizes and a resource room fit Meherin’s IEP goals.'
FROM children c, schools sc WHERE c.name = 'Meherin' AND sc.name = 'Bright Horizons Inclusive School';
