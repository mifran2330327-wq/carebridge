"""
Appointment tests for CareBridge.
Tests appointment listing, booking, and navigation.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestAppointments:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_APPT_01: Appointments page loads ---
    def test_appointments_page_loads(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)

        heading = self.driver.find_elements(By.TAG_NAME, "h1")
        assert len(heading) > 0, "Page should have a heading"
        assert "appointment" in self.driver.page_source.lower(), \
            "Appointments page should be loaded"

    # --- TC_APPT_02: Tabs are visible ---
    def test_appointment_tabs_visible(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)

        tabs = self.driver.find_elements(By.CLASS_NAME, "appointments__tab")
        assert len(tabs) >= 2, "Should have at least 2 tabs (Upcoming/Past)"
        assert "Upcoming" in self.driver.page_source, "Upcoming tab should be visible"
        assert "Past" in self.driver.page_source, "Past tab should be visible"

    # --- TC_APPT_03: Upcoming tab is active by default ---
    def test_upcoming_tab_active(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(2)

        active_tab = self.driver.find_element(
            By.CLASS_NAME, "appointments__tab--active"
        )
        assert "Upcoming" in active_tab.text, \
            "Upcoming tab should be active by default"

    # --- TC_APPT_04: Book new appointment button ---
    def test_book_new_appointment_button(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)

        book_btn = self.driver.find_elements(
            By.XPATH, "//a[contains(@href, '/professionals')]"
        )
        assert len(book_btn) > 0, "Book new appointment button should be visible"

    # --- TC_APPT_05: Appointment items or empty state shown ---
    def test_appointment_items_or_empty(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)

        items = self.driver.find_elements(By.CLASS_NAME, "appointment-item")
        empty = self.driver.find_elements(By.CLASS_NAME, "appointments__empty")
        assert len(items) > 0 or len(empty) > 0, \
            "Should show either appointment items or empty state"

    # --- TC_APPT_06: Tab switching works ---
    def test_tab_switching(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)

        past_tab = self.driver.find_element(
            By.XPATH, "//button[contains(@class, 'appointments__tab') and contains(., 'Past')]"
        )
        past_tab.click()
        time.sleep(2)

        assert "active" in past_tab.get_attribute("class"), \
            "Past tab should be active after clicking"

    # --- TC_APPT_07: Appointment card shows status badge ---
    def test_status_badge_displayed(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)

        items = self.driver.find_elements(By.CLASS_NAME, "appointment-item")
        if items:
            status_badge = self.driver.find_elements(By.CLASS_NAME, "appointment-row__status")
            if status_badge:
                assert status_badge[0].text != "", \
                    "Status badge should have text"

    # --- TC_APPT_08: Back to professionals link ---
    def test_back_to_professionals(self):
        self.driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)

        back_link = self.driver.find_elements(
            By.XPATH, "//a[contains(@href, '/professionals')]"
        )
        if back_link:
            back_link[0].click()
            time.sleep(2)
            assert "professionals" in self.driver.current_url, \
                "Should navigate to professionals page"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
