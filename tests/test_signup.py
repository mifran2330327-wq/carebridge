"""
Signup flow tests for CareBridge.
Tests parent signup, doctor signup, and validation.
"""

import time
import random
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver

# Generate unique email for test
RANDOM_SUFFIX = random.randint(10000, 99999)
TEST_EMAIL = f"testuser{RANDOM_SUFFIX}@test.com"


class TestSignupParent:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_SIGNUP_01: Signup page loads ---
    def test_signup_page_loads(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(2)

        title = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "auth-card__title"))
        )
        assert title.text == "Create your account", \
            f"Expected 'Create your account', got '{title.text}'"

    # --- TC_SIGNUP_02: Parent role is selected by default ---
    def test_parent_role_selected(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(2)

        parent_btn = self.driver.find_element(
            By.XPATH, "//button[contains(., 'Parent')]"
        )
        assert "active" in parent_btn.get_attribute("class"), \
            "Parent role should be selected by default"

    # --- TC_SIGNUP_03: Parent signup with empty fields shows validation ---
    def test_parent_signup_empty_fields(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(2)

        # Submit without filling
        submit_btn = self.driver.find_element(
            By.XPATH, "//button[contains(., 'Create account')]"
        )
        submit_btn.click()
        time.sleep(1)

        # Name and email are required
        name_input = self.driver.find_element(By.NAME, "name")
        assert name_input.get_attribute("required") is not None, \
            "Name field should be required"

    # --- TC_SIGNUP_04: Parent signup with invalid email ---
    def test_parent_signup_invalid_email(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(2)

        self.driver.find_element(By.NAME, "name").send_keys("Test User")
        self.driver.find_element(By.NAME, "email").send_keys("not-an-email")
        self.driver.find_element(By.NAME, "password").send_keys("Password123!")
        self.driver.find_element(By.XPATH, "//button[contains(., 'Create account')]").click()
        time.sleep(2)

        error = self.driver.find_elements(By.CLASS_NAME, "auth-form__message--error")
        assert len(error) > 0, "Error message should be shown for invalid email"
        assert "valid email" in error[0].text.lower(), \
            f"Error should mention valid email, got '{error[0].text}'"

    # --- TC_SIGNUP_05: Parent signup with short password ---
    def test_parent_signup_short_password(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(2)

        self.driver.find_element(By.NAME, "name").send_keys("Test User")
        self.driver.find_element(By.NAME, "email").send_keys(f"shortpass{RANDOM_SUFFIX}@test.com")
        self.driver.find_element(By.NAME, "password").send_keys("short")

        # Check terms checkbox
        terms = self.driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
        if terms:
            terms[-1].click()

        self.driver.find_element(By.XPATH, "//button[contains(., 'Create account')]").click()
        time.sleep(2)

        error = self.driver.find_elements(By.CLASS_NAME, "auth-form__message--error")
        assert len(error) > 0, "Error message should be shown for short password"

    # --- TC_SIGNUP_06: Parent signup with valid data ---
    def test_parent_signup_valid(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(1)

        self.driver.find_element(By.NAME, "name").send_keys("Test Parent User")
        self.driver.find_element(By.NAME, "email").send_keys(TEST_EMAIL)
        self.driver.find_element(By.NAME, "password").send_keys("Password123!")

        # Check terms
        terms = self.driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
        if terms:
            terms[-1].click()

        self.driver.find_element(By.XPATH, "//button[contains(., 'Create account')]").click()
        time.sleep(4)

        # Should navigate or show success
        success = self.driver.find_elements(By.CLASS_NAME, "auth-form__message--success")
        assert len(success) > 0 or "dashboard" in self.driver.current_url, \
            "Parent signup should succeed"

    # --- TC_SIGNUP_07: Login link on signup page ---
    def test_login_link_on_signup(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(1)

        login_link = self.driver.find_element(
            By.XPATH, "//a[contains(@href, '/login')]"
        )
        login_link.click()
        time.sleep(2)
        assert "/login" in self.driver.current_url, \
            "Login link should navigate to login page"

    # --- TC_SIGNUP_08: Doctor role toggle ---
    def test_doctor_role_toggle(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(1)

        doctor_btn = self.driver.find_element(
            By.XPATH, "//button[contains(., 'Doctor / professional')]"
        )
        doctor_btn.click()
        time.sleep(1)

        assert "active" in doctor_btn.get_attribute("class"), \
            "Doctor role should be active after clicking"

        # Doctor-specific fields should appear
        self.driver.find_element(By.NAME, "location")
        self.driver.find_element(By.NAME, "nidNumber")

    # --- TC_SIGNUP_09: Doctor signup missing required fields ---
    def test_doctor_signup_missing_fields(self):
        self.driver.get(f"{BASE_URL}/signup")
        time.sleep(1)

        # Switch to doctor role
        self.driver.find_element(
            By.XPATH, "//button[contains(., 'Doctor / professional')]"
        ).click()
        time.sleep(1)

        # Fill only some fields
        self.driver.find_element(By.NAME, "name").send_keys("Dr. Test")
        self.driver.find_element(By.NAME, "email").send_keys(f"doctor{RANDOM_SUFFIX}@test.com")
        self.driver.find_element(By.NAME, "password").send_keys("Password123!")
        self.driver.find_element(By.NAME, "location").send_keys("Dhaka")

        # Check terms
        terms = self.driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
        if terms:
            terms[-1].click()

        self.driver.find_element(By.XPATH, "//button[contains(., 'Create account')]").click()
        time.sleep(2)

        error = self.driver.find_elements(By.CLASS_NAME, "auth-form__message--error")
        assert len(error) > 0, "Error should be shown for missing required doctor fields"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
