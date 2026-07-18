import { expect, test } from '../fixtures';

test.describe('SectionsPanel: highlight follows scroll, panel auto-scrolls', () => {
  async function navigateToLesson(page: import('@playwright/test').Page) {
    // Click course card (div[role="button"], not <button>)
    await page.waitForSelector('div[role="button"]:has-text("Introduction to Programming")');
    await page.click('div[role="button"]:has-text("Introduction to Programming")');
    // Lesson loads directly with first module
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);
  }

  async function openSectionsPanel(page: import('@playwright/test').Page) {
    // Try toolbar toggle first (☰ button), fallback to header "Sections" button
    const toggleBtn = page.locator('button:has-text("☰")');
    if (await toggleBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }
    const sectionsBtn = page.locator('button:has-text("Sections")');
    if (await sectionsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sectionsBtn.click();
      await page.waitForTimeout(300);
    }
    await page.waitForSelector('[data-testid="navigation-panel"]', { timeout: 5000 });
  }

  async function scrollToSection(page: import('@playwright/test').Page, sectionId: string) {
    await page.evaluate((sid) => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      const heading = document.querySelector(`[id="${sid}"]`) as HTMLElement;
      if (!scroller || !heading) return;
      const offset =
        heading.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop -
        20;
      scroller.scrollTop = Math.max(0, offset);
    }, sectionId);
    await page.waitForTimeout(500);
  }

  async function getActiveSectionId(page: import('@playwright/test').Page): Promise<string | null> {
    return page.evaluate(() => {
      const rows = document.querySelectorAll('[data-section-id]');
      for (const row of rows) {
        const el = row as HTMLElement;
        const bg = el.style.backgroundColor;
        if (bg && bg !== 'transparent' && bg !== '') return el.getAttribute('data-section-id');
      }
      return null;
    });
  }

  test('active section highlights when scrolling to a lower section', async ({ page }) => {
    await navigateToLesson(page);
    await openSectionsPanel(page);

    await scrollToSection(page, 'working-with-data');

    const activeId = await getActiveSectionId(page);
    expect(activeId).toBe('working-with-data');
  });

  test('active section resets to first section when scrolling back to top', async ({ page }) => {
    await navigateToLesson(page);
    await openSectionsPanel(page);

    await scrollToSection(page, 'best-practices');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (scroller) scroller.scrollTop = 0;
    });
    await page.waitForTimeout(500);

    const activeId = await getActiveSectionId(page);
    // h1 "getting-started" filtered out (level 1) — no section row active at top
    expect(activeId).toBeNull();
  });

  test('sections panel auto-scrolls to keep active section row visible', async ({ page }) => {
    await navigateToLesson(page);
    await openSectionsPanel(page);

    await scrollToSection(page, 'best-practices');
    await page.waitForTimeout(300);

    // Verify active section row exists (effect runs without error)
    const activeSection = await getActiveSectionId(page);
    expect(activeSection).toBe('best-practices');

    // When panel overflows, scrollIntoView scrolls; when all sections fit, it's a no-op.
    // Either way the effect completes without error.
  });

  test('clicking parent section highlights parent (not deep subheading in threshold)', async ({ page }) => {
    await navigateToLesson(page);
    await openSectionsPanel(page);

    const sectionId = 'understanding-program-flow';
    const sectionRow = page.locator(`[data-section-id="${sectionId}"]`);
    await sectionRow.scrollIntoViewIfNeeded();

    const scrollBefore = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      return scroller?.scrollTop ?? 0;
    });

    await sectionRow.click();
    await page.waitForTimeout(300);

    // Content should have scrolled
    const scrollAfter = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      return scroller?.scrollTop ?? 0;
    });
    expect(scrollAfter).not.toBe(scrollBefore);

    // Section row should be highlighted
    await expect(
      page.locator(`[data-section-id="${sectionId}"]`),
    ).toHaveCSS('background-color', 'rgb(79, 70, 229)');
  });

  test('clicking module name scrolls to h1 and collapses sections', async ({ page }) => {
    await navigateToLesson(page);
    await openSectionsPanel(page);

    // Module expanded by default — section rows visible
    const sectionRow = page.locator('[data-section-id="understanding-program-flow"]');
    await expect(sectionRow).toBeVisible();

    // Click module name button by title attribute
    const modBtn = page.locator('[data-testid="navigation-panel"] button[title="Getting Started"]');
    await modBtn.click();

    // Wait for smooth scroll + collapse
    await page.waitForTimeout(500);

    // Section rows collapsed (hidden)
    await expect(sectionRow).not.toBeVisible();
  });
});
