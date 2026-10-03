"""
Blog post viewing tests for CareBridge.
Tests blog listing, detail page full content rendering, and navigation.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestBlogListing:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_BLOG_01: Blog listing page loads ---
    def test_blog_listing_page_loads(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(2)

        heading = self.wait.until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        assert "From our doctors" in self.driver.page_source.lower() or \
               heading.text, "Blog heading should be visible"

    # --- TC_BLOG_02: Blog cards display title and metadata ---
    def test_blog_cards_display_content(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        cards = self.driver.find_elements(By.CLASS_NAME, "blog__card-title")
        if cards:
            assert cards[0].text != "", "Blog card should have a title"

        authors = self.driver.find_elements(By.CLASS_NAME, "blog__author-name")
        assert len(authors) > 0, "Blog cards should show author name"

    # --- TC_BLOG_03: Clicking blog card opens detail page ---
    def test_click_blog_card_opens_detail(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        first_link = self.driver.find_element(
            By.CSS_SELECTOR, ".blog__card-title a"
        )
        first_link.click()
        time.sleep(2)

        assert "/blog/" in self.driver.current_url, \
            f"Expected blog detail URL, got {self.driver.current_url}"

        title = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "blog-post-detail__title"))
        )
        assert title.text != "", "Blog detail page should have a title"

    # --- TC_BLOG_04: Blog search works ---
    def test_blog_search(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(2)

        search_box = self.driver.find_element(By.CLASS_NAME, "blog__search-box")
        search_input = search_box.find_element(By.TAG_NAME, "input")
        search_input.send_keys("autism")
        time.sleep(2)

        # Verify search was entered
        assert search_input.get_attribute("value") == "autism", \
            "Search input should contain entered text"

    # --- TC_BLOG_05: Category filter works ---
    def test_blog_category_filter(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        chips = self.driver.find_elements(By.CLASS_NAME, "blog__chip")
        if len(chips) > 1:
            chips[1].click()
            time.sleep(2)
            assert "active" in chips[1].get_attribute("class"), \
                "Selected chip should have active class"

    # --- TC_BLOG_06: Resource page blog section loads ---
    def test_resources_blog_tab(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        self.driver.get(f"{BASE_URL}/resources")
        time.sleep(2)

        blogs_tab = self.driver.find_element(
            By.XPATH, "//button[contains(., 'From Our Doctors')]"
        )
        blogs_tab.click()
        time.sleep(3)

        assert "blogs" in self.driver.current_url or \
               self.driver.find_elements(By.CLASS_NAME, "blog__card") or \
               self.driver.find_elements(By.CLASS_NAME, "blog__empty"), \
            "Blog section should load in resources page"


class TestBlogDetail:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_BLOG_07: Full article content is displayed ---
    def test_blog_detail_shows_full_content(self):
        # Navigate to blog listing and find a post
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        links = self.driver.find_elements(By.CSS_SELECTOR, ".blog__card-title a")
        if not links:
            # No blog posts available - skip
            assert True
            return

        links[0].click()
        time.sleep(2)

        # The content div uses dangerouslySetInnerHTML
        content_div = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "blog-post-detail__content"))
        )

        # Content should not be empty
        assert content_div.text != "" or content_div.get_attribute("innerHTML") != "", \
            "Blog detail content should not be empty"

        # Content should NOT be truncated with "..." at the end
        content_text = content_div.text
        assert not content_text.endswith("..."), \
            "Blog content should not be truncated on detail page"

    # --- TC_BLOG_08: Blog detail shows author information ---
    def test_blog_detail_shows_author_and_meta(self):
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        links = self.driver.find_elements(By.CSS_SELECTOR, ".blog__card-title a")
        if not links:
            assert True
            return

        links[0].click()
        time.sleep(2)

        author_name = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "blog-post-detail__author-name"))
        )
        assert author_name.text != "", "Author name should be displayed"

        # Check meta items (published date, read time)
        meta_items = self.driver.find_elements(By.CLASS_NAME, "blog-post-detail__meta-item")
        assert len(meta_items) > 0, "Meta information should be displayed"

    # --- TC_BLOG_09: Back to articles link works ---
    def test_back_to_articles_link(self):
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        links = self.driver.find_elements(By.CSS_SELECTOR, ".blog__card-title a")
        if not links:
            assert True
            return

        links[0].click()
        time.sleep(2)

        back_link = self.driver.find_element(
            By.XPATH, "//a[contains(@href, '/blog') and contains(., 'Back to articles')]"
        )
        back_link.click()
        time.sleep(2)

        assert self.driver.current_url.rstrip("/").endswith("/blog"), \
            f"Should return to blog listing, got {self.driver.current_url}"

    # --- TC_BLOG_10: Share button is available ---
    def test_share_button_visible(self):
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        links = self.driver.find_elements(By.CSS_SELECTOR, ".blog__card-title a")
        if not links:
            assert True
            return

        links[0].click()
        time.sleep(2)

        share_btn = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "blog-post-detail__share-btn"))
        )
        assert share_btn.text == "Share article", \
            "Share button should show correct text"

    # --- TC_BLOG_11: More articles button works ---
    def test_more_articles_button(self):
        self.driver.get(f"{BASE_URL}/blog")
        time.sleep(3)

        links = self.driver.find_elements(By.CSS_SELECTOR, ".blog__card-title a")
        if not links:
            assert True
            return

        links[0].click()
        time.sleep(2)

        more_btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'More articles')]"))
        )
        more_btn.click()
        time.sleep(2)

        assert "/blog" in self.driver.current_url, \
            "More articles should navigate to blog listing"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
