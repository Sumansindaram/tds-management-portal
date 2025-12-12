/**
 * ============================================================================
 * AUTHENTICATION TESTS
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * ------------------
 * This file contains tests for the authentication (login/signup) functionality.
 * These tests verify that users can:
 * - Sign up for a new account
 * - Log in with existing credentials
 * - See appropriate error messages for invalid credentials
 * - Reset their password
 * 
 * TEST STRUCTURE EXPLAINED:
 * -------------------------
 * Each test follows this pattern:
 * 1. ARRANGE: Set up the test conditions (navigate to page, prepare data)
 * 2. ACT: Perform the action being tested (click buttons, fill forms)
 * 3. ASSERT: Check that the expected result occurred
 * 
 * HOW TO READ THESE TESTS:
 * ------------------------
 * - test.describe() = A group of related tests
 * - test() = A single test case
 * - expect() = Check if something is true
 * - await = Wait for something to complete before continuing
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS, ROUTES, TIMEOUTS } from './test-data';

/**
 * TEST GROUP: AUTHENTICATION
 * --------------------------
 * All tests related to logging in and signing up
 */
test.describe('Authentication', () => {
  /**
   * BEFORE EACH TEST
   * ----------------
   * This runs before EVERY test in this describe block
   * We navigate to the auth page so each test starts fresh
   */
  test.beforeEach(async ({ page }) => {
    // Clear any existing session first
    await page.context().clearCookies();
    
    // Go to the auth page
    await page.goto(ROUTES.auth);
    
    // Wait for the page to fully load
    await page.waitForLoadState('domcontentloaded');
  });

  /**
   * TEST: PAGE LOADS CORRECTLY
   * --------------------------
   * This is a "smoke test" - it just checks that the page opens without errors
   * If this fails, something is fundamentally broken
   */
  test('should display login form', async ({ page }) => {
    /**
     * WHAT WE'RE CHECKING:
     * - The page title contains "TDS Portal"
     * - The email input field is visible
     * - The password input field is visible
     * - The sign in button is visible
     */
    
    // Check the page title
    await expect(page.locator('text=JSP 800 Vol 7 TDS Portal')).toBeVisible();
    
    // Check email input exists and is visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check password input exists and is visible
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check sign in button exists
    const signInButton = page.locator('button[type="submit"]');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toContainText('Sign In');
  });

  /**
   * TEST: SUCCESSFUL LOGIN
   * ----------------------
   * Tests that a user with valid credentials can log in successfully
   * 
   * Note: This test uses real credentials - make sure they exist in your database
   * For CI/CD, use environment variables for these credentials
   */
  test('should login successfully with valid credentials', async ({ page }) => {
    /**
     * STEP 1: FILL IN THE LOGIN FORM
     * We use the .fill() method which clears the field first, then types
     */
    
    // Enter email address
    await page.locator('input[type="email"]').fill(TEST_USERS.admin.email);
    
    // Enter password
    await page.locator('input[type="password"]').fill(TEST_USERS.admin.password);
    
    /**
     * STEP 2: CLICK THE LOGIN BUTTON
     */
    await page.locator('button[type="submit"]').click();
    
    /**
     * STEP 3: WAIT FOR AND VERIFY SUCCESSFUL LOGIN
     * 
     * After successful login, the app should:
     * - Redirect away from the /auth page
     * - Show the dashboard or home page
     */
    
    // Wait for URL to change (no longer on /auth)
    await expect(page).not.toHaveURL(/.*auth.*/);
    
    // We should now be on the home page or dashboard
    // The URL should be the root "/" or "/dashboard"
    await page.waitForURL('/', { timeout: TIMEOUTS.medium });
  });

  /**
   * TEST: FAILED LOGIN WITH WRONG PASSWORD
   * --------------------------------------
   * Tests that entering wrong credentials shows an error message
   * 
   * This is important for:
   * - Security: Verify the system rejects bad credentials
   * - UX: Ensure users get feedback when login fails
   */
  test('should show error message with invalid credentials', async ({ page }) => {
    /**
     * STEP 1: ENTER VALID EMAIL BUT WRONG PASSWORD
     */
    await page.locator('input[type="email"]').fill(TEST_USERS.admin.email);
    await page.locator('input[type="password"]').fill('wrongpassword123');
    
    /**
     * STEP 2: CLICK LOGIN
     */
    await page.locator('button[type="submit"]').click();
    
    /**
     * STEP 3: VERIFY ERROR MESSAGE APPEARS
     * 
     * The app should show a toast notification or error message
     * We look for common error indicators:
     * - Toast notification with "error" or "invalid"
     * - Red colored text
     * - Error role element
     */
    
    // Wait for and check the error toast appears
    // Toast messages typically have role="status" or contain specific text
    const errorToast = page.locator('[role="status"], [data-sonner-toast]').filter({
      hasText: /error|invalid|incorrect/i,
    });
    
    await expect(errorToast.first()).toBeVisible({ timeout: TIMEOUTS.medium });
  });

  /**
   * TEST: TOGGLE BETWEEN LOGIN AND SIGNUP
   * -------------------------------------
   * Tests that users can switch between the login and signup forms
   */
  test('should toggle between sign in and sign up forms', async ({ page }) => {
    /**
     * STEP 1: VERIFY WE START ON SIGN IN FORM
     * Check that the submit button says "Sign In"
     */
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
    
    /**
     * STEP 2: CLICK THE "SIGN UP" TOGGLE LINK
     * Find the link/button that says "Don't have an account? Sign up"
     */
    await page.locator('text=Don\'t have an account? Sign up').click();
    
    /**
     * STEP 3: VERIFY THE FORM CHANGED TO SIGN UP
     * - Button should now say "Sign Up"
     * - Full Name field should appear
     */
    await expect(page.locator('button[type="submit"]')).toContainText('Sign Up');
    
    // The full name input should now be visible
    await expect(page.locator('input#fullName')).toBeVisible();
    
    /**
     * STEP 4: TOGGLE BACK TO SIGN IN
     */
    await page.locator('text=Already have an account? Sign in').click();
    
    // Verify we're back to sign in form
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
    
    // Full name field should be hidden
    await expect(page.locator('input#fullName')).not.toBeVisible();
  });

  /**
   * TEST: VALIDATION - EMPTY FIELDS
   * -------------------------------
   * Tests that submitting empty form shows validation errors
   */
  test('should show validation error for empty fields', async ({ page }) => {
    /**
     * STEP 1: CLICK SUBMIT WITHOUT ENTERING ANYTHING
     * HTML5 validation should trigger required field errors
     */
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    /**
     * STEP 2: CHECK THAT FORM WASN'T SUBMITTED
     * We should still be on the auth page
     */
    await expect(page).toHaveURL(/.*auth.*/);
    
    /**
     * STEP 3: VERIFY THE EMAIL FIELD IS MARKED AS INVALID
     * HTML5 validation adds :invalid pseudo-class to required empty fields
     */
    const emailInput = page.locator('input[type="email"]');
    
    // The input should have validation message
    // We can check if the browser's validation kicked in
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  /**
   * TEST: EMAIL FORMAT VALIDATION
   * -----------------------------
   * Tests that invalid email format shows appropriate error
   */
  test('should validate email format', async ({ page }) => {
    /**
     * STEP 1: ENTER AN INVALID EMAIL FORMAT
     * "notanemail" is not a valid email address
     */
    await page.locator('input[type="email"]').fill('notanemail');
    await page.locator('input[type="password"]').fill('password123');
    
    /**
     * STEP 2: TRY TO SUBMIT
     */
    await page.locator('button[type="submit"]').click();
    
    /**
     * STEP 3: VERIFY VALIDATION ERROR
     * Either HTML5 validation or custom validation should show error
     */
    // Check if we're still on auth page (form wasn't submitted)
    await expect(page).toHaveURL(/.*auth.*/);
  });

  /**
   * TEST: PASSWORD MINIMUM LENGTH
   * -----------------------------
   * Tests that passwords must meet minimum length requirement
   */
  test('should require minimum password length for signup', async ({ page }) => {
    // Switch to signup form
    await page.locator('text=Don\'t have an account? Sign up').click();
    
    // Fill form with short password
    await page.locator('input#fullName').fill('Test User');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('12345'); // Only 5 characters
    
    // Try to submit
    await page.locator('button[type="submit"]').click();
    
    // Should show validation error (password must be at least 6 characters)
    const errorToast = page.locator('[role="status"], [data-sonner-toast]');
    await expect(errorToast.first()).toBeVisible({ timeout: TIMEOUTS.medium });
  });

  /**
   * TEST: FORGOT PASSWORD LINK
   * --------------------------
   * Tests that the forgot password functionality works
   */
  test('should show forgot password option', async ({ page }) => {
    // Check that forgot password link exists
    const forgotPasswordLink = page.locator('text=Forgot Password?');
    await expect(forgotPasswordLink).toBeVisible();
    
    // Enter an email first (required for password reset)
    await page.locator('input[type="email"]').fill(TEST_USERS.admin.email);
    
    // Click forgot password
    await forgotPasswordLink.click();
    
    // Should show a confirmation message
    const successToast = page.locator('[role="status"], [data-sonner-toast]');
    await expect(successToast.first()).toBeVisible({ timeout: TIMEOUTS.medium });
  });

  /**
   * TEST: MICROSOFT SSO BUTTON EXISTS
   * ---------------------------------
   * Tests that the Microsoft SSO option is available
   * (We can't fully test SSO without a real Microsoft account)
   */
  test('should display Microsoft SSO option', async ({ page }) => {
    // Check that the Microsoft SSO button exists
    const ssoButton = page.locator('text=Sign in SSO');
    await expect(ssoButton).toBeVisible();
  });
});

/**
 * ============================================================================
 * RUNNING THESE TESTS
 * ============================================================================
 * 
 * From your terminal, run:
 * 
 * npx playwright test auth.spec.ts          # Run all auth tests
 * npx playwright test auth.spec.ts --headed # Watch the tests in a browser
 * npx playwright test auth.spec.ts --debug  # Debug mode (step through)
 * 
 * To run a specific test:
 * npx playwright test -g "should login successfully"
 * 
 * ============================================================================
 */
