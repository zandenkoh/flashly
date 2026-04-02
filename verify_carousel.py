from playwright.sync_api import sync_playwright
import time
import os

def run_cuj(page):
    print("Navigating to index.html...")
    page.goto("http://localhost:8000/index.html")
    page.wait_for_timeout(2000) # Wait for Supabase fetch

    print("Checking if carousel exists...")
    carousel = page.locator("#landing-carousel")
    carousel.wait_for(state="visible", timeout=5000)
    print("Carousel is visible.")

    print("Scrolling to carousel...")
    carousel.scroll_into_view_if_needed()
    page.wait_for_timeout(1000)

    print("Taking screenshot of the carousel...")
    os.makedirs("/tmp/verification", exist_ok=True)
    page.screenshot(path="/tmp/verification/carousel2.png")

    print("Checking 'View more' button...")
    view_more_btn = page.locator(".lp-btn-ghost-cta", has_text="View more")
    view_more_btn.wait_for(state="visible", timeout=5000)
    print("'View more' button is visible.")

    print("Clicking 'View more' button...")
    view_more_btn.click()
    page.wait_for_timeout(2000)

    print("Taking screenshot after clicking View more...")
    page.screenshot(path="/tmp/verification/after_click2.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/tmp/verification/videos2",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
            print("Verification script completed successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
        finally:
            context.close()
            browser.close()
