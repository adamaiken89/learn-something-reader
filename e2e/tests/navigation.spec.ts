import { test, expect } from '../fixtures';

test.describe('Navigation flow', () => {
  test('full flow: CourseList → ModuleList → Lesson → back → ModuleList', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');

    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await expect(page.locator('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))')).toBeVisible();
    await expect(page.locator('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Variables"))')).toBeVisible();

    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await expect(page.locator('h2:has-text("What is Programming?")')).toBeVisible();

    await page.click('[data-testid="header-back"]');

    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await expect(page.locator('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Variables"))')).toBeVisible();
  });

  test('course-2 shows its own modules', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Advanced Algorithms")');
    await page.click('[data-testid="course-card"]:has-text("Advanced Algorithms")');

    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Complexity Analysis"))');
    await expect(page.locator('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Complexity Analysis"))')).toBeVisible();
    await expect(page.locator('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Sorting Algorithms"))')).toBeVisible();
    await expect(page.locator('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Graph Algorithms"))')).toBeVisible();

    await expect(page.locator('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))')).not.toBeVisible();
  });
});
