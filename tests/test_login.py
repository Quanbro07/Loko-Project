"""
Playwright sync test for login flow.

Usage:
  - Set env vars: BASE_URL, TEST_USER, TEST_PASS, EXPECTED_TITLE
  - Run: python tests/test_login.py

This script tries multiple common selectors for email/password and login button.
Adjust selectors if your app uses different attributes.
"""
import os
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
EXPECTED_TITLE = os.environ.get("EXPECTED_TITLE", "Dashboard")

# Khong hardcode tai khoan that trong source. Truyen qua bien moi truong:
#   TEST_USER=... TEST_PASS=... python tests/test_login.py
TEST_USER = os.environ.get("TEST_USER")
TEST_PASS = os.environ.get("TEST_PASS")
if not TEST_USER or not TEST_PASS:
    raise SystemExit(
        "Thieu bien moi truong TEST_USER / TEST_PASS. "
        "Vi du: TEST_USER=demo@example.com TEST_PASS=secret python tests/test_login.py"
    )


def fill_any(page, selectors, value):
    """Try a list of selectors and fill the first matching input."""
    for sel in selectors:
        try:
            locator = page.locator(sel)
            if locator.count() > 0:
                locator.first.fill(value)
                return True
        except Exception:
            # ignore selector errors and try next
            continue
    return False


def click_any(page, selectors):
    """Try clicking the first matching selector from list."""
    for sel in selectors:
        try:
            locator = page.locator(sel)
            if locator.count() > 0:
                locator.first.click()
                return True
        except Exception:
            continue
    return False


def test_login_flow(headless=True):
    with sync_playwright() as p:
        # Prefer local installed browsers if provided to avoid downloading Playwright binaries
        firefox_path = os.environ.get("FIREFOX_PATH")
        chrome_path = os.environ.get("CHROME_PATH")

        browser = None
        if firefox_path and os.path.exists(firefox_path):
            # Launch system Firefox
            browser = p.firefox.launch(headless=headless, executable_path=firefox_path)
        elif chrome_path and os.path.exists(chrome_path):
            # Launch system Chrome/Chromium
            browser = p.chromium.launch(headless=headless, executable_path=chrome_path)
        else:
            # Fallback: use Playwright's downloaded browser (may trigger download)
            browser = p.chromium.launch(headless=headless)

        context = browser.new_context()
        page = context.new_page()

        # Open the base URL (adjust to the login path if needed)
        page.goto(BASE_URL)
        print("Opened:", page.url)

        # Diagnostic: save screenshot and HTML to help debugging selectors
        try:
            screenshot_path = os.path.join(os.getcwd(), "tests", "login_debug.png")
            page.screenshot(path=screenshot_path, full_page=True)
            html_path = os.path.join(os.getcwd(), "tests", "login_debug.html")
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(page.content())
            print(f"Saved debug screenshot to {screenshot_path} and HTML to {html_path}")
        except Exception as e:
            print("Warning: could not save debug artifacts:", e)

        # Common selectors to try (edit if your app differs)
        email_selectors = [
            "input[name='email']",
            "input[name='username']",
            "input#email",
            "input[type='email']",
            "input[placeholder*='Email']",
            "input[placeholder*='email']",
            "input[placeholder*='E-mail']",
            "input[aria-label*='email']",
            "input[class*='email']",
            "input[id*='email']",
        ]
        # Try to open login modal/page by clicking navbar login/register buttons
        open_selectors = [
            "button.login-btn",
            "a.login-btn",
            "button:has-text('Đăng nhập')",
            "button:has-text('Login')",
            "text=Đăng nhập",
            "text=Login",
            "a:has-text('Đăng nhập')",
            "a:has-text('Login')",
        ]

        opened = click_any(page, open_selectors)
        if opened:
            try:
                # wait for any email input to appear
                page.wait_for_selector(
                    ",".join(email_selectors), timeout=3000
                )
            except PlaywrightTimeoutError:
                print("Opened login trigger but form did not appear quickly")
        else:
            # Try direct route fallback to /auth
            auth_url = BASE_URL.rstrip("/") + "/auth"
            print(f"Login trigger not found; navigating to {auth_url}")
            page.goto(auth_url)
            try:
                page.wait_for_selector(
                    ",".join(email_selectors), timeout=3000
                )
            except PlaywrightTimeoutError:
                print("Fallback /auth did not show login form")
        password_selectors = [
            "input[name='password']",
            "input#password",
            "input[type='password']",
            "input[name='passwd']",
            "input[placeholder*='Password']",
            "input[placeholder*='password']",
            "input[aria-label*='password']",
            "input[class*='password']",
            "input[id*='password']",
        ]
        login_button_selectors = [
            "button[type='submit']",
            "button:has-text('Đăng nhập')",
            "button:has-text('Login')",
            "text=Đăng nhập",
            "text=Login",
        ]

        filled_email = fill_any(page, email_selectors, TEST_USER)
        if not filled_email:
            print("Warning: email/username input not found with common selectors")

        filled_password = fill_any(page, password_selectors, TEST_PASS)
        if not filled_password:
            print("Warning: password input not found with common selectors")

        clicked = click_any(page, login_button_selectors)
        if not clicked:
            print("Warning: login button not found with common selectors; attempting press Enter")
            # If inputs are focused, try pressing Enter
            try:
                page.keyboard.press("Enter")
            except Exception:
                pass

        # Wait for navigation or network idle; SPA apps may not trigger a full navigation
        try:
            page.wait_for_load_state("networkidle", timeout=8000)
        except PlaywrightTimeoutError:
            # continue — networkidle may time out on some SPAs
            pass

        # Wait for title to update (some apps keep default 'React App' briefly)
        try:
            # wait until title includes EXPECTED_TITLE or differs from default 'React App'
            page.wait_for_function(
                "() => document.title && (document.title.includes(\"%s\") || document.title !== 'React App')"
                % EXPECTED_TITLE,
                timeout=5000,
            )
        except PlaywrightTimeoutError:
            # continue and assert later, but capture another screenshot
            try:
                page.screenshot(path=os.path.join(os.getcwd(), "tests", "login_after_click.png"), full_page=True)
            except Exception:
                pass

        # Optionally, you can wait for a specific selector that appears after login
        # page.wait_for_selector("text=Chào mừng", timeout=5000)

        actual_title = page.title()

        # Flexible success detection: title OR common logged-in selectors/URL
        success_selectors = [
            ".user-name",
            ".user-info",
            "button.logout-btn",
            "a.logout-btn",
            "text=Chào mừng",
            "text=Welcome",
            "text=Logout",
        ]

        success = False
        success_reason = None

        if actual_title == EXPECTED_TITLE:
            success = True
            success_reason = f"title == '{EXPECTED_TITLE}'"
        else:
            # check URL contains common dashboard paths
            url = page.url or ""
            if "/dashboard" in url or "/home" in url or "/app" in url:
                success = True
                success_reason = f"url contains dashboard-like path: {url}"
            else:
                # try to find any of the success selectors
                for sel in success_selectors:
                    try:
                        if page.locator(sel).count() > 0:
                            success = True
                            success_reason = f"found selector '{sel}'"
                            break
                    except Exception:
                        continue

        # close browser/context
        context.close()
        browser.close()

        if success:
            print("Login success detected:", success_reason)
        else:
            # save final artifacts to help debugging
            try:
                final_screenshot = os.path.join(os.getcwd(), "tests", "login_final.png")
                page.screenshot(path=final_screenshot, full_page=True)
                final_html = os.path.join(os.getcwd(), "tests", "login_final.html")
                with open(final_html, "w", encoding="utf-8") as f:
                    f.write(page.content())
                print(f"Saved final screenshot to {final_screenshot} and HTML to {final_html}")
            except Exception as e:
                print("Warning: could not save final artifacts:", e)
            raise AssertionError(f"Login not detected — title='{actual_title}', url='{page.url}'")


if __name__ == "__main__":
    # Run headless by default; set headless=False in local debugging
    try:
        test_login_flow(headless=True)
        print("OK: login test passed")
    except AssertionError as e:
        print("FAILED:", e)
        raise
    except Exception as e:
        print("ERROR:", e)
        raise
