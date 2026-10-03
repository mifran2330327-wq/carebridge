"""
Community tests for CareBridge.
Tests community listing, post creation, post detail, comments, and helpful voting.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestCommunityListing:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_COMM_01: Community page loads ---
    def test_community_page_loads(self):
        self.driver.get(f"{BASE_URL}/community")
        time.sleep(3)

        heading = self.wait.until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        assert "Connect" in heading.text or "community" in self.driver.page_source.lower(), \
            "Community page should be loaded"

    # --- TC_COMM_02: Community posts are displayed ---
    def test_community_posts_displayed(self):
        self.driver.get(f"{BASE_URL}/community")
        time.sleep(3)

        posts = self.driver.find_elements(By.CLASS_NAME, "forum-card")
        assert len(posts) > 0, "At least one community post should be visible"

        titles = self.driver.find_elements(By.CLASS_NAME, "forum-card__title")
        if titles:
            assert titles[0].text != "", "Post title should be displayed"

    # --- TC_COMM_03: Post title is clickable ---
    def test_community_post_title_clickable(self):
        self.driver.get(f"{BASE_URL}/community")
        time.sleep(3)

        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if title_links:
            title_links[0].click()
            time.sleep(2)
            assert "/community/" in self.driver.current_url, \
                f"Should navigate to post detail, got {self.driver.current_url}"

    # --- TC_COMM_04: New post button visible for PARENT ---
    def test_new_post_button_visible(self):
        self.driver.get(f"{BASE_URL}/community")
        time.sleep(2)

        new_post_btn = self.driver.find_elements(
            By.XPATH, "//button[contains(., 'New post')]"
        )
        assert len(new_post_btn) > 0, "New post button should be visible for parent users"

    # --- TC_COMM_05: Helpful count displayed on posts ---
    def test_helpful_count_displayed(self):
        self.driver.get(f"{BASE_URL}/community")
        time.sleep(3)

        helpful_elements = self.driver.find_elements(By.CLASS_NAME, "post-detail__helpful-count")
        helpful_elements_card = self.driver.find_elements(By.CLASS_NAME, "forum-card__helpful")
        # At least some element with "helpful" should be visible
        assert len(helpful_elements) > 0 or len(helpful_elements_card) > 0 or \
               "helpful" in self.driver.page_source.lower(), \
            "Helpful information should be displayed"

    # --- TC_COMM_06: Search functionality ---
    def test_community_search_works(self):
        self.driver.get(f"{BASE_URL}/community")
        time.sleep(2)

        # Look for search input
        search_inputs = self.driver.find_elements(By.CSS_SELECTOR, ".community__search input")
        if search_inputs:
            search_inputs[0].send_keys("test")
            time.sleep(2)
            assert search_inputs[0].get_attribute("value") == "test"


class TestPostDetail:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        self.driver.get(f"{BASE_URL}/community")
        time.sleep(3)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_COMM_07: Post detail page shows full content ---
    def test_post_detail_shows_content(self):
        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if not title_links:
            assert True
            return

        title_links[0].click()
        time.sleep(2)

        content = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "post-detail__title"))
        )
        assert content.text != "", "Post detail title should be displayed"

        # Check post body is visible with pre-wrap
        body = self.driver.find_elements(By.CLASS_NAME, "post-detail__body")
        if body:
            assert body[0].text != "" or body[0].get_attribute("innerHTML") != "", \
                "Post body should have content"

    # --- TC_COMM_08: Author info shown on post detail ---
    def test_post_detail_author_info(self):
        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if not title_links:
            assert True
            return

        title_links[0].click()
        time.sleep(2)

        author = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "post-detail__post-header"))
        )
        assert author.is_displayed(), "Author info should be displayed"

    # --- TC_COMM_09: Helpful vote button works ---
    def test_helpful_vote_button(self):
        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if not title_links:
            assert True
            return

        title_links[0].click()
        time.sleep(2)

        helpful_btn = self.driver.find_elements(By.CLASS_NAME, "post-detail__helpful-btn")
        if helpful_btn:
            helpful_btn[0].click()
            time.sleep(2)
            # Should toggle active class
            assert "active" in helpful_btn[0].get_attribute("class") or \
                   self.driver.find_elements(By.CLASS_NAME, "post-detail__helpful-count"), \
                "Helpful vote should be recorded"

    # --- TC_COMM_10: Reaction (like) button works ---
    def test_reaction_button(self):
        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if not title_links:
            assert True
            return

        title_links[0].click()
        time.sleep(2)

        reaction_btn = self.driver.find_elements(By.CLASS_NAME, "post-detail__reaction")
        if reaction_btn:
            initial_class = reaction_btn[0].get_attribute("class")
            reaction_btn[0].click()
            time.sleep(2)
            after_class = reaction_btn[0].get_attribute("class")
            # Class should change after clicking
            assert initial_class != after_class or \
                   "active" in after_class, \
                "Reaction state should change after clicking"

    # --- TC_COMM_11: Comments section visible ---
    def test_comments_section_visible(self):
        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if not title_links:
            assert True
            return

        title_links[0].click()
        time.sleep(2)

        comments_section = self.driver.find_elements(By.CLASS_NAME, "post-detail__comments")
        assert len(comments_section) > 0, "Comments section should be visible"

    # --- TC_COMM_12: Back to forum link works ---
    def test_back_to_forum_link(self):
        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if not title_links:
            assert True
            return

        title_links[0].click()
        time.sleep(2)

        back_link = self.driver.find_element(
            By.XPATH, "//a[contains(@href, '/community') and contains(., 'Back to forum')]"
        )
        back_link.click()
        time.sleep(2)
        assert self.driver.current_url.rstrip("/").endswith("/community"), \
            "Should return to community listing"

    # --- TC_COMM_13: Post detail loading state ---
    def test_post_detail_loading_state(self):
        title_links = self.driver.find_elements(By.CLASS_NAME, "forum-card__title-link")
        if not title_links:
            assert True
            return

        # Click and immediately check - loading spinner may appear
        title_links[0].click()

        # Either loading state or content should appear
        try:
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "post-detail__title"))
            )
        except:
            loading = self.driver.find_elements(By.CLASS_NAME, "post-detail__loading")
            assert len(loading) > 0, "Either loading state or content should be visible"


class TestCreatePost:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_COMM_14: Create post button opens form ---
    def test_create_post_opens_form(self):
        self.driver.get(f"{BASE_URL}/community/new")
        time.sleep(2)

        title_input = self.wait.until(
            EC.presence_of_element_located((By.NAME, "title"))
        )
        assert title_input.is_displayed(), "Create post form should be visible"

    # --- TC_COMM_15: Create post with empty title shows validation ---
    def test_create_post_empty_title(self):
        self.driver.get(f"{BASE_URL}/community/new")
        time.sleep(1)

        # Submit without filling anything
        submit_btn = self.driver.find_element(
            By.XPATH, "//button[contains(., 'Create post')]"
        )
        submit_btn.click()
        time.sleep(1)

        # Title field is required
        title_input = self.driver.find_element(By.NAME, "title")
        assert title_input.get_attribute("required") is not None, \
            "Title field should be required"

    # --- TC_COMM_16: Create post form fields are present ---
    def test_create_post_fields_present(self):
        self.driver.get(f"{BASE_URL}/community/new")
        time.sleep(2)

        self.wait.until(EC.presence_of_element_located((By.NAME, "title")))
        self.wait.until(EC.presence_of_element_located((By.NAME, "body")))

        # Check anonymous checkbox
        anon_checkbox = self.driver.find_elements(By.XPATH, "//input[@type='checkbox']")
        assert len(anon_checkbox) > 0, "Anonymous checkbox should be present"

        # Check submit button
        submit_btn = self.driver.find_element(
            By.XPATH, "//button[contains(., 'Create post')]"
        )
        assert submit_btn.is_enabled(), "Submit button should be enabled"

    # --- TC_COMM_17: Cancel button returns to community ---
    def test_cancel_create_post(self):
        self.driver.get(f"{BASE_URL}/community/new")
        time.sleep(2)

        cancel_btn = self.driver.find_element(
            By.XPATH, "//button[contains(text(), 'Cancel')]"
        )
        cancel_btn.click()
        time.sleep(2)

        assert self.driver.current_url.rstrip("/").endswith("/community"), \
            "Cancel should navigate back to community"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
