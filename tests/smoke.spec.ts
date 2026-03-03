import { test, expect } from '@playwright/test';

test('homepage loads and shows title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SentientAI|AntiGravity|Swagbucks/i);
  await expect(page.locator('text=Control Panel')).toBeVisible();
});
