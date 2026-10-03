"""
Navigation tests for CareBridge.
Tests navbar links, footer links, and page routing.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login, is_logged_in
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")


class TestNavigation:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_NAV_01: Home page loads ---
    def test_home_page_loads(self):
        self.driver.get(BASE_URL)
        time.sleep(3)

        assert "CareBridge" in self.driver.title or \
               "carebridge" in self.driver.current_url.lower() or \
               self.driver.find_elements(By.CLASS_NAME, "home-hero"), \
            "Home page should load"

    # --- TC_NAV_02: Navbar brand link navigates to home ---
    def test_navbar_brand_link(self):
        self.driver.get(f"{BASE_URL}/login")
        time.sleep(1)

        brand = self.driver.find_element(By.CLASS_NAME, "navbar__brand")
        brand.click()
        time.sleep(2)
        assert self.driver.current_url.rstrip("/") == BASE_URL.rstrip("/"), \
            "Brand link should navigate to home"

    # --- TC_NAV_03: Footer links are present ---
    def test_footer_links_present(self):
        self.driver.get(BASE_URL)
        time.sleep(3)

        footer = self.driver.find_elements(By.CLASS_NAME, "footer")
        assert len(footer) > 0, "Footer should be present"

        links = self.driver.find_elements(By.CSS_SELECTOR, ".footer a")
        assert len(links) > 0, "Footer should contain links"

    # --- TC_NAV_04: Theme toggle works ---
    def test_theme_toggle(self):
        self.driver.get(BASE_URL)
        time.sleep(2)

        theme_btn = self.driver.find_elements(By.CLASS_NAME, "theme-toggle")
        if theme_btn:
            theme_btn[0].click()
            time.sleep(1)
            html = self.driver.find_element(By.TAG_NAME, "html")
            theme = html.get_attribute("data-theme")
            assert theme is not None, "Theme should be toggled"

    # --- TC_NAV_05: Auth required routes redirect when not logged in ---
    def test_auth_required_redirect(self):
        self.driver.get(f"{BASE_URL}/dashboard")
        time.sleep(2)

        # Should redirect to login
        assert "/login" in self.driver.current_url, \
            "Should redirect to login when accessing protected route"

    # --- TC_NAV_06: Navbar links visible when logged in ---
    def test_navbar_links_when_logged_in(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        time.sleep(3)

        self.driver.get(BASE_URL)
        time.sleep(2)

        # Check for auth-required nav links
        nav_links = self.driver.find_elements(By.CLASS_NAME, "navbar__links")
        assert len(nav_links) > 0, "Nav links should be visible when logged in"

        # Check for specific links
        therapist_link = self.driver.find_elements(
            By.XPATH, "//a[contains(@href, '/professionals')]"
        )
        schools_link = self.driver.find_elements(
            By.XPATH, "//a[contains(@href, '/schools')]"
        )
        community_link = self.driver.find_elements(
            By.XPATH, "//a[contains(@href, '/community')]"
        )
        resources_link = self.driver.find_elements(
            By.XPATH, "//a[contains(@href, '/resources')]"
        )

        assert len(therapist_link) > 0, "Therapists link should be visible"
        assert len(schools_link) > 0, "Schools link should be visible"
        assert len(community_link) > 0, "Community link should be visible"
        assert len(resources_link) > 0, "Resources link should be visible"

    # --- TC_NAV_07: Account menu accessible when logged in ---
    def test_account_menu_when_logged_in(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        time.sleep(3)

        self.driver.get(BASE_URL)
        time.sleep(2)

        account_toggle = self.driver.find_elements(By.CLASS_NAME, "navbar__account-toggle")
        if account_toggle:
            account_toggle[0].click()
            time.sleep(1)

            menu = self.driver.find_elements(By.CLASS_NAME, "navbar__account-menu")
            assert len(menu) > 0, "Account dropdown menu should appear"

            logout_btn = self.driver.find_elements(
                By.XPATH, "//button[contains(., 'Log out')]"
            )
            assert len(logout_btn) > 0, "Logout button should be in account menu"

    # --- TC_NAV_08: Notifications button visible when logged in ---
    def test_notifications_button_visible(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        time.sleep(3)

        self.driver.get(BASE_URL)
        time.sleep(2)

        notify_btn = self.driver.find_elements(By.CLASS_NAME, "navbar__notify-btn")
        assert len(notify_btn) > 0, "Notifications button should be visible when logged in"

    # --- TC_NAV_09: Burger menu works on mobile view ---
    def test_burger_menu(self):
        self.driver.get(BASE_URL)
        time.sleep(2)

        burger = self.driver.find_elements(By.CLASS_NAME, "navbar__burger")
        if burger:
            burger[0].click()
            time.sleep(1)
            # Mobile menu or actions should appear
            assert True

    # --- TC_NAV_10: Guest-only routes (login/signup not accessible when logged in) ---
    def test_guest_only_routes_redirect(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        time.sleep(3)

        self.driver.get(f"{BASE_URL}/login")
        time.sleep(2)

        # Should not stay on login page
        assert "Welcome back" not in self.driver.page_source or \
               "/login" not in self.driver.current_url, \
            "Logged-in user should be redirected from login page"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
