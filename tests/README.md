# CareBridge Selenium Test Suite

A beginner-friendly Selenium WebDriver test suite for the CareBridge web application, covering login, navigation, schools, doctors, community, blog/resources, appointments, admin, signup, and AI chat widget features.

---

## Prerequisites

- **Python 3.8+**
- **Google Chrome** installed
- **ChromeDriver** compatible with your Chrome version (or use `webdriver-manager`)
- The CareBridge frontend and backend running locally

---

## Installation

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Install ChromeDriver (option A: automatic via webdriver-manager)
# The base_selenium.py uses webdriver.Chrome() directly.
# Install webdriver-manager and update base_selenium.py if needed, OR

# Option B: Manually download ChromeDriver
#  - Download from: https://googlechromelabs.web.dev/downloads#chromedriver/
#  - Extract to a folder on your PATH
```

---

## Starting the CareBridge Application

```bash
# Terminal 1: Start the backend
cd server
node server.js
# Backend runs on http://localhost:5000

# Terminal 2: Start the frontend
cd ..
node node_modules/vite/bin/vite.js
# Frontend runs on http://localhost:5174
```

Wait for both to start before running tests.

---

## Test Accounts

The tests assume the following test accounts exist in the CareBridge database:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Parent | `parent@test.com` | `Test1234!` | PARENT |
| Doctor | `doctor@test.com` | `Test1234!` | DOCTOR |
| Admin | `admin@test.com` | `Test1234!` | ADMIN |

> **If these accounts don't exist**, create them manually via the Signup page at `http://localhost:5174/signup`, or set the following **environment variables** to use your own credentials:
>
> ```bash
> export TEST_PARENT_EMAIL=you@parent.com
> export TEST_PARENT_PASSWORD=YourPassword123
> export TEST_DOCTOR_EMAIL=you@doctor.com
> export TEST_DOCTOR_PASSWORD=YourPassword123
> export TEST_ADMIN_EMAIL=you@admin.com
> export TEST_ADMIN_PASSWORD=YourPassword123
> ```

> **Important:** Do NOT use real production data. Use dedicated test accounts only.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CAREBRIDGE_URL` | Base URL of the application | `http://localhost:5174` |
| `TEST_PARENT_EMAIL` | Parent test account email | `parent@test.com` |
| `TEST_PARENT_PASSWORD` | Parent test account password | `Test1234!` |
| `TEST_DOCTOR_EMAIL` | Doctor test account email | `doctor@test.com` |
| `TEST_DOCTOR_PASSWORD` | Doctor test account password | `Test1234!` |
| `TEST_ADMIN_EMAIL` | Admin test account email | `admin@test.com` |
| `TEST_ADMIN_PASSWORD` | Admin test account password | `Test1234!` |

---

## Running Tests

### Run all tests

```bash
cd tests
python -m pytest -v
```

### Run a specific test file

```bash
python -m pytest test_blog.py -v
```

### Run tests with markers

```bash
# Run only the login tests
python -m pytest test_login.py -v

# Run tests and stop on first failure
python -m pytest -v -x

# Run with a specific browser profile (not headless by default)
python -m pytest -v --timeout=60
```

### Run without pytest (direct execution)

```bash
python test_login.py
```

---

## Test Files Overview

| File | Tests | Covers |
|------|-------|--------|
| `test_login.py` | TC_LOGIN_01 to TC_LOGIN_09 | Login page load, email/password validation, valid login, invalid credentials, signup link, brand link, auth guard |
| `test_community.py` | TC_COMM_01 to TC_COMM_17 | Community listing, post detail, helpful voting, reactions, comments, create post form |
| `test_blog.py` | TC_BLOG_01 to TC_BLOG_11 | Blog listing, search, category filter, detail page content rendering, share, navigation |
| `test_resources.py` | TC_RES_01 to TC_RES_08 | Resources tabs, filtering, blog section, video modal |
| `test_schools.py` | TC_SCHOOL_01 to TC_SCHOOL_10 | School listing, cards, ratings, institution detail, reviews |
| `test_professionals.py` | TC_PROF_01 to TC_PROF_10 | Doctor listing, search, filters, booking modal |
| `test_appointments.py` | TC_APPT_01 to TC_APPT_08 | Appointment tabs, listing, empty state, navigation |
| `test_admin.py` | TC_ADMIN_01 to TC_ADMIN_10 | Admin access control, tabs, verification, reports |
| `test_signup.py` | TC_SIGNUP_01 to TC_SIGNUP_09 | Parent signup, doctor signup, validation |
| `test_navigation.py` | TC_NAV_01 to TC_NAV_10 | Navbar links, footer, theme toggle, auth redirects |
| `test_recommendations.py` | TC_REC_01 to TC_AI_05 | Recommendations page, AI chat widget |

---

## Test Results

Test results are printed to the console. A passing test shows `PASSED`, a failure shows `FAILED` with details.

To export results:
```bash
python -m pytest -v --junitxml=test-results.xml
```

---

## Notes

- Tests use `implicitly_wait(3)` and `WebDriverWait` with a 15-second timeout for reliable element detection.
- Tests that require authentication will log in automatically using the configured test credentials.
- If no blog posts exist in the database, tests will gracefully skip content checks.
- Tests may create temporary data (e.g., test posts). Use a development database.
- The AI chat widget tests require the widget to be visible (only for logged-in users).

---

## Troubleshooting

**Tests fail with "element not found"?**
- Ensure the app is running on the correct port
- Check `CAREBRIDGE_URL` environment variable
- Increase timeout values in `base_selenium.py`

**"Session not created" or ChromeDriver errors?**
- Update ChromeDriver to match your Chrome version
- Or install `webdriver-manager` and update `base_selenium.py`

**Login fails?**
- Verify test accounts exist
- Check environment variables
- Ensure the backend is running and the database connection is active
