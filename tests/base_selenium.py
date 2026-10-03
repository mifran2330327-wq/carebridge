"""
Base Selenium test setup for CareBridge.
Provides the WebDriver instance and common helper methods.
All other test scripts import from this base.

Usage:
    python tests/test_login.py
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

BASE_URL = os.environ.get("CAREBRIDGE_URL", "http://localhost:5174")
TIMEOUT = 15


def create_driver():
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # Comment out the next line to see the browser in action
    # chrome_options.add_argument("--headless")
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(3)
    return driver


def wait_for_element(driver, by, value, timeout=TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def wait_for_clickable(driver, by, value, timeout=TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.element_to_be_clickable((by, value))
    )


def wait_for_visible(driver, by, value, timeout=TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, value))
    )


def login(driver, email, password):
    driver.get(f"{BASE_URL}/login")
    wait_for_element(driver, By.NAME, "email")
    driver.find_element(By.NAME, "email").clear()
    driver.find_element(By.NAME, "email").send_keys(email)
    driver.find_element(By.NAME, "password").clear()
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.CLASS_NAME, "auth-form__submit").click()
    time.sleep(2)


def is_logged_in(driver):
    try:
        driver.find_element(By.CLASS_NAME, "navbar__account-toggle")
        return True
    except NoSuchElementException:
        return False


def logout(driver):
    try:
        account_toggle = driver.find_element(By.CLASS_NAME, "navbar__account-toggle")
        account_toggle.click()
        time.sleep(1)
        logout_btn = driver.find_element(By.XPATH, "//button[contains(., 'Log out')]")
        logout_btn.click()
        time.sleep(2)
    except (NoSuchElementException, TimeoutException):
        pass
