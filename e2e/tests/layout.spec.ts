import { test, expect } from '../fixtures';

test.describe('Layout invariants', () => {
  test('PageContent has flex flex-col classes', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForTimeout(300);

    const hasFlexCol = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="page-content"]');
      if (!el) return false;
      const cls = el.className;
      return cls.includes('flex') && cls.includes('flex-col');
    });

    expect(hasFlexCol).toBe(true);
  });

  test('contentRef has overflow-y-auto', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);

    const hasOverflow = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]');
      if (!scroller) return false;
      return scroller.className.includes('overflow-y-auto');
    });

    expect(hasOverflow).toBe(true);
  });

  test('contentRef scrollHeight > clientHeight (content overflows)', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);

    const overflows = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (!scroller) return false;
      return scroller.scrollHeight > scroller.clientHeight + 10;
    });

    expect(overflows).toBe(true);
  });

  test('scroll assignment works on contentRef', async ({ page }) => {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);

    const result = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (!scroller) return 'no-scroller';
      scroller.scrollTop = 200;
      return scroller.scrollTop === 200 ? 'ok' : `got-${scroller.scrollTop}`;
    });

    expect(result).toBe('ok');
  });
});
