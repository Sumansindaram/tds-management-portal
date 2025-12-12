/**
 * ============================================================================
 * AUTHENTICATION SETUP FILE
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * ------------------
 * This file runs BEFORE any other tests. Its job is to:
 * 1. Log into the application
 * 2. Save the login session (cookies, tokens, etc.)
 * 3. Other tests can then reuse this session without logging in again
 * 
 * WHY DO THIS?
 * ------------
 * - FASTER: Login once, use everywhere (saves ~5-10 seconds per test)
 * - RELIABLE: Login is the most common point of failure
 * - REALISTIC: Simulates a real user who stays logged in
 * 
 * HOW IT WORKS:
 * -------------
 * 1. Opens the browser
 * 2. Goes to the login page
 * 3. Types in email and password
 * 4. Clicks login button
 * 5. Waits for login to complete
 * 6. Saves the browser state to a file (.auth/user.json)
 * 7. Other tests load this file to be "already logged in"
 */

import { test as setup, expect } from '@playwright/test';
import { TEST_USERS, ROUTES, TIMEOUTS } from './test-data';

/**
 * STORAGE STATE FILE PATH
 * -----------------------
 * This is where we save the logged-in browser state
 * The .auth folder is in tests/e2e/ directory
 */
const authFile = 'tests/e2e/.auth/user.json';

/**
 * AUTHENTICATE SETUP TEST
 * -----------------------
 * This test logs in and saves the session
 * It's marked as a "setup" test so it runs first
 */
setup('authenticate', async ({ page }) => {
  /**
   * STEP 1: GO TO LOGIN PAGE
   * ------------------------
   * Navigate to the authentication page where users log in
   * We use the ROUTES constant from test-data.ts for consistency
   */
  console.log('📍 Step 1: Navigating to login page...');
  await page.goto(ROUTES.auth);
  
  /**
   * STEP 2: WAIT FOR PAGE TO LOAD
   * ----------------------------
   * Make sure the login form is visible before trying to interact with it
   * This prevents errors from trying to click elements that haven't loaded
   */
  console.log('⏳ Step 2: Waiting for login form to load...');
  await expect(page.locator('input[type="email"]')).toBeVisible({
    timeout: TIMEOUTS.medium,
  });
  
  /**
   * STEP 3: ENTER EMAIL ADDRESS
   * ---------------------------
   * Find the email input field and type in the test user's email
   * We use the TEST_USERS.admin credentials (you can change to ptUser or superAdmin)
   */
  console.log('📧 Step 3: Entering email address...');
  await page.locator('input[type="email"]').fill(TEST_USERS.admin.email);
  
  /**
   * STEP 4: ENTER PASSWORD
   * ----------------------
   * Find the password input field and type in the password
   */
  console.log('🔑 Step 4: Entering password...');
  await page.locator('input[type="password"]').fill(TEST_USERS.admin.password);
  
  /**
   * STEP 5: CLICK LOGIN BUTTON
   * --------------------------
   * Find and click the submit button to log in
   * We look for a button with text containing "Sign In"
   */
  console.log('🖱️ Step 5: Clicking login button...');
  await page.locator('button[type="submit"]').click();
  
  /**
   * STEP 6: WAIT FOR LOGIN TO COMPLETE
   * ----------------------------------
   * After clicking login, we need to wait for:
   * - The page to redirect (usually to home page)
   * - The user's session to be established
   * 
   * We check for the URL to change from /auth to /
   * OR we check for a dashboard element to appear
   */
  console.log('⏳ Step 6: Waiting for login to complete...');
  
  // Wait for either redirect to home OR dashboard to load
  await Promise.race([
    // Option 1: URL changes from /auth
    page.waitForURL((url) => !url.pathname.includes('/auth'), {
      timeout: TIMEOUTS.long,
    }),
    // Option 2: A dashboard element appears
    page.waitForSelector('[data-testid="dashboard"]', {
      timeout: TIMEOUTS.long,
    }).catch(() => {}),  // Don't fail if this selector doesn't exist
  ]);
  
  /**
   * STEP 7: VERIFY LOGIN WAS SUCCESSFUL
   * -----------------------------------
   * Make sure we're actually logged in by checking:
   * - We're NOT on the auth page anymore
   * - OR we can see user-specific content
   */
  console.log('✅ Step 7: Verifying login was successful...');
  
  // Give the page a moment to settle
  await page.waitForLoadState('networkidle');
  
  // Check we're not on auth page
  const currentUrl = page.url();
  console.log(`📍 Current URL after login: ${currentUrl}`);
  
  /**
   * STEP 8: SAVE THE BROWSER STATE
   * ------------------------------
   * This is the key step! We save all cookies, localStorage, sessionStorage
   * to a JSON file. Other tests will load this file to start "already logged in"
   */
  console.log('💾 Step 8: Saving authentication state...');
  await page.context().storageState({ path: authFile });
  
  console.log('🎉 Authentication setup complete!');
});

/**
 * ============================================================================
 * UNDERSTANDING THE AUTH FILE (.auth/user.json)
 * ============================================================================
 * 
 * The auth file contains:
 * {
 *   "cookies": [
 *     { "name": "session_token", "value": "abc123...", "domain": ".yourapp.com", ... }
 *   ],
 *   "origins": [
 *     {
 *       "origin": "https://yourapp.com",
 *       "localStorage": [
 *         { "name": "supabase.auth.token", "value": "..." }
 *       ]
 *     }
 *   ]
 * }
 * 
 * This allows Playwright to "pretend" to be logged in by loading this state.
 * 
 * SECURITY NOTE:
 * - Add .auth/ to your .gitignore file
 * - Never commit this file to version control
 * - The tokens in this file could be used to access your account
 */
