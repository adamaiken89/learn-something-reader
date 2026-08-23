import { test, expect } from '../fixtures';

test.describe('Visual regression', () => {
  test('CourseList page', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('course-list.png', { maxDiffPixels: 200 });
  });

  test('ModuleList page', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('module-list.png', { maxDiffPixels: 200 });
  });

  test('Lesson page top', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('lesson-top.png', { maxDiffPixels: 200 });
  });

  test('Lesson page scrolled down', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const scroller = document.querySelector('.overflow-y-auto') as HTMLElement;
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('lesson-bottom.png', { maxDiffPixels: 200 });
  });

  test('Quiz page', async ({ page }) => {
    // Quiz engine shuffles questions (Fisher-Yates) — pin RNG for stable snapshot.
    // Fixture already navigated, so register + reload to inject before app boots.
    await page.addInitScript(() => {
      Math.random = () => 0.999;
    });
    await page.reload();
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);
    // Quiz lives in a toolbar popover (Quiz → MCQ item)
    await page.click('[data-testid="quiz-popover-trigger"]');
    await page.click('[data-testid="quiz-start-mcq"]');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('quiz.png', { maxDiffPixels: 200 });
  });
});
