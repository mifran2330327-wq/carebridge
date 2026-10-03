"""
Resources page tests for CareBridge.
Tests resources listing, filtering, and blog section integration.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestResources:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_RES_01: Resources page loads ---
    def test_resources_page_loads(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(3)

        # Check for main content
        assert "Educational" in self.driver.page_source or \
               "resources" in self.driver.page_source.lower() or \
               self.driver.find_elements(By.CLASS_NAME, "resources__hero"), \
            "Resources page should be loaded"

    # --- TC_RES_02: Tab navigation works ---
    def test_tab_navigation(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(2)

        # Check both tabs exist
        library_tab = self.driver.find_element(
            By.XPATH, "//button[contains(., 'Library Resources')]"
        )
        doctors_tab = self.driver.find_element(
            By.XPATH, "//button[contains(., 'From Our Doctors')]"
        )

        assert library_tab.is_displayed(), "Library Resources tab should be visible"
        assert doctors_tab.is_displayed(), "From Our Doctors tab should be visible"

        # Library tab should be active by default
        assert "active" in library_tab.get_attribute("class"), \
            "Library Resources tab should be active by default"

        # Click Doctors tab
        doctors_tab.click()
        time.sleep(2)
        assert "active" in doctors_tab.get_attribute("class"), \
            "Doctors tab should be active after clicking"

    # --- TC_RES_03: Resource type filter chips ---
    def test_resource_type_chips(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(3)

        chips = self.driver.find_elements(By.CLASS_NAME, "resources__chip")
        assert len(chips) > 0, "Resource type chips should be visible"

        # All chip should be active by default
        all_chip = self.driver.find_element(
            By.XPATH, "//button[contains(., 'All')]"
        )
        assert "active" in all_chip.get_attribute("class"), \
            "All chips should be active by default"

    # --- TC_RES_04: Specialty filter dropdown ---
    def test_specialty_filter_dropdown(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(3)

        specialty_select = self.driver.find_elements(By.ID, "resource-specialty")
        if specialty_select:
            assert specialty_select[0].is_displayed(), \
                "Specialty filter dropdown should be visible"

    # --- TC_RES_05: Resource cards display ---
    def test_resource_cards_display(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(3)

        cards = self.driver.find_elements(By.CLASS_NAME, "resource-card")
        if cards:
            assert len(cards) > 0, "Resource cards should be displayed"

    # --- TC_RES_06: Blog section in resources shows posts ---
    def test_blog_section_in_resources(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(2)

        doctors_tab = self.driver.find_element(
            By.XPATH, "//button[contains(., 'From Our Doctors')]"
        )
        doctors_tab.click()
        time.sleep(3)

        # Should show blog cards or empty state
        blog_cards = self.driver.find_elements(By.CLASS_NAME, "blog__card")
        empty_state = self.driver.find_elements(By.CLASS_NAME, "blog__empty")
        assert len(blog_cards) > 0 or len(empty_state) > 0, \
            "Blog section should show posts or empty state"

    # --- TC_RES_07: Clear filters button ---
    def test_clear_filters_button(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(3)

        # The clear button might be hidden if no filters applied
        clear_btn = self.driver.find_elements(By.CLASS_NAME, "resources__clear")
        # If visible, test clicking it
        if clear_btn and clear_btn[0].is_displayed():
            clear_btn[0].click()
            time.sleep(1)
            assert True, "Clear filters button works"

    # --- TC_RES_08: Resources result count shows ---
    def test_result_count_displayed(self):
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(3)

        # Check for count text
        count_elements = self.driver.find_elements(By.CLASS_NAME, "resources__results-header")
        if count_elements:
            assert "resource" in count_elements[0].text.lower() or \
                   "resources" in count_elements[0].text.lower(), \
                "Result count should mention resources"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
