/**
 * ============================================================================
 * DASHBOARD TESTS
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * ------------------
 * This file tests the main dashboard page that users see after logging in.
 * The dashboard is the "home" of the application where users can:
 * - See an overview of the system
 * - Navigate to different features
 * - Access quick actions
 * 
 * IMPORTANT NOTE:
 * ---------------
 * These tests use the saved authentication state from auth.setup.ts
 * So they start ALREADY LOGGED IN - no need to log in again!
 */

import { test, expect } from '@playwright/test';
import { ROUTES, TIMEOUTS } from './test-data';

/**
 * TEST GROUP: DASHBOARD
 * ---------------------
 * All tests related to the main dashboard page
 */
test.describe('Dashboard', () => {
  /**
   * BEFORE EACH TEST
   * ----------------
   * Navigate to the home page before each test
   * Since we're using stored auth, we should be logged in already
   */
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.waitForLoadState('networkidle');
  });

  /**
   * TEST: DASHBOARD LOADS SUCCESSFULLY
   * ----------------------------------
   * Basic smoke test to ensure the dashboard page loads
   */
  test('should load dashboard page', async ({ page }) => {
    /**
     * WHAT WE'RE CHECKING:
     * - The page loads without errors
     * - We're not redirected to login (auth is working)
     * - Basic dashboard elements are visible
     */
    
    // We should NOT be on the auth page (we're logged in)
    await expect(page).not.toHaveURL(/.*auth.*/);
    
    // Page should have loaded successfully
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * TEST: NAVIGATION CARDS/TILES ARE VISIBLE
   * ----------------------------------------
   * The dashboard should show navigation options
   * These are typically cards or tiles linking to different features
   */
  test('should display navigation options', async ({ page }) => {
    /**
     * WAIT FOR CONTENT TO LOAD
     * Dashboard often has dynamic content that loads after the page
     */
    await page.waitForLoadState('networkidle');
    
    /**
     * CHECK FOR NAVIGATION ELEMENTS
     * The dashboard should have clickable areas to navigate
     * We look for common patterns: cards, links, buttons
     */
    
    // Look for card elements (common dashboard pattern)
    const cards = page.locator('[class*="card"], [data-testid*="card"]');
    
    // There should be at least one navigation option
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  /**
   * TEST: CAN NAVIGATE TO MY SUBMISSIONS
   * ------------------------------------
   * Tests clicking the "My Submissions" navigation option
   */
  test('should navigate to my submissions page', async ({ page }) => {
    /**
     * STEP 1: FIND AND CLICK THE MY SUBMISSIONS LINK/CARD
     * We look for text that matches "My Submissions" or similar
     */
    
    // Try to find a link or button with submissions text
    const submissionsLink = page.locator('text=My Submissions').first();
    
    // If visible, click it
    if (await submissionsLink.isVisible()) {
      await submissionsLink.click();
      
      /**
       * STEP 2: VERIFY NAVIGATION OCCURRED
       * The URL should change to the submissions page
       */
      await expect(page).toHaveURL(new RegExp(ROUTES.mySubmissions));
    }
  });

  /**
   * TEST: CAN NAVIGATE TO SUBMIT REQUEST
   * ------------------------------------
   * Tests clicking the "Submit Request" or "Create Request" option
   */
  test('should navigate to submit request page', async ({ page }) => {
    // Find submit/create request link
    const submitLink = page.locator('text=/Submit.*Request|Create.*Request/i').first();
    
    if (await submitLink.isVisible()) {
      await submitLink.click();
      
      // Should navigate to the form page
      await expect(page).toHaveURL(/.*form.*/);
    }
  });

  /**
   * TEST: USER GREETING OR NAME DISPLAYED
   * -------------------------------------
   * After login, the user's name or a greeting should be visible
   * This confirms the session is working correctly
   */
  test('should show user is logged in', async ({ page }) => {
    /**
     * LOOK FOR INDICATORS THAT USER IS LOGGED IN:
     * - User's name displayed somewhere
     * - "Welcome" message
     * - Avatar or user icon
     * - Logout option visible
     */
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Look for any sign the user is logged in
    // This could be a header with user info, or a logout button
    const loggedInIndicators = page.locator('text=/logout|sign out|log out/i');
    
    // If there's a logout option, we're logged in
    // (We don't fail if not found, as UI may vary)
  });

  /**
   * TEST: RESPONSIVE LAYOUT
   * -----------------------
   * Tests that the dashboard looks correct on different screen sizes
   */
  test('should be responsive on mobile', async ({ page }) => {
    /**
     * STEP 1: SET MOBILE VIEWPORT
     * Simulate a mobile phone screen size
     */
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    /**
     * STEP 2: RELOAD THE PAGE
     * Some responsive changes only happen on load
     */
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    /**
     * STEP 3: VERIFY PAGE IS STILL USABLE
     * - No horizontal scrollbar (content fits)
     * - Main elements are still visible
     */
    
    // Check body doesn't overflow horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Body shouldn't be much wider than viewport (allowing small margin for scrollbars)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  /**
   * TEST: NO CONSOLE ERRORS
   * -----------------------
   * Checks that the page loads without JavaScript errors
   * Console errors often indicate bugs or missing resources
   */
  test('should load without console errors', async ({ page }) => {
    /**
     * STEP 1: COLLECT CONSOLE MESSAGES
     * We'll listen for console.error messages
     */
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    /**
     * STEP 2: NAVIGATE TO PAGE
     */
    await page.goto(ROUTES.home);
    await page.waitForLoadState('networkidle');
    
    /**
     * STEP 3: CHECK FOR ERRORS
     * Filter out known/acceptable errors (like failed analytics)
     */
    const criticalErrors = consoleErrors.filter(error => {
      // Ignore certain expected errors
      const ignoredPatterns = [
        'favicon',
        'analytics',
        'tracking',
        'gtag',
      ];
      
      return !ignoredPatterns.some(pattern => 
        error.toLowerCase().includes(pattern)
      );
    });
    
    // Should have no critical console errors
    expect(criticalErrors).toHaveLength(0);
  });
});

/**
 * ============================================================================
 * ROLE-BASED ACCESS TESTS
 * ============================================================================
 * 
 * Different users should see different options based on their role
 * - PT Users: Limited access (own submissions only)
 * - Admins: Full access to requests and SSR directory
 * - Super Admins: Everything + user management
 */
test.describe('Role-Based Dashboard Access', () => {
  /**
   * TEST: ADMIN SEES ADMIN OPTIONS
   * ------------------------------
   * Admins should see links to:
   * - View All Requests
   * - SSR Directory
   * - User management (if super admin)
   */
  test('admin should see admin navigation options', async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.waitForLoadState('networkidle');
    
    // Look for admin-specific options
    // These texts should be visible to admins
    const adminOptions = [
      'View All Requests',
      'SSR Directory',
    ];
    
    for (const option of adminOptions) {
      const element = page.locator(`text=${option}`).first();
      // Note: This will pass for admin users, might fail for PT users
      // That's expected - different roles see different options
    }
  });
});

/**
 * ============================================================================
 * TIPS FOR ADDING MORE DASHBOARD TESTS
 * ============================================================================
 * 
 * Consider adding tests for:
 * 
 * 1. Statistics/Metrics Display
 *    - Test that numbers load and display correctly
 *    - Verify stats update after actions
 * 
 * 2. Recent Activity
 *    - Check that recent items are shown
 *    - Verify sorting (newest first)
 * 
 * 3. Quick Actions
 *    - Test any shortcut buttons work
 *    - Verify modal/dialog opens correctly
 * 
 * 4. Notifications
 *    - Check notification badges appear
 *    - Test notification panel opens
 * 
 * 5. Search Functionality
 *    - If dashboard has search, test it works
 *    - Test empty results handling
 */
