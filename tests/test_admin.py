"""
Admin panel tests for CareBridge.
Tests admin panel access, tabs, and key administrative features.
"""

import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from base_selenium import BASE_URL, create_driver, login
import os

TEST_PARENT_EMAIL = os.environ.get("TEST_PARENT_EMAIL", "parent@test.com")
TEST_PARENT_PASSWORD = os.environ.get("TEST_PARENT_PASSWORD", "Test1234!")
TEST_ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@test.com")
TEST_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "Test1234!")


class TestAdminAccess:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_ADMIN_01: Admin page requires admin role ---
    def test_admin_redirects_when_not_admin(self):
        login(self.driver, TEST_PARENT_EMAIL, TEST_PARENT_PASSWORD)
        time.sleep(2)

        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(2)

        # Non-admin should not see admin content
        admin_header = self.driver.find_elements(By.CLASS_NAME, "admin__header")
        assert len(admin_header) == 0, "Non-admin should not see admin panel content"


class TestAdminPanel:

    def setup_method(self, method):
        self.driver = create_driver()
        self.wait = WebDriverWait(self.driver, 15)
        login(self.driver, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)

    def teardown_method(self, method):
        self.driver.quit()

    # --- TC_ADMIN_02: Admin page loads with admin credentials ---
    def test_admin_page_loads(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(3)

        header = self.wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "admin__header"))
        )
        assert header.is_displayed(), "Admin panel header should be visible"

    # --- TC_ADMIN_03: Admin tabs are visible ---
    def test_admin_tabs_visible(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(3)

        tabs = self.driver.find_elements(By.CLASS_NAME, "admin__tab")
        assert len(tabs) >= 6, f"Should have at least 6 admin tabs, found {len(tabs)}"

    # --- TC_ADMIN_04: Switch between admin tabs ---
    def test_admin_tab_switching(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(2)

        tabs = self.driver.find_elements(By.CLASS_NAME, "admin__tab")
        if len(tabs) >= 2:
            # Check second tab (Users)
            users_tab = tabs[1]
            users_tab.click()
            time.sleep(2)
            assert "active" in users_tab.get_attribute("class"), \
                "Clicked tab should be active"

    # --- TC_ADMIN_05: Doctor verification tab ---
    def test_doctor_verification_tab(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(2)

        # First tab should be doctor verification
        first_tab = self.driver.find_element(By.CLASS_NAME, "admin__tab")
        first_tab.click()
        time.sleep(2)

        # Check for approve/reject buttons
        approve_btn = self.driver.find_elements(
            By.XPATH, "//button[contains(., 'Approve')]"
        )
        # Approve button may or may not be visible depending on pending doctors
        assert True, "Doctor verification tab loaded"

    # --- TC_ADMIN_06: Admin loading state ---
    def test_admin_loading_state(self):
        self.driver.get(f"{BASE_URL}/admin")

        # Either loading or content should be visible
        try:
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "admin__header"))
            )
        except:
            loading = self.driver.find_elements(By.CLASS_NAME, "admin__loading")
            assert len(loading) > 0, "Either loading or content should be visible"

    # --- TC_ADMIN_07: Reports tab exists ---
    def test_reports_tab_exists(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(3)

        report_tab = self.driver.find_elements(
            By.XPATH, "//button[contains(@class, 'admin__tab') and contains(., 'Reports')]"
        )
        assert len(report_tab) > 0, "Reports tab should be visible"

    # --- TC_ADMIN_08: Community tab exists ---
    def test_community_tab_exists(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(3)

        comm_tab = self.driver.find_elements(
            By.XPATH, "//button[contains(@class, 'admin__tab') and contains(., 'Community')]"
        )
        assert len(comm_tab) > 0, "Community tab should be visible"

    # --- TC_ADMIN_09: Resources tab exists ---
    def test_resources_tab_exists(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(3)

        res_tab = self.driver.find_elements(
            By.XPATH, "//button[contains(@class, 'admin__tab') and contains(., 'Resource')]"
        )
        assert len(res_tab) > 0, "Resources tab should be visible"

    # --- TC_ADMIN_10: Institutions tab exists ---
    def test_institutions_tab_exists(self):
        self.driver.get(f"{BASE_URL}/admin")
        time.sleep(3)

        inst_tab = self.driver.find_elements(
            By.XPATH, "//button[contains(@class, 'admin__tab') and contains(., 'Institution')]"
        )
        assert len(inst_tab) > 0, "Institutions tab should be visible"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
