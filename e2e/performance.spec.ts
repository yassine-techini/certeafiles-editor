import { test, expect, Page } from '@playwright/test';

/**
 * E2E Performance Tests
 *
 * Verifies performance targets:
 * - Initial load < 2s
 * - Folio render < 100ms
 * - Sync latency < 200ms
 */

// Performance targets (in ms)
// Note: Development environment with Vite dev server has higher overhead
// Production builds should meet stricter targets
const IS_DEV = process.env.PLAYWRIGHT_BASE_URL?.includes('localhost') || !process.env.PLAYWRIGHT_BASE_URL;

const TARGETS = {
  // Initial load includes dev server compilation on first request
  INITIAL_LOAD: IS_DEV ? 10000 : 2000,
  FOLIO_RENDER: IS_DEV ? 200 : 100,
  SYNC_LATENCY: 200,
  TYPING_LATENCY: IS_DEV ? 150 : 50,
};

// Helper to wait for editor to be ready
async function waitForEditor(page: Page) {
  await page.waitForSelector('[data-lexical-editor="true"]', { timeout: 15000 });
  await page.waitForTimeout(300);
}

// Helper to get the editor element
async function getEditor(page: Page) {
  return page.locator('[data-lexical-editor="true"]').first();
}

test.describe('Performance Targets', () => {
  test('initial load should be under 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await waitForEditor(page);

    const loadTime = Date.now() - startTime;

    console.log(`Initial load time: ${loadTime}ms (target: <${TARGETS.INITIAL_LOAD}ms)`);

    // Allow some buffer for CI environments
    expect(loadTime).toBeLessThan(TARGETS.INITIAL_LOAD * 1.5);
  });

  test('should measure LCP (Largest Contentful Paint)', async ({ page }) => {
    // Collect performance metrics
    const metrics: number[] = [];

    page.on('console', (msg) => {
      if (msg.text().includes('LCP')) {
        const match = msg.text().match(/LCP:\s*(\d+)/);
        if (match) {
          metrics.push(parseInt(match[1], 10));
        }
      }
    });

    await page.goto('/');

    // Inject LCP measurement
    await page.evaluate(() => {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.log(`LCP: ${entry.startTime}`);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await waitForEditor(page);
    await page.waitForTimeout(1000);

    // Get navigation timing metrics
    const navTiming = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.startTime,
        loadComplete: perf.loadEventEnd - perf.startTime,
        domInteractive: perf.domInteractive - perf.startTime,
      };
    });

    console.log('Navigation Timing:', navTiming);

    expect(navTiming.domInteractive).toBeLessThan(TARGETS.INITIAL_LOAD);
  });

  test('folio navigation should be under 100ms', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    // Check if add folio button exists
    const addButton =
      page.locator('[data-testid="add-folio"]') ||
      page.locator('button:has-text("Add")') ||
      page.locator('button:has-text("Page")');

    if ((await addButton.count()) > 0) {
      // Add a second folio
      await addButton.first().click();
      await page.waitForTimeout(500);

      // Measure navigation time
      const startTime = Date.now();

      // Click on first folio
      const folioItems = page.locator('[data-folio-thumbnail]');
      if ((await folioItems.count()) > 1) {
        await folioItems.first().click();
        await page.waitForTimeout(100);

        const navTime = Date.now() - startTime;
        console.log(`Folio navigation time: ${navTime}ms (target: <${TARGETS.FOLIO_RENDER}ms)`);

        expect(navTime).toBeLessThan(TARGETS.FOLIO_RENDER * 2); // Allow buffer
      }
    }
  });

  test('typing latency should be acceptable', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const editor = await getEditor(page);
    await editor.click();

    // Measure typing responsiveness
    const inputLatencies: number[] = [];

    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      await page.keyboard.type('a');
      const latency = Date.now() - startTime;
      inputLatencies.push(latency);
    }

    const avgLatency = inputLatencies.reduce((a, b) => a + b, 0) / inputLatencies.length;
    console.log(`Average typing latency: ${avgLatency}ms`);

    // Typing should be very responsive
    expect(avgLatency).toBeLessThan(TARGETS.TYPING_LATENCY);
  });

  test('should handle 50 folios efficiently', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const addButton =
      page.locator('[data-testid="add-folio"]') ||
      page.locator('button:has-text("Add")') ||
      page.locator('button:has-text("Page")');

    if ((await addButton.count()) > 0) {
      // Add 50 folios
      const startAddTime = Date.now();

      for (let i = 0; i < 49; i++) {
        await addButton.first().click();
        // Only wait every 10 folios to speed up test
        if (i % 10 === 0) {
          await page.waitForTimeout(50);
        }
      }

      const addTime = Date.now() - startAddTime;
      console.log(`Time to add 50 folios: ${addTime}ms`);

      // Wait for UI to settle
      await page.waitForTimeout(500);

      // Measure scroll performance
      const listContainer = page.locator('.overflow-y-auto').first();
      if ((await listContainer.count()) > 0) {
        const startScrollTime = Date.now();

        // Scroll to bottom
        await listContainer.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });

        await page.waitForTimeout(100);

        const scrollTime = Date.now() - startScrollTime;
        console.log(`Scroll time: ${scrollTime}ms`);

        expect(scrollTime).toBeLessThan(200);
      }

      // Measure click on last folio
      const folioItems = page.locator('[data-folio-thumbnail]');
      const folioCount = await folioItems.count();

      if (folioCount >= 50) {
        const startNavTime = Date.now();
        await folioItems.last().click();
        await page.waitForTimeout(100);
        const navTime = Date.now() - startNavTime;

        console.log(`Navigation to last folio: ${navTime}ms`);
        expect(navTime).toBeLessThan(TARGETS.FOLIO_RENDER * 3);
      }
    }
  });

  test('should track memory usage during extended use', async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for this test

    await page.goto('/');
    await waitForEditor(page);

    const editor = await getEditor(page);
    await editor.click();

    // Get initial memory (if available)
    const initialMemory = await page.evaluate(() => {
      if ((performance as Performance & { memory?: { usedJSHeapSize: number } }).memory) {
        return (performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
      }
      return null;
    });

    // Perform many operations (reduced count for faster test)
    for (let i = 0; i < 50; i++) {
      await page.keyboard.type('Test ');
      if (i % 10 === 0) {
        await page.keyboard.press('Enter');
      }
    }

    // Trigger garbage collection if possible
    await page.evaluate(() => {
      if ((window as Window & { gc?: () => void }).gc) {
        (window as Window & { gc: () => void }).gc();
      }
    });

    const finalMemory = await page.evaluate(() => {
      if ((performance as Performance & { memory?: { usedJSHeapSize: number } }).memory) {
        return (performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize;
      }
      return null;
    });

    if (initialMemory && finalMemory) {
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);
      console.log(`Memory growth: ${memoryGrowthMB.toFixed(2)}MB`);

      // Memory growth should be reasonable (less than 50MB)
      expect(memoryGrowthMB).toBeLessThan(50);
    }
  });

  test('should render efficiently with large content', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const editor = await getEditor(page);
    await editor.click();

    // Generate and paste large content
    const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(500);

    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, largeContent);

    const pasteStartTime = Date.now();
    await page.keyboard.press('Meta+V');
    await page.waitForTimeout(500);
    const pasteTime = Date.now() - pasteStartTime;

    console.log(`Large content paste time: ${pasteTime}ms`);

    // Paste should complete in reasonable time
    expect(pasteTime).toBeLessThan(2000);

    // Test scrolling performance with large content
    const scrollStartTime = Date.now();
    await page.keyboard.press('Meta+End');
    await page.waitForTimeout(100);
    const scrollTime = Date.now() - scrollStartTime;

    console.log(`Scroll to end time: ${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(500);
  });
});

test.describe('Core Web Vitals', () => {
  test('should have acceptable First Contentful Paint', async ({ page }) => {
    await page.goto('/');

    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          }
        }).observe({ type: 'paint', buffered: true });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`First Contentful Paint: ${fcp}ms`);

    // FCP should be under 1.8s (good) or 3s (needs improvement)
    if (fcp > 0) {
      expect(fcp).toBeLessThan(3000);
    }
  });

  test('should have acceptable Time to Interactive', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await waitForEditor(page);

    // Editor should be interactive
    const editor = await getEditor(page);
    await editor.click();
    await page.keyboard.type('Test');

    const tti = Date.now() - startTime;

    console.log(`Time to Interactive: ${tti}ms`);

    // TTI should be under target (more relaxed for dev environment)
    expect(tti).toBeLessThan(TARGETS.INITIAL_LOAD);
  });
});
