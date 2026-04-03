from playwright.sync_api import sync_playwright

def test_today_view(page):
    # Navigate to local server
    page.goto("http://localhost:3000/")
    # Wait for page to load
    page.wait_for_load_state("networkidle")

    # We should see the loading overlay initially
    page.screenshot(path="verification_loading.png")

    print("Page loaded")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_today_view(page)
        finally:
            browser.close()
