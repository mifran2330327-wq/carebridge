"""
Pytest configuration for CareBridge Selenium tests.
Ensures tests/ directory is on the Python path so `from base_selenium import *` works.
"""
import sys
import os

# Add the tests directory to the path so test scripts can import base_selenium
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
