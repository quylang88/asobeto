from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Emulate iPhone 14 Pro
    context = browser.new_context(
        viewport={'width': 393, 'height': 852},
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    )
    page = context.new_page()

    # 1. Go to home
    page.goto("http://localhost:3000")

    # Wait for loading
    page.wait_for_timeout(2000)

    # Check Welcome Screen
    expect(page.get_by_role("button", name="BẮT ĐẦU")).to_be_visible()

    # Take screenshot of Welcome Screen
    page.screenshot(path="verification/welcome_screen.png")

    # 2. Navigate to World Map
    page.get_by_role("button", name="BẮT ĐẦU").click()

    # Wait for World Map
    expect(page.get_by_role("heading", name="Thế Giới Diệu Kỳ")).to_be_visible()

    # Take screenshot of World Map
    page.screenshot(path="verification/world_map.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
