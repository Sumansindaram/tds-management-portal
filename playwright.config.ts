/**
 * ============================================================================
 * PLAYWRIGHT CONFIGURATION FILE
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * ------------------
 * This is the main configuration file for Playwright - an automation testing tool.
 * Think of it as the "settings" file that tells Playwright HOW to run your tests.
 * 
 * WHAT DOES IT DO?
 * ----------------
 * - Tells Playwright where to find your test files
 * - Configures which browsers to test in (Chrome, Firefox, Safari)
 * - Sets timeouts (how long to wait before failing)
 * - Configures the base URL of your application
 * - Sets up screenshot and video recording for failed tests
 * 
 * HOW TO USE?
 * -----------
 * You don't need to modify this often. Just run: npx playwright test
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  /**
   * TEST DIRECTORY
   * Where Playwright looks for test files (*.spec.ts files)
   */
  testDir: './tests/e2e',

  /**
   * FULLY PARALLEL
   * Run tests in parallel for faster execution
   * Set to false if tests depend on each other
   */
  fullyParallel: true,

  /**
   * FAIL ON CONSOLE ERRORS
   * If true, tests fail when there's a console.error in the browser
   * Good for catching JavaScript errors
   */
  forbidOnly: !!process.env.CI,

  /**
   * RETRIES
   * How many times to retry a failed test
   * 0 = no retries locally, 2 retries in CI (GitHub Actions)
   */
  retries: process.env.CI ? 2 : 0,

  /**
   * WORKERS
   * How many tests run at the same time
   * In CI, we use 1 to avoid conflicts; locally, we use more for speed
   */
  workers: process.env.CI ? 1 : undefined,

  /**
   * REPORTER
   * How test results are displayed
   * - 'html' creates a nice visual report you can open in browser
   * - 'list' shows results in terminal
   */
  reporter: [
    ['list'],           // Shows results in terminal while running
    ['html', { open: 'never' }]  // Creates HTML report after tests complete
  ],

  /**
   * GLOBAL TEST SETTINGS
   * These apply to ALL tests unless overridden
   */
  use: {
    /**
     * BASE URL
     * The starting URL for your application
     * All page.goto('/path') will be relative to this
     * 
     * IMPORTANT: Change this to your actual app URL!
     * - For local testing: http://localhost:5173 (Vite default)
     * - For deployed testing: Your production URL
     */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    /**
     * TRACE
     * Records a detailed trace of what happened during the test
     * 'on-first-retry' = only records when a test is retried after failing
     * Useful for debugging: shows screenshots, network calls, etc.
     */
    trace: 'on-first-retry',

    /**
     * SCREENSHOT
     * When to take screenshots
     * 'only-on-failure' = captures screenshot when test fails
     */
    screenshot: 'only-on-failure',

    /**
     * VIDEO
     * When to record video of the test
     * 'retain-on-failure' = keeps video only for failed tests
     */
    video: 'retain-on-failure',

    /**
     * ACTION TIMEOUT
     * How long to wait for actions (click, type, etc.) before failing
     * 15 seconds is usually enough
     */
    actionTimeout: 15000,

    /**
     * NAVIGATION TIMEOUT
     * How long to wait for page loads
     */
    navigationTimeout: 30000,
  },

  /**
   * BROWSER PROJECTS
   * Which browsers to test in
   * Each browser will run all your tests
   */
  projects: [
    /**
     * SETUP PROJECT
     * This runs FIRST before any other tests
     * Used to log in and save authentication state
     * So other tests don't need to log in again
     */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,  // Matches files ending in .setup.ts
    },

    /**
     * CHROME/CHROMIUM
     * Most popular browser - tests should definitely pass here
     */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use saved login state from setup
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],  // Run 'setup' project first
    },

    /**
     * FIREFOX
     * Second most popular browser
     * Uncomment to also test in Firefox
     */
    // {
    //   name: 'firefox',
    //   use: { 
    //     ...devices['Desktop Firefox'],
    //     storageState: 'tests/e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    /**
     * SAFARI/WEBKIT
     * Apple's browser - important for Mac users
     * Uncomment to also test in Safari
     */
    // {
    //   name: 'webkit',
    //   use: { 
    //     ...devices['Desktop Safari'],
    //     storageState: 'tests/e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },

    /**
     * MOBILE TESTING
     * Test on mobile screen sizes
     * Uncomment to test mobile responsiveness
     */
    // {
    //   name: 'Mobile Chrome',
    //   use: { 
    //     ...devices['Pixel 5'],
    //     storageState: 'tests/e2e/.auth/user.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  /**
   * WEB SERVER
   * Automatically starts your app before running tests
   * Only used when running locally (not in CI where app is already deployed)
   */
  webServer: process.env.CI ? undefined : {
    /**
     * COMMAND
     * The command to start your application
     */
    command: 'npm run dev',
    
    /**
     * URL
     * Where to check if the app is running
     */
    url: 'http://localhost:5173',
    
    /**
     * REUSE EXISTING SERVER
     * If app is already running, don't start a new one
     */
    reuseExistingServer: true,
    
    /**
     * TIMEOUT
     * How long to wait for the app to start (2 minutes)
     */
    timeout: 120000,
  },
});
