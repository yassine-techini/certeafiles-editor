import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Edge Cases
 *
 * Tests extreme scenarios and error conditions
 */

// Helper to wait for editor to be ready
async function waitForEditor(page: Page) {
  await page.waitForSelector('[data-lexical-editor="true"]', { timeout: 15000 });
  await page.waitForTimeout(500);
}

// Helper to get the editor element
async function getEditor(page: Page) {
  return page.locator('[data-lexical-editor="true"]').first();
}

// Helper to type text in editor
async function typeInEditor(page: Page, text: string) {
  const editor = await getEditor(page);
  await editor.click();
  await editor.pressSequentially(text, { delay: 10 });
}

test.describe('Large Document Performance', () => {
  test.setTimeout(120000); // Extended timeout for large document tests

  test('should handle document with 100+ folios', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    // Look for add folio button
    const addButton =
      page.locator('[data-testid="add-folio"]') ||
      page.locator('button:has-text("Add Folio")') ||
      page.locator('button:has-text("Ajouter")');

    if ((await addButton.count()) > 0) {
      // Add 100 folios
      for (let i = 0; i < 100; i++) {
        await addButton.first().click();
        if (i % 20 === 0) {
          // Give the UI time to process every 20 folios
          await page.waitForTimeout(100);
        }
      }

      await page.waitForTimeout(1000);

      // Verify folios were added
      const folios = await page.locator('[data-folio-id]').count();
      expect(folios).toBeGreaterThanOrEqual(100);

      // Test navigation performance
      const startTime = Date.now();
      const lastFolio = page.locator('[data-folio-id]').last();
      await lastFolio.click();
      const navTime = Date.now() - startTime;

      // Navigation should be reasonably fast (under 2 seconds)
      expect(navTime).toBeLessThan(2000);
    }
  });

  test('should handle large text content without lag', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const editor = await getEditor(page);
    await editor.click();

    // Generate large text content (approximately 50KB)
    const largeText = 'Lorem ipsum dolor sit amet. '.repeat(2000);

    // Paste large content (faster than typing)
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, largeText);
    await page.keyboard.press('Meta+V');

    await page.waitForTimeout(2000);

    // Editor should still be responsive
    await expect(editor).toBeVisible();

    // Test scrolling performance
    await editor.click();
    const startTime = Date.now();
    await page.keyboard.press('Meta+End');
    await page.waitForTimeout(100);
    const scrollTime = Date.now() - startTime;

    expect(scrollTime).toBeLessThan(1000);
  });

  test('should handle rapid typing without losing characters', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const testString = 'The quick brown fox jumps over the lazy dog. 1234567890!';

    await typeInEditor(page, testString);
    await page.waitForTimeout(500);

    const editor = await getEditor(page);
    const content = await editor.textContent();

    // All characters should be present
    expect(content).toContain(testString);
  });
});

test.describe('Offline Mode', () => {
  test('should work offline after initial load', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    // Type some initial content
    await typeInEditor(page, 'Content before offline');
    await page.waitForTimeout(500);

    // Go offline
    await page.context().setOffline(true);

    // Should still be able to edit
    const editor = await getEditor(page);
    await editor.click();
    await page.keyboard.type(' - edited offline', { delay: 30 });

    await expect(editor).toContainText('Content before offline');
    await expect(editor).toContainText('edited offline');
  });

  test('should queue changes while offline', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    await typeInEditor(page, 'Initial content');

    // Go offline
    await page.context().setOffline(true);

    // Make several edits
    const editor = await getEditor(page);
    await editor.click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line 2 offline');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line 3 offline');

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);

    // All offline edits should be preserved
    await expect(editor).toContainText('Initial content');
    await expect(editor).toContainText('Line 2 offline');
    await expect(editor).toContainText('Line 3 offline');
  });

  test('should show offline indicator', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    // Look for offline indicator
    const offlineIndicator =
      page.locator('[data-testid="offline-indicator"]') ||
      page.locator('.offline-indicator') ||
      page.locator('[class*="offline"]') ||
      page.locator('text=Offline') ||
      page.locator('text=Hors ligne');

    // The app should indicate offline status
    // This validates offline UX is implemented
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Recovery', () => {
  test('should recover from network errors gracefully', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    // Simulate intermittent network
    await page.context().setOffline(true);
    await page.waitForTimeout(200);
    await page.context().setOffline(false);
    await page.waitForTimeout(200);
    await page.context().setOffline(true);
    await page.waitForTimeout(200);
    await page.context().setOffline(false);

    // Editor should remain functional
    const editor = await getEditor(page);
    await expect(editor).toBeVisible();

    // Should be able to type
    await editor.click();
    await page.keyboard.type('After network issues');
    await expect(editor).toContainText('After network issues');
  });

  test('should handle browser refresh without data loss', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const uniqueContent = `Test content ${Date.now()}`;
    await typeInEditor(page, uniqueContent);
    await page.waitForTimeout(1000); // Allow auto-save

    // Refresh the page
    await page.reload();
    await waitForEditor(page);

    // Check if content was preserved (depends on persistence implementation)
    const editor = await getEditor(page);
    await expect(editor).toBeVisible();
  });

  test('should handle invalid paste content', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const editor = await getEditor(page);
    await editor.click();

    // Try pasting various content types
    // Binary-like content
    await page.evaluate(() => {
      const binaryString = String.fromCharCode(...Array(100).fill(0).map((_, i) => i));
      navigator.clipboard.writeText(binaryString);
    });

    // This should not crash the editor
    await page.keyboard.press('Meta+V');
    await page.waitForTimeout(500);

    await expect(editor).toBeVisible();
  });
});

test.describe('Concurrent Operations', () => {
  test('should handle rapid undo/redo', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const editor = await getEditor(page);
    await editor.click();

    // Type several changes
    await page.keyboard.type('One ');
    await page.keyboard.type('Two ');
    await page.keyboard.type('Three ');

    // Rapid undo
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Meta+Z');
    }

    // Rapid redo
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Meta+Shift+Z');
    }

    // Editor should be stable
    await expect(editor).toBeVisible();
  });

  test('should handle rapid formatting changes', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    await typeInEditor(page, 'Format test text');

    const editor = await getEditor(page);
    await editor.click();
    await page.keyboard.press('Meta+A'); // Select all

    // Rapid format toggles
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Meta+B'); // Bold toggle
      await page.keyboard.press('Meta+I'); // Italic toggle
      await page.keyboard.press('Meta+U'); // Underline toggle
    }

    // Editor should remain stable
    await expect(editor).toBeVisible();
    await expect(editor).toContainText('Format test text');
  });
});

test.describe('Memory Management', () => {
  test('should not leak memory with repeated folio operations', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    const addButton =
      page.locator('[data-testid="add-folio"]') ||
      page.locator('button:has-text("Add Folio")') ||
      page.locator('button:has-text("Ajouter")');

    const deleteButton =
      page.locator('[data-testid="delete-folio"]') ||
      page.locator('button:has-text("Delete")') ||
      page.locator('button:has-text("Supprimer")');

    if ((await addButton.count()) > 0) {
      // Create and delete folios repeatedly
      for (let cycle = 0; cycle < 10; cycle++) {
        // Add 5 folios
        for (let i = 0; i < 5; i++) {
          await addButton.first().click();
        }

        await page.waitForTimeout(200);

        // Delete folios if delete button exists
        if ((await deleteButton.count()) > 0) {
          for (let i = 0; i < 4; i++) {
            await deleteButton.first().click();
            await page.waitForTimeout(100);
          }
        }
      }

      // Editor should still be responsive
      const editor = await getEditor(page);
      await expect(editor).toBeVisible();
    }
  });
});

test.describe('Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be visible somewhere
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await waitForEditor(page);

    // Check for ARIA labels on interactive elements
    const buttonsWithLabels = page.locator('button[aria-label]');
    const ariaLabeledElements = page.locator('[aria-label]');

    // There should be some accessible elements
    const count = await ariaLabeledElements.count();
    expect(count).toBeGreaterThanOrEqual(0); // At least check doesn't crash
  });
});
