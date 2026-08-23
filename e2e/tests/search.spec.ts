import { expect, test } from '../fixtures';

test.describe('Search bar stays visible', () => {
  async function navigateToLesson(page: import('@playwright/test').Page) {
    await page.waitForSelector('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.click('[data-testid="course-card"]:has-text("Introduction to Programming")');
    await page.waitForSelector('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.click('[data-testid="module-row"]:has([data-testid="module-name"]:has-text("Getting Started"))');
    await page.waitForSelector('text=Welcome to Introduction to Programming');
    await page.waitForTimeout(600);
  }

  async function openSearch(page: import('@playwright/test').Page) {
    await page.keyboard.press('Meta+f');
    await page.waitForSelector('[data-testid="viewer-search"]');
  }

  async function getSearchBarRect(page: import('@playwright/test').Page) {
    return page.locator('[data-testid="viewer-search"]').boundingBox();
  }

  test('search bar stays in viewport when scrolling content down', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    await page.locator('[data-testid="viewer-search"] input').fill('programming');
    await page.waitForTimeout(500);

    const rectBefore = await getSearchBarRect(page);
    expect(rectBefore).not.toBeNull();

    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (scroller) scroller.scrollTop = 800;
    });
    await page.waitForTimeout(500);

    const rectAfter = await getSearchBarRect(page);
    expect(rectAfter).not.toBeNull();

    // Search bar y must stay in upper portion of viewport
    expect(rectAfter!.y).toBeLessThan(200);
    // Search bar must not have moved significantly
    expect(Math.abs(rectAfter!.y - rectBefore!.y)).toBeLessThan(10);

    await page.screenshot({ path: 'test-results/search-after-scroll.png' });
  });

  test('search bar stays in viewport after clicking next', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    await page.locator('[data-testid="viewer-search"] input').fill('programming');
    await page.waitForTimeout(500);

    const rectBefore = await getSearchBarRect(page);
    expect(rectBefore).not.toBeNull();

    const nextBtn = page.locator('[data-testid="search-next"]');
    await nextBtn.click();
    await page.waitForTimeout(500);

    const rectAfter = await getSearchBarRect(page);
    expect(rectAfter).not.toBeNull();

    // Search bar must not have moved vertically
    expect(Math.abs(rectAfter!.y - rectBefore!.y)).toBeLessThan(10);
    expect(rectAfter!.y).toBeLessThan(200);

    await page.screenshot({ path: 'test-results/search-after-next.png' });
  });

  test('search bar is rendered outside the scroll container', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    const isOutsideScrollContainer = await page.evaluate(() => {
      const search = document.querySelector('[data-testid="viewer-search"]');
      const scrollContainer = document.querySelector(
        '[data-testid="lesson-content"]',
      );
      if (!search || !scrollContainer) return 'elements-missing';
      return !scrollContainer.contains(search);
    });

    expect(isOutsideScrollContainer).toBe(true);
  });

  test('search bar stays in viewport after pressing Enter multiple times', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    await page.locator('[data-testid="viewer-search"] input').fill('programming');
    await page.waitForTimeout(500);

    const rectBefore = await getSearchBarRect(page);

    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="viewer-search"] input').press('Enter');
      await page.waitForTimeout(500);
    }

    const rectAfter = await getSearchBarRect(page);
    expect(rectAfter).not.toBeNull();

    expect(Math.abs(rectAfter!.y - rectBefore!.y)).toBeLessThan(10);
    expect(rectAfter!.y).toBeLessThan(200);

    await page.screenshot({ path: 'test-results/search-after-enter.png' });
  });

  test('sections panel highlight changes when search jumps to match in different section', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    // Toggle sections panel visible
    const toggleBtn = page.locator('button:has-text("☰")');
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }
    await page.waitForSelector('[data-testid="sections-panel"]', { timeout: 5000 });

    // Search for term that appears across multiple sections
    await page.locator('[data-testid="viewer-search"] input').fill('programming');
    await page.waitForTimeout(500);

    // Get initially highlighted section
    const initialHighlight = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="sections-panel"] [data-section-id]');
      for (const row of rows) {
        const el = row as HTMLElement;
        if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent' && el.style.backgroundColor !== '') {
          return el.getAttribute('data-section-id');
        }
      }
      return null;
    });

    // Click next multiple times to jump through matches across sections
    const nextBtn = page.locator('[data-testid="search-next"]');
    for (let i = 0; i < 5; i++) {
      await nextBtn.click();
      await page.waitForTimeout(600);
    }

    // Get highlighted section after navigation
    const finalHighlight = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="sections-panel"] [data-section-id]');
      for (const row of rows) {
        const el = row as HTMLElement;
        if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent' && el.style.backgroundColor !== '') {
          return el.getAttribute('data-section-id');
        }
      }
      return null;
    });

    // Highlight should have changed to a different section
    expect(finalHighlight).not.toBeNull();
    expect(finalHighlight).not.toBe(initialHighlight);
  });

  test('BUG: search bar moves when jumping between matches', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    await page.locator('[data-testid="viewer-search"] input').fill('programming');
    await page.waitForTimeout(500);

    const rectBefore = await getSearchBarRect(page);
    expect(rectBefore).not.toBeNull();

    const nextBtn = page.locator('[data-testid="search-next"]');
    await nextBtn.click();
    await page.waitForTimeout(500);

    const rectAfter = await getSearchBarRect(page);
    expect(rectAfter).not.toBeNull();

    expect(Math.abs(rectAfter!.y - rectBefore!.y)).toBeLessThan(10);
  });

  test('DIAG: search bar position after next click', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    await page.locator('[data-testid="viewer-search"] input').fill('programming');
    await page.waitForTimeout(500);

    const before = await page.evaluate(() => {
      const search = document.querySelector('[data-testid="viewer-search"]') as HTMLElement;
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      const marks = document.querySelectorAll('mark[data-search-match]');

      function dumpHeightChain() {
        const chain: string[] = [];
        const selectors = [
          '[data-testid="page-content"]',
          '[data-testid="lesson-content"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (el) {
            const cs = getComputedStyle(el);
            chain.push(`${sel} clientH=${el.clientHeight} scrollH=${el.scrollHeight} flex=${cs.flex} minH=${cs.minHeight} overflowY=${cs.overflowY} parentTag=${el.parentElement?.tagName}`);
          }
        }
        // Walk up from scroll container
        let cur = scroller;
        while (cur && cur !== document.body) {
          const cs = getComputedStyle(cur);
          chain.push(`${cur.tagName}${cur.dataset.testid ? '[data-testid='+cur.dataset.testid+']' : ''} class=${cur.className} clientH=${cur.clientHeight} scrollH=${cur.scrollHeight} flex=${cs.flex} minH=${cs.minHeight} overflowY=${cs.overflowY}`);
          cur = cur.parentElement as HTMLElement;
        }
        return chain.join(' | ');
      }

      return {
        searchY: search?.getBoundingClientRect().y,
        searchOffsetTop: search?.offsetTop,
        parentY: search?.parentElement?.getBoundingClientRect().y,
        parentPaddingTop: getComputedStyle(search!.parentElement!).paddingTop,
        windowScrollY: window.scrollY,
        scrollerScrollTop: scroller?.scrollTop,
        scrollerTop: scroller?.getBoundingClientRect().top,
        scrollerHeight: scroller?.clientHeight as number,
        scrollerScrollHeight: scroller?.scrollHeight as number,
        scrollerCanScroll: scroller ? scroller.scrollHeight > scroller.clientHeight : false,
        markCount: marks.length,
        marksInsideScroller: scroller ? Array.from(marks).every(m => scroller.contains(m)) : false,
        nearestScrollAncestor: marks.length > 0 ? getNearestScrollAncestor(marks[0] as HTMLElement) : null,
        heightChain: dumpHeightChain(),
      };
      function getNearestScrollAncestor(el: HTMLElement): string {
        let cur = el.parentElement;
        while (cur) {
          const style = getComputedStyle(cur);
          if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return cur.tagName + (cur.id ? '#' + cur.id : '') + (cur.dataset.testid ? '[data-testid=' + cur.dataset.testid + ']' : '');
          }
          cur = cur.parentElement;
        }
        return 'none';
      }
    });

    const nextBtn = page.locator('[data-testid="search-next"]');
    await nextBtn.click();
    await page.waitForTimeout(800);

    const after = await page.evaluate(() => {
      const search = document.querySelector('[data-testid="viewer-search"]') as HTMLElement;
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      const marks = document.querySelectorAll('mark[data-search-match]');
      return {
        searchY: search?.getBoundingClientRect().y,
        searchOffsetTop: search?.offsetTop,
        parentY: search?.parentElement?.getBoundingClientRect().y,
        windowScrollY: window.scrollY,
        scrollerScrollTop: scroller?.scrollTop,
        scrollerTop: scroller?.getBoundingClientRect().top,
        scrollerCanScroll: scroller ? scroller.scrollHeight > scroller.clientHeight : false,
        scrollerScrollHeight: scroller?.scrollHeight,
        scrollerClientHeight: scroller?.clientHeight,
        markCount: marks.length,
        marksInsideScroller: scroller ? Array.from(marks).every(m => scroller.contains(m)) : false,
        nearestScrollAncestor: marks.length > 0 ? getNearestScrollAncestor(marks[0] as HTMLElement) : null,
      };
      function getNearestScrollAncestor(el: HTMLElement): string {
        let cur = el.parentElement;
        while (cur) {
          const style = getComputedStyle(cur);
          if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return cur.tagName + (cur.id ? '#' + cur.id : '') + (cur.dataset.testid ? '[data-testid=' + cur.dataset.testid + ']' : '');
          }
          cur = cur.parentElement;
        }
        return 'none';
      }
    });

    const sd = after!.searchY! - before!.searchY!;
    const pd = after!.parentY! - before!.parentY!;
    const sot = after!.searchOffsetTop! - before!.searchOffsetTop!;
    const wd = after!.windowScrollY - before!.windowScrollY;
    const scd = after!.scrollerScrollTop - before!.scrollerScrollTop;

    const msg = `searchY=${before!.searchY}→${after!.searchY}(${sd}) parentY=${before!.parentY}→${after!.parentY}(${pd}) offsetTop=${before!.searchOffsetTop}→${after!.searchOffsetTop}(${sot}) window=${before!.windowScrollY}→${after!.windowScrollY}(${wd}) scroll=${before!.scrollerScrollTop}→${after!.scrollerScrollTop}(${scd}) marks=${before!.markCount}→${after!.markCount} nearestScroll=${after!.nearestScrollAncestor} canScroll=${after!.scrollerCanScroll} marksInside=${after!.marksInsideScroller} scrollH=${after!.scrollerScrollHeight} clientH=${after!.scrollerClientHeight}\nHEIGHT CHAIN: ${before!.heightChain}`;

    // If searchY moved same as parentY → parent moved. If searchY moved ≠ parentY → search moved relative to parent
    if (Math.abs(sd) > 10) {
      throw new Error(`SEARCH BAR MOVED: ${msg}`);
    }
  });

  test('BUG: sections panel highlight stuck at initial section during search nav', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    const toggleBtn = page.locator('button:has-text("☰")');
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }
    await page.waitForSelector('[data-testid="sections-panel"]', { timeout: 5000 });

    await page.locator('[data-testid="viewer-search"] input').fill('for');
    await page.waitForTimeout(500);

    const initialHighlight = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="sections-panel"] [data-section-id]');
      for (const row of rows) {
        const el = row as HTMLElement;
        if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent' && el.style.backgroundColor !== '') {
          return el.getAttribute('data-section-id');
        }
      }
      return null;
    });

    const nextBtn = page.locator('[data-testid="search-next"]');
    for (let i = 0; i < 5; i++) {
      await nextBtn.click();
      await page.waitForTimeout(600);
    }

    const finalHighlight = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="sections-panel"] [data-section-id]');
      for (const row of rows) {
        const el = row as HTMLElement;
        if (el.style.backgroundColor && el.style.backgroundColor !== 'transparent' && el.style.backgroundColor !== '') {
          return el.getAttribute('data-section-id');
        }
      }
      return null;
    });

    expect(finalHighlight).not.toBeNull();
    expect(finalHighlight).not.toBe(initialHighlight);
  });

  test('DIAG: find section IDs for programming matches', async ({ page }) => {
    await navigateToLesson(page);
    await openSearch(page);

    const toggleBtn = page.locator('button:has-text("☰")');
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('[data-testid="viewer-search"] input').fill('programming');
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="lesson-content"]') as HTMLElement;
      if (!scroller) return { error: 'no-scroller' };

      const matches = scroller.querySelectorAll<HTMLElement>('mark[data-search-match]');
      const matchInfo: Array<{ idx: number; sectionId: string | null; parentTag: string }> = [];

      matches.forEach((m, i) => {
        let parent = m.parentElement;
        let sectionId: string | null = null;
        while (parent) {
          const sid = parent.getAttribute('data-section-id');
          if (sid) { sectionId = sid; break; }
          if (parent.tagName === 'SECTION' && parent.id) { sectionId = parent.id; break; }
          if (parent.tagName === 'H1' || parent.tagName === 'H2' || parent.tagName === 'H3') { sectionId = parent.id; break; }
          parent = parent.parentElement;
        }
        matchInfo.push({ idx: i, sectionId, parentTag: m.parentElement?.tagName || '?' });
      });

      // Check scrollTop
      const scrollTop = scroller.scrollTop;
      const scrollH = scroller.scrollHeight;
      const clientH = scroller.clientHeight;

      // Check headings
      const headings: Array<{ id: string; top: number }> = [];
      const containerRect = scroller.getBoundingClientRect();
      scroller.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        const el = h as HTMLElement;
        const rect = el.getBoundingClientRect();
        headings.push({ id: el.id, top: rect.top });
      });

      return { matchInfo, scrollTop, scrollH, clientH, threshold: containerRect.top + 120, headings };
    });

    console.log('DIAG:', JSON.stringify(info, null, 2));
    expect(info && 'matchInfo' in info && Array.isArray(info.matchInfo) ? info.matchInfo.length : 0).toBeGreaterThan(0);
  });
});
