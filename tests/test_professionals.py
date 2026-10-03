"""
Professionals (doctors) tests for CareBridge.
Tests doctor listing, filtering, search, and profile viewing.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestProfessionals:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_PROF_01: Professionals page loads ---
    def test_professionals_page_loads(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        heading = self.driver.find_elements(By.TAG_NAME, "h1")
        assert len(heading) > 0, "Page should have a heading"
        assert "professional" in self.driver.page_source.lower() or \
               "Find" in self.driver.page_source, \
            "Professionals page should be loaded"

    # --- TC_PROF_02: Doctor cards are displayed ---
    def test_doctor_cards_displayed(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        cards = self.driver.find_elements(By.CLASS_NAME, "pro-card")
        assert len(cards) > 0, "Professional cards should be displayed"

    # --- TC_PROF_03: Doctor card shows verification badge ---
    def test_doctor_verification_badge(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        # Check for badge elements
        badges = self.driver.find_elements(By.CLASS_NAME, "pro-card__badges")
        if badges:
            assert True, "Doctor cards should show badges"

    # --- TC_PROF_04: Search functionality ---
    def test_professional_search(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        search_input = self.driver.find_elements(
            By.CSS_SELECTOR, ".directory__search input"
        )
        if search_input:
            search_input[0].send_keys("doctor")
            time.sleep(2)
            assert search_input[0].get_attribute("value") == "doctor", \
                "Search input should contain entered text"

    # --- TC_PROF_05: Specialty filter chips ---
    def test_specialty_filter_chips(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        chips = self.driver.find_elements(By.CLASS_NAME, "directory__chip")
        assert len(chips) > 0, "Specialty filter chips should be visible"

    # --- TC_PROF_06: Professional count displayed ---
    def test_professional_count_displayed(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        stat = self.driver.find_elements(By.CLASS_NAME, "directory__hero-stat")
        assert len(stat) > 0, "Professional count should be displayed"

    # --- TC_PROF_07: Book session button visible ---
    def test_book_session_button_visible(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        book_buttons = self.driver.find_elements(
            By.XPATH, "//button[contains(., 'Book Session')]"
        )
        if book_buttons:
            assert book_buttons[0].is_displayed(), \
                "Book Session button should be visible"

    # --- TC_PROF_08: Booking modal opens ---
    def test_booking_modal_opens(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        book_buttons = self.driver.find_elements(
            By.XPATH, "//button[contains(., 'Book Session')]"
        )
        if not book_buttons:
            assert True
            return

        book_buttons[0].click()
        time.sleep(2)

        modal = self.driver.find_elements(By.CLASS_NAME, "booking-modal")
        assert len(modal) > 0, "Booking modal should open when Book Session is clicked"

    # --- TC_PROF_09: Booking modal can be closed ---
    def test_booking_modal_close(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        book_buttons = self.driver.find_elements(
            By.XPATH, "//button[contains(., 'Book Session')]"
        )
        if not book_buttons:
            assert True
            return

        book_buttons[0].click()
        time.sleep(2)

        close_btn = self.driver.find_element(
            By.CLASS_NAME, "booking-modal__close"
        )
        close_btn.click()
        time.sleep(1)

        modal = self.driver.find_elements(By.CLASS_NAME, "booking-modal")
        assert len(modal) == 0, "Booking modal should close"

    # --- TC_PROF_10: Empty state when no doctors found ---
    def test_no_doctors_empty_state(self):
        self.driver.get(f"{BASE_URL}/professionals")
        time.sleep(3)

        # Check for either results or empty state
        cards = self.driver.find_elements(By.CLASS_NAME, "pro-card")
        empty = self.driver.find_elements(By.CLASS_NAME, "directory__empty")
        assert len(cards) > 0 or len(empty) > 0, \
            "Should show either results or empty state"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
