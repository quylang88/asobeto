import { test, expect } from '@playwright/test';

test('click floor 1 and 2', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3001');

  // Wait for hydration
  await page.waitForTimeout(3000);

  // Click Start Button if exists
  const startBtn = page.getByRole('button', { name: 'BẮT ĐẦU' });
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(1000);
  }

  // Click World 1
  await page.getByText('Đảo Chữ Cái').click({ force: true });
  await page.waitForTimeout(1000);

  // Click Tower 1
  await page.getByText('A-D').first().click({ force: true });
  await page.waitForTimeout(1000);

  // Try to click Floor 1
  console.log('Attempting to click Floor 1...');
  const floor1 = page.locator('button').filter({ hasText: 'Khởi đầu hành trình' });
  await expect(floor1).toBeVisible();
  await floor1.click();
  await page.waitForTimeout(1000);

  // Verify we are in lesson (check for unique text in Lesson 1)
  await expect(page.getByText('Làm Quen Chữ A')).toBeVisible({ timeout: 5000 });

  // Go back
  await page.getByRole('button').first().click(); // Assuming close button is first
  await page.waitForTimeout(1000);

  // Try to click Floor 2
  console.log('Attempting to click Floor 2...');
  const floor2 = page.locator('button').filter({ hasText: 'Chữ a trăng khuyết trên đầu' });
  await expect(floor2).toBeVisible();
  await floor2.click();
  await page.waitForTimeout(1000);

  // Verify we are in lesson (check for unique text in Lesson 2)
  await expect(page.getByRole('heading', { name: 'Chữ Ă', exact: true })).toBeVisible();
});
