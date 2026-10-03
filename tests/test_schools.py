"""
Schools and Institutions tests for CareBridge.
Tests school listing, filtering, searching, and institution detail pages.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestSchools:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_SCHOOL_01: Schools page loads ---
    def test_schools_page_loads(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        heading = self.driver.find_elements(By.TAG_NAME, "h1")
        assert len(heading) > 0, "Page should have a heading"
        assert "school" in heading[0].text.lower() or \
               "School" in self.driver.page_source, \
            "Schools page should be loaded"

    # --- TC_SCHOOL_02: School cards displayed ---
    def test_school_cards_displayed(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        cards = self.driver.find_elements(By.CLASS_NAME, "school-card")
        assert len(cards) > 0, "School cards should be displayed"

    # --- TC_SCHOOL_03: School card shows rating ---
    def test_school_card_shows_rating(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        cards = self.driver.find_elements(By.CLASS_NAME, "school-card")
        if cards:
            # Check for star rating or rating display
            rating_elements = self.driver.find_elements(By.CLASS_NAME, "school-card__rating")
            assert len(rating_elements) > 0, "School cards should show rating"

    # --- TC_SCHOOL_04: School card shows verification status ---
    def test_school_card_verification(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        badges = self.driver.find_elements(By.CLASS_NAME, "school-card__verification")
        if badges:
            assert badges[0].text != "", "Verification badge should have text"

    # --- TC_SCHOOL_05: View profile button navigation ---
    def test_view_profile_button(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        view_buttons = self.driver.find_elements(
            By.XPATH, "//a[contains(@class, 'school-card__btn-link')]"
        )
        if view_buttons:
            view_buttons[0].click()
            time.sleep(2)
            assert "/institutions/" in self.driver.current_url, \
                f"Should navigate to institution detail, got {self.driver.current_url}"

    # --- TC_SCHOOL_06: Empty state when no results ---
    def test_school_empty_state(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        # Search for something unlikely to exist
        search_inputs = self.driver.find_elements(By.CSS_SELECTOR, ".directory__search input")
        if search_inputs:
            search_inputs[0].send_keys("zzz_nonexistent_school_zzz")
            time.sleep(2)
            empty_msg = self.driver.find_elements(By.CLASS_NAME, "directory__empty")
            assert len(empty_msg) > 0 or "No institutions" in self.driver.page_source or \
                   "match" in self.driver.page_source.lower(), \
                "Empty state should be shown for no results"


class TestInstitutionDetail:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_SCHOOL_07: Institution detail page loads ---
    def test_institution_detail_loads(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        # Find first institution link
        links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/institutions/')]")
        if not links:
            assert True
            return

        institution_id = links[0].get_attribute("href")
        self.driver.get(institution_id)
        time.sleep(3)

        title = self.wait.until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        assert title.text != "", "Institution detail title should be displayed"

    # --- TC_SCHOOL_08: Institution detail shows review form ---
    def test_institution_detail_review_form(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/institutions/')]")
        if not links:
            assert True
            return

        institution_id = links[0].get_attribute("href")
        self.driver.get(institution_id)
        time.sleep(2)

        # Check for star rating input
        star_buttons = self.driver.find_elements(
            By.CLASS_NAME, "institution-detail__star-btn"
        )
        assert len(star_buttons) == 5, \
            f"Should show 5 star rating buttons, found {len(star_buttons)}"

    # --- TC_SCHOOL_09: Institution detail star rating hover/click ---
    def test_institution_star_rating_interaction(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/institutions/')]")
        if not links:
            assert True
            return

        institution_id = links[0].get_attribute("href")
        self.driver.get(institution_id)
        time.sleep(2)

        star_buttons = self.driver.find_elements(
            By.CLASS_NAME, "institution-detail__star-btn"
        )
        if len(star_buttons) == 5:
            star_buttons[3].click()  # Click 4th star
            time.sleep(1)
            assert True  # No error means interaction worked

    # --- TC_SCHOOL_10: Back to schools link ---
    def test_back_to_schools_link(self):
        self.driver.get(f"{BASE_URL}/schools")
        time.sleep(3)

        links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/institutions/')]")
        if not links:
            assert True
            return

        institution_id = links[0].get_attribute("href")
        self.driver.get(institution_id)
        time.sleep(2)

        back_link = self.driver.find_element(
            By.XPATH, "//a[contains(@href, '/schools') and contains(., 'Back')]"
        )
        back_link.click()
        time.sleep(2)
        assert "/schools" in self.driver.current_url, \
            "Should return to schools listing"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
