import os
import glob
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/about/index.html")
    page.wait_for_timeout(1000)

    # Click the "Library" link in the nav
    page.get_by_role("link", name="Library").first.click()
    page.wait_for_timeout(4000)

    # We should now be on index.html?auth=guest_library and notes view should be visible
    page.screenshot(path="/home/jules/verification/screenshots/verification_library_tab.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    # clear old videos
    for f in glob.glob("/home/jules/verification/videos/*.webm"):
        os.remove(f)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={"width": 1280, "height": 720}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()

    videos = glob.glob("/home/jules/verification/videos/*.webm")
    if videos:
        print(f"Video saved to {videos[0]}")
