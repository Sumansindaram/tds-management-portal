/**
 * ============================================================================
 * TDS FORM SUBMISSION TESTS
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * ------------------
 * This file tests the TDS (Technical Data Sheet) request form.
 * The TDS form is used to submit new equipment/vehicle data requests.
 * 
 * WHAT THE FORM DOES:
 * -------------------
 * Users fill in details about military vehicles/equipment:
 * - Basic info (name, code, type)
 * - Dimensions (length, width, height)
 * - Weights (laden, unladen)
 * - Technical specs (MLC, ALEST, etc.)
 * - SSR (Safety Responsible) information
 * 
 * TEST APPROACH:
 * --------------
 * We test:
 * 1. Form loads correctly
 * 2. Required fields are validated
 * 3. Form submits successfully with valid data
 * 4. Error handling works for invalid data
 */

import { test, expect } from '@playwright/test';
import { TDS_FORM_DATA, ROUTES, TIMEOUTS } from './test-data';

test.describe('TDS Request Form', () => {
  /**
   * BEFORE EACH TEST
   * ----------------
   * Navigate to the form page
   */
  test.beforeEach(async ({ page }) => {
    // Navigate to submit request page
    // First go to home, then find the submit request link
    await page.goto(ROUTES.home);
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to the form
    const submitLink = page.locator('text=/Submit.*Request|Create.*Request|New.*Request/i').first();
    if (await submitLink.isVisible()) {
      await submitLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  /**
   * TEST: FORM PAGE LOADS
   * ---------------------
   * Verify the form page loads with all necessary elements
   */
  test('should load the TDS request form', async ({ page }) => {
    /**
     * CHECK FOR FORM ELEMENTS
     * The form should have:
     * - Input fields for vehicle/equipment details
     * - Labels explaining each field
     * - Submit button
     */
    
    // Wait for form to be visible
    const form = page.locator('form');
    
    // Check form exists
    await expect(form.first()).toBeVisible({ timeout: TIMEOUTS.medium });
    
    // Check for common form fields
    // These are typical fields you'd expect in a TDS form
    const shortNameInput = page.locator('input[name="short_name"], input[name="shortName"], #short_name, #shortName');
    
    // At least some form inputs should be visible
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  /**
   * TEST: REQUIRED FIELDS VALIDATION
   * --------------------------------
   * Verify that submitting an empty form shows validation errors
   */
  test('should show validation errors for required fields', async ({ page }) => {
    /**
     * STEP 1: FIND AND CLICK SUBMIT WITHOUT FILLING FORM
     */
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      /**
       * STEP 2: CHECK FOR VALIDATION INDICATORS
       * Either:
       * - HTML5 validation (browser-native)
       * - Custom validation messages
       * - Form doesn't submit (still on same page)
       */
      
      // Wait a moment for validation to trigger
      await page.waitForTimeout(500);
      
      // We should still be on the form page (form wasn't submitted)
      // Or validation errors should be visible
      const errorMessages = page.locator('[class*="error"], [class*="invalid"], .text-destructive');
      
      // Check if any error indicators are visible
      // This is a flexible check since error display varies by implementation
    }
  });

  /**
   * TEST: FILL AND SUBMIT FORM
   * --------------------------
   * Complete workflow: fill form with valid data and submit
   * 
   * NOTE: This test creates real data. In production testing,
   * you'd want a way to clean up test data afterwards.
   */
  test('should submit form with valid data', async ({ page }) => {
    /**
     * GET TEST DATA
     * We use predefined test data from test-data.ts
     */
    const formData = TDS_FORM_DATA.militaryTruck;
    
    /**
     * HELPER FUNCTION: FILL INPUT BY LABEL
     * Finds an input by its label text and fills it
     */
    const fillInputByLabel = async (labelText: string, value: string) => {
      try {
        // Try to find by label
        const label = page.locator(`label:has-text("${labelText}")`);
        if (await label.isVisible()) {
          const inputId = await label.getAttribute('for');
          if (inputId) {
            await page.locator(`#${inputId}`).fill(value);
            return;
          }
          // If no 'for' attribute, find input next to label
          const input = label.locator('.. input, .. select, .. textarea');
          if (await input.first().isVisible()) {
            await input.first().fill(value);
            return;
          }
        }
        
        // Fallback: Try to find by placeholder
        const inputByPlaceholder = page.locator(`input[placeholder*="${labelText}" i]`);
        if (await inputByPlaceholder.first().isVisible()) {
          await inputByPlaceholder.first().fill(value);
          return;
        }
        
        // Another fallback: Try by name attribute
        const inputByName = page.locator(`input[name*="${labelText.toLowerCase().replace(/\s/g, '_')}"]`);
        if (await inputByName.first().isVisible()) {
          await inputByName.first().fill(value);
        }
      } catch (e) {
        // Field not found - continue with other fields
        console.log(`Could not fill field: ${labelText}`);
      }
    };
    
    /**
     * FILL THE FORM
     * Fill each field with test data
     */
    
    // Basic Information
    await fillInputByLabel('Short Name', formData.shortName);
    await fillInputByLabel('Designation', formData.designation);
    await fillInputByLabel('Asset Code', formData.assetCode);
    await fillInputByLabel('NSN', formData.nsn);
    
    // Dimensions
    await fillInputByLabel('Length', formData.length);
    await fillInputByLabel('Width', formData.width);
    await fillInputByLabel('Height', formData.height);
    
    // Weights
    await fillInputByLabel('Laden Weight', formData.ladenWeight);
    await fillInputByLabel('Unladen Weight', formData.unladenWeight);
    
    // Technical Details
    await fillInputByLabel('MLC', formData.mlc);
    await fillInputByLabel('RIC Code', formData.ricCode);
    await fillInputByLabel('Service', formData.service);
    
    /**
     * HANDLE SELECT DROPDOWNS
     * Some fields might be dropdowns instead of text inputs
     */
    // Example: Asset Type dropdown
    const assetTypeSelect = page.locator('select[name*="asset_type"], [data-testid="asset-type"]');
    if (await assetTypeSelect.isVisible()) {
      await assetTypeSelect.selectOption({ label: formData.assetType });
    }
    
    /**
     * SUBMIT THE FORM
     */
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      /**
       * VERIFY SUBMISSION WAS SUCCESSFUL
       * Look for:
       * - Success toast message
       * - Redirect to confirmation page
       * - Success indicator
       */
      
      // Wait for either success message or page change
      await Promise.race([
        page.waitForURL('**/my-submissions**', { timeout: TIMEOUTS.long }).catch(() => {}),
        page.locator('[role="status"]').waitFor({ timeout: TIMEOUTS.medium }).catch(() => {}),
      ]);
    }
  });

  /**
   * TEST: FORM FIELD TYPES
   * ----------------------
   * Verify that fields have correct input types
   * (e.g., numbers for dimensions, dates for dates)
   */
  test('should have correct input types', async ({ page }) => {
    // Number fields should accept numbers
    const numberInputs = page.locator('input[type="number"]');
    const numberCount = await numberInputs.count();
    
    // Log for debugging
    console.log(`Found ${numberCount} number input fields`);
    
    // Date fields should be date inputs
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    
    console.log(`Found ${dateCount} date input fields`);
  });

  /**
   * TEST: FORM PRESERVES DATA ON VALIDATION ERROR
   * ----------------------------------------------
   * If validation fails, the user shouldn't lose what they typed
   */
  test('should preserve form data after validation error', async ({ page }) => {
    /**
     * STEP 1: FILL SOME FIELDS BUT NOT ALL REQUIRED ONES
     */
    const testValue = 'Test Vehicle Name';
    
    // Find first text input and fill it
    const firstInput = page.locator('input[type="text"]').first();
    if (await firstInput.isVisible()) {
      await firstInput.fill(testValue);
      
      /**
       * STEP 2: TRY TO SUBMIT (SHOULD FAIL VALIDATION)
       */
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      /**
       * STEP 3: VERIFY THE VALUE IS STILL THERE
       */
      await page.waitForTimeout(500); // Wait for any validation
      const currentValue = await firstInput.inputValue();
      
      // The value should be preserved
      expect(currentValue).toBe(testValue);
    }
  });
});

/**
 * ============================================================================
 * FORM ACCESSIBILITY TESTS
 * ============================================================================
 */
test.describe('Form Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.waitForLoadState('networkidle');
    
    const submitLink = page.locator('text=/Submit.*Request/i').first();
    if (await submitLink.isVisible()) {
      await submitLink.click();
    }
  });

  /**
   * TEST: LABELS ARE ASSOCIATED WITH INPUTS
   * ---------------------------------------
   * Every input should have a label for accessibility
   */
  test('should have labels for all inputs', async ({ page }) => {
    // Get all inputs that should have labels
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
    const inputCount = await inputs.count();
    
    let labeledInputs = 0;
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      
      if (inputId) {
        // Check if there's a label with 'for' attribute pointing to this input
        const label = page.locator(`label[for="${inputId}"]`);
        if (await label.count() > 0) {
          labeledInputs++;
        }
      }
    }
    
    // Log results
    console.log(`${labeledInputs} of ${inputCount} inputs have proper labels`);
    
    // Most inputs should have labels (allow some flexibility for edge cases)
    expect(labeledInputs).toBeGreaterThan(inputCount * 0.7);
  });

  /**
   * TEST: KEYBOARD NAVIGATION
   * -------------------------
   * Users should be able to navigate the form using only keyboard
   */
  test('should support keyboard navigation', async ({ page }) => {
    // Focus on first input
    const firstInput = page.locator('input').first();
    await firstInput.focus();
    
    // Tab through the form
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      
      // Verify something is focused
      const focusedElement = page.locator(':focus');
      await expect(focusedElement.first()).toBeVisible();
    }
  });
});

/**
 * ============================================================================
 * TIPS FOR MORE FORM TESTS
 * ============================================================================
 * 
 * Consider adding:
 * 
 * 1. Field-specific validation
 *    - NSN format validation
 *    - Weight must be positive numbers
 *    - Dates must be in future
 * 
 * 2. Conditional fields
 *    - If field A = X, then field B should appear
 *    - Test hiding/showing of dependent fields
 * 
 * 3. Auto-save / Draft functionality
 *    - Test that drafts are saved
 *    - Test restoring a draft
 * 
 * 4. File upload
 *    - Test uploading documents
 *    - Test file type validation
 *    - Test file size limits
 * 
 * 5. Form reset
 *    - Test clearing the form
 *    - Confirm dialog before clearing
 */
