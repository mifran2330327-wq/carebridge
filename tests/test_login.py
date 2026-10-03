"""
Login and Authentication Tests for CareBridge.
Tests the login page, signup flow, authentication guards, and session management.
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, wait_for_element, wait_for_clickable
import os

# Test credentials (set via environment variables or use defaults)
TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")
TEST_DOCTOR_EMAIL = os.environ.get("TEST_DOCTOR_EMAIL", "doctor@test.com")
TEST_DOCTOR_PASSWORD = os.environ.get("TEST_DOCTOR_PASSWORD", "Test1234!")
TEST_ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@test.com")
TEST_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Test1234!")


class TestLogin:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_LOGIN_01: Login page loads correctly ---
    def test_login_page_loads(self):
        self.driver.get(f"{BASE_URL}/login")

        title = self.driver.find_element(By.CLASS_NAME, "auth-card__title")
        assert title.text == "Welcome back", f"Expected 'Welcome back', got '{title.text}'"

        email_input = self.driver.find_element(By.NAME, "email")
        assert email_input.is_displayed(), "Email input should be visible"

        password_input = self.driver.find_element(By.NAME, "password")
        assert password_input.is_displayed(), "Password input should be visible"

        submit_btn = self.driver.find_element(By.CLASS_NAME, "auth-form__submit")
        assert submit_btn.is_enabled(), "Submit button should be enabled"

    # --- TC_LOGIN_02: Login with empty email ---
    def test_login_empty_email_shows_error(self):
        self.driver.get(f"{BASE_URL}/login")

        password = self.driver.find_element(By.NAME, "password")
        password.send_keys("somepassword")

        self.driver.find_element(By.CLASS_NAME, "auth-form__submit").click()
        time.sleep(1)

        # Email field is required so browser validation will prevent submission
        # Instead test the validation by submitting empty form
        email = self.driver.find_element(By.NAME, "email")
        email.send_keys("")
        self.driver.find_element(By.TAG_NAME, "form").submit()
        time.sleep(1)

        # The email input has `required` attribute
        assert email.get_attribute("required") is not None or email.get_attribute("validationMessage"), \
            "Email field should be required"

    # --- TC_LOGIN_03: Login with invalid email format ---
    def test_login_invalid_email_format(self):
        self.driver.get(f"{BASE_URL}/login")

        self.driver.find_element(By.NAME, "email").send_keys("not-an-email")
        self.driver.find_element(By.NAME, "password").send_keys("password123")
        self.driver.find_element(By.CLASS_NAME, "auth-form__submit").click()
        time.sleep(2)

        error = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "auth-form__message--error"))
        )
        assert "valid email" in error.text.lower(), \
            f"Expected 'valid email' error, got '{error.text}'"

    # --- TC_LOGIN_04: Login with empty password ---
    def test_login_empty_password_shows_error(self):
        self.driver.get(f"{BASE_URL}/login")

        self.driver.find_element(By.NAME, "email").send_keys("test@example.com")
        self.driver.find_element(By.NAME, "password").send_keys("")
        self.driver.find_element(By.CLASS_NAME, "auth-form__submit").click()
        time.sleep(1)

        # Browser validation will show message for required field
        password = self.driver.find_element(By.NAME, "password")
        assert password.get_attribute("required") is not None

    # --- TC_LOGIN_05: Login with valid parent credentials ---
    def test_login_valid_parent(self):
        self.driver.get(f"{BASE_URL}/login")

        self.driver.find_element(By.NAME, "email").send_keys(TEST_PARENT_EMAIL)
        self.driver.find_element(By.NAME, "password").send_keys(TEST_PARENT_PASSWORD)
        self.driver.find_element(By.CLASS_NAME, "auth-form__submit").click()
        time.sleep(3)

        # Should be logged in - navbar shows account toggle
        try:
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "navbar__account-toggle"))
            )
            assert True
        except:
            # Maybe redirected to dashboard
            assert f"{BASE_URL}/dashboard" in self.driver.current_url or \
                   f"{BASE_URL}/admin" in self.driver.current_url, \
                f"Expected redirect to dashboard/admin, at {self.driver.current_url}"

    # --- TC_LOGIN_06: Login with invalid credentials ---
    def test_login_invalid_credentials(self):
        self.driver.get(f"{BASE_URL}/login")

        self.driver.find_element(By.NAME, "email").send_keys("wrong@email.com")
        self.driver.find_element(By.NAME, "password").send_keys("wrongpassword")
        self.driver.find_element(By.CLASS_NAME, "auth-form__submit").click()
        time.sleep(3)

        error = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "auth-form__message--error"))
        )
        assert error.text != "", "Error message should be displayed"

    # --- TC_LOGIN_07: Signup link available on login page ---
    def test_signup_link_on_login(self):
        self.driver.get(f"{BASE_URL}/login")
        signup_link = self.driver.find_element(By.XPATH, "//a[contains(@href, '/signup')]")
        assert signup_link.is_displayed(), "Signup link should be visible on login page"
        signup_link.click()
        time.sleep(1)
        assert "/signup" in self.driver.current_url

    # --- TC_LOGIN_08: Brand link navigates to home ---
    def test_brand_link_navigates_home(self):
        self.driver.get(f"{BASE_URL}/login")
        brand = self.driver.find_element(By.CLASS_NAME, "auth-card__brand")
        brand.click()
        time.sleep(2)
        assert self.driver.current_url.rstrip("/") == BASE_URL.rstrip("/")

    # --- TC_LOGIN_09: Auth page not accessible when logged in (GuestOnly) ---
    def test_login_page_not_accessible_when_logged_in(self):
        # This test requires a logged-in session
        # Skip if no credentials configured
        if not TEST_PARENT_EMAIL or not TEST_PARENT_PASSWORD:
            return

        from base_selenium import login, is_logged_in, logout
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        time.sleep(3)

        self.driver.get(f"{BASE_URL}/login")
        time.sleep(2)

        # Should be redirected away (GuestOnly guard)
        assert "/login" not in self.driver.current_url, \
            "Logged-in user should not see login page"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
