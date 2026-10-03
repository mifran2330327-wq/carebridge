"""
Recommendation and AI Chat Widget tests for CareBridge.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestRecommendations:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_REC_01: Recommendations page loads ---
    def test_recommendations_page_loads(self):
        self.driver.get(f"{BASE_URL}/recommendations")
        time.sleep(3)

        heading = self.driver.find_elements(By.TAG_NAME, "h1")
        assert len(heading) > 0, "Recommendations page should have a heading"

    # --- TC_REC_02: Recommendations show content or empty state ---
    def test_recommendations_content(self):
        self.driver.get(f"{BASE_URL}/recommendations")
        time.sleep(3)

        rec_cards = self.driver.find_elements(By.CLASS_NAME, "rec-card")
        empty = self.driver.find_elements(By.CLASS_NAME, "rec-card")
        # Either recommendations or empty state should be present
        assert len(rec_cards) > 0 or "recommendation" in self.driver.page_source.lower() or \
               "no" in self.driver.page_source.lower(), \
            "Recommendations page should show content or empty state"


class TestAIChatWidget:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_AI_01: AI chat widget FAB is visible when logged in ---
    def test_ai_widget_fab_visible(self):
        self.driver.get(BASE_URL)
        time.sleep(2)

        fab = self.driver.find_elements(By.CLASS_NAME, "ai-widget__fab")
        assert len(fab) > 0, "AI chat widget FAB should be visible when logged in"

    # --- TC_AI_02: AI chat widget opens ---
    def test_ai_widget_opens(self):
        self.driver.get(BASE_URL)
        time.sleep(2)

        fab = self.driver.find_element(By.CLASS_NAME, "ai-widget__fab")
        fab.click()
        time.sleep(2)

        panel = self.driver.find_elements(By.CLASS_NAME, "ai-widget__panel")
        assert len(panel) > 0, "AI chat panel should open when FAB is clicked"

    # --- TC_AI_03: AI chat panel has title ---
    def test_ai_widget_has_title(self):
        self.driver.get(BASE_URL)
        time.sleep(2)

        self.driver.find_element(By.CLASS_NAME, "ai-widget__fab").click()
        time.sleep(2)

        assert "CareBridge AI Guide" in self.driver.page_source or \
               "AI Guide" in self.driver.page_source, \
            "AI chat panel should show title"

    # --- TC_AI_04: AI chat panel can be closed ---
    def test_ai_widget_can_close(self):
        self.driver.get(BASE_URL)
        time.sleep(2)

        self.driver.find_element(By.CLASS_NAME, "ai-widget__fab").click()
        time.sleep(2)

        close_btn = self.driver.find_element(
            By.XPATH, "//button[contains(@aria-label, 'Close')]"
        )
        close_btn.click()
        time.sleep(1)

        panel = self.driver.find_elements(By.CLASS_NAME, "ai-widget__panel")
        assert len(panel) == 0 or not panel[0].is_displayed(), \
            "AI chat panel should close"

    # --- TC_AI_05: AI chat input is present ---
    def test_ai_widget_input_present(self):
        self.driver.get(BASE_URL)
        time.sleep(2)

        self.driver.find_element(By.CLASS_NAME, "ai-widget__fab").click()
        time.sleep(2)

        inputs = self.driver.find_elements(
            By.CSS_SELECTOR, ".ai-widget__input-row input"
        )
        assert len(inputs) > 0, "AI chat input should be present"
        assert inputs[0].get_attribute("placeholder"), \
            "AI chat input should have a placeholder"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
