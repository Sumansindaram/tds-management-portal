import { test, expect } from '@playwright/test';

/**
 * New Asset Request Feature Tests
 * 
 * These tests cover the new asset TDS request functionality where Project Teams (PTs)
 * can submit requests for TDS documentation for new assets.
 */

test.describe('New Asset Request Feature', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the new asset requests list page
    await page.goto('/new-asset-requests');
  });

  test('should display new asset requests list page', async ({ page }) => {
    // Verify page title and main elements
    await expect(page.getByRole('heading', { name: /New Asset Requests/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /New Request/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
  });

  test('should navigate to create new request form', async ({ page }) => {
    // Click the New Request button
    await page.getByRole('button', { name: /New Request/i }).click();
    
    // Verify navigation to create form
    await expect(page).toHaveURL(/\/new-asset-request\/create/);
    await expect(page.getByRole('heading', { name: /New Asset TDS Request/i })).toBeVisible();
  });

  test('should display all form sections on create page', async ({ page }) => {
    await page.goto('/new-asset-request/create');
    
    // Verify all form sections are present
    await expect(page.getByText('Task Information')).toBeVisible();
    await expect(page.getByText('Basic Asset Information')).toBeVisible();
    await expect(page.getByText('Contact Information')).toBeVisible();
    await expect(page.getByText('Supporting Documents')).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.goto('/new-asset-request/create');
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /Submit Request/i }).click();
    
    // Should show validation error toast
    await expect(page.getByText(/Missing Required Fields/i)).toBeVisible({ timeout: 5000 });
  });

  test('should allow file upload with document type selection', async ({ page }) => {
    await page.goto('/new-asset-request/create');
    
    // Select a document type first
    await page.getByLabel('Document Type').click();
    await page.getByRole('option', { name: 'CAD Drawing' }).click();
    
    // The upload button should now be enabled
    const uploadButton = page.getByRole('button', { name: /Choose Files/i });
    await expect(uploadButton).toBeEnabled();
  });
});

test.describe('New Asset Request - Dashboard Tile', () => {
  
  test('should display New Asset Request tile on dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Verify the new asset request tile is visible
    await expect(page.getByText('New Asset Request')).toBeVisible();
  });

  test('should navigate to requests list when clicking tile', async ({ page }) => {
    await page.goto('/');
    
    // Click the New Asset Request tile
    await page.getByText('New Asset Request').click();
    
    // Should navigate to the requests list
    await expect(page).toHaveURL(/\/new-asset-requests/);
  });
});
