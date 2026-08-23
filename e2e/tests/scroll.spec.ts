import { expect, test } from '../fixtures';

test.describe('Scroll behavior', () => {
  async function navigateToLesson(page: import('@playwright/test').Page) {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);
  }

  test('scrollTop increases after scroll', async ({ page }) => {
    await navigateToLesson(page);

    const scrollTop = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (!scroller) return -1;
      scroller.scrollTop = 500;
      return scroller.scrollTop;
    });

    expect(scrollTop).toBeGreaterThanOrEqual(500);
  });

  test('scrollToSection via manual scrollTop', async ({ page }) => {
    await navigateToLesson(page);

    await page.waitForTimeout(300);

    const scrolled = await page.evaluate(() => {
      const sectionLink = document.querySelector('[id="best-practices"]');
      if (!sectionLink) return 'section-not-found';

      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (!scroller) return 'scroller-not-found';

      const offset =
        sectionLink.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop -
        20;

      scroller.scrollTop = offset;
      return `scrolled-to-${scroller.scrollTop}`;
    });

    expect(scrolled).toContain('scrolled-to-');

    const finalScrollTop = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      return scroller ? scroller.scrollTop : -1;
    });

    expect(finalScrollTop).toBeGreaterThan(1000);
  });

  test('scroll position persists after StudyTools toggle', async ({ page }) => {
    await navigateToLesson(page);

    // Scroll first, then toggle tools
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (scroller) scroller.scrollTop = 500;
    });
    await page.waitForTimeout(300);

    const toggleBtn = page.locator(
      'button:has-text("Tools"), button[aria-label="Toggle tools"], [data-testid="toggle-tools"]'
    );
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }

    const afterScroll = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      return scroller ? scroller.scrollTop : -1;
    });

    expect(afterScroll).toBeGreaterThan(300);
  });
});
