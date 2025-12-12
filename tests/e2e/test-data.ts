/**
 * ============================================================================
 * TEST DATA FILE
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * ------------------
 * This file contains all the test data that Playwright will use when running
 * automated tests. Instead of hardcoding values in tests, we keep them here
 * so they're easy to find and update.
 * 
 * WHY SEPARATE TEST DATA?
 * -----------------------
 * 1. Easy to update: Change data in one place, affects all tests
 * 2. Reusable: Same data can be used across multiple tests
 * 3. Readable: Tests focus on actions, not data setup
 * 4. Environment-specific: Can have different data for dev/staging/prod
 * 
 * IMPORTANT SECURITY NOTE:
 * ------------------------
 * NEVER commit real passwords or sensitive data to version control!
 * Use environment variables for sensitive data in CI/CD.
 */

/**
 * TEST USER CREDENTIALS
 * ---------------------
 * These are the login credentials for testing.
 * 
 * For CI/CD (GitHub Actions), these should be set as GitHub Secrets:
 * - Go to your repo → Settings → Secrets and variables → Actions
 * - Add: TEST_USER_EMAIL, TEST_USER_PASSWORD
 * 
 * For local testing, you can create a .env.test file (add to .gitignore!)
 */
export const TEST_USERS = {
  /**
   * ADMIN USER
   * Has full access to all features including user management
   * Used to test admin-only features
   */
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.mod.gov.uk',
    password: process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!',
    fullName: 'Test Admin User',
    role: 'admin' as const,
  },

  /**
   * SUPER ADMIN USER
   * Has highest level access
   * Used to test super admin features
   */
  superAdmin: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL || 'superadmin@test.mod.gov.uk',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || 'TestPassword123!',
    fullName: 'Test Super Admin',
    role: 'super_admin' as const,
  },

  /**
   * PT (REGULAR) USER
   * Limited access - can only see own submissions
   * Used to test restricted access
   */
  ptUser: {
    email: process.env.TEST_PT_USER_EMAIL || 'pt.user@test.mod.gov.uk',
    password: process.env.TEST_PT_USER_PASSWORD || 'TestPassword123!',
    fullName: 'Test PT User',
    role: 'user' as const,
  },
};

/**
 * TDS FORM TEST DATA
 * ------------------
 * Sample data for creating TDS (Technical Data Sheet) entries
 * These represent different types of military vehicles/equipment
 */
export const TDS_FORM_DATA = {
  /**
   * SAMPLE VEHICLE 1: Military Truck
   */
  militaryTruck: {
    // Basic Information
    shortName: 'MAN SV',
    designation: 'MAN Support Vehicle',
    assetCode: 'MAN-SV-001',
    assetType: 'B Vehicle',
    nsn: '2320-99-123-4567',
    
    // Dimensions (in meters)
    length: '7.5',
    width: '2.5',
    height: '3.2',
    
    // Weights (in kg)
    ladenWeight: '18000',
    unladenWeight: '8500',
    
    // Technical Details
    mlc: '30',  // Military Load Classification
    alest: 'CAT A',
    lims25: '25',
    lims28: '28',
    
    // Administrative
    ricCode: 'RC001',
    service: 'Army',
    ownerNation: 'UK',
    outOfServiceDate: '2030-12-31',
    
    // SSR Details
    ssrName: 'John Smith',
    ssrEmail: 'john.smith@mod.gov.uk',
  },

  /**
   * SAMPLE VEHICLE 2: Armoured Vehicle
   */
  armouredVehicle: {
    shortName: 'Mastiff PPV',
    designation: 'Mastiff Protected Patrol Vehicle',
    assetCode: 'MAST-PPV-002',
    assetType: 'A Vehicle',
    nsn: '2355-99-234-5678',
    
    length: '7.08',
    width: '2.64',
    height: '2.64',
    
    ladenWeight: '23500',
    unladenWeight: '17500',
    
    mlc: '50',
    alest: 'CAT B',
    lims25: '35',
    lims28: '40',
    
    ricCode: 'RC002',
    service: 'Army',
    ownerNation: 'UK',
    outOfServiceDate: '2035-12-31',
    
    ssrName: 'Jane Doe',
    ssrEmail: 'jane.doe@mod.gov.uk',
  },

  /**
   * SAMPLE EQUIPMENT: Generator
   */
  generator: {
    shortName: 'Gen Set 10kW',
    designation: '10kW Mobile Generator Set',
    assetCode: 'GEN-10KW-003',
    assetType: 'Equipment',
    nsn: '6115-99-345-6789',
    
    length: '1.5',
    width: '0.8',
    height: '1.0',
    
    ladenWeight: '350',
    unladenWeight: '280',
    
    mlc: '1',
    alest: 'CAT C',
    lims25: '5',
    lims28: '5',
    
    ricCode: 'RC003',
    service: 'RAF',
    ownerNation: 'UK',
    outOfServiceDate: '2028-06-30',
    
    ssrName: 'Bob Wilson',
    ssrEmail: 'bob.wilson@mod.gov.uk',
  },
};

/**
 * SSR DIRECTORY TEST DATA
 * -----------------------
 * Sample SSR (Safety Responsible) records for testing the SSR Directory
 */
export const SSR_DATA = {
  /**
   * SAMPLE SSR 1
   */
  ssr1: {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@mod.gov.uk',
    phone: '01onal234567890',
    title: 'Equipment Manager',
    roleType: 'Primary SSR',
    deliveryTeam: 'Defence Equipment & Support',
  },

  /**
   * SAMPLE SSR 2
   */
  ssr2: {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@mod.gov.uk',
    phone: '01onal234567891',
    title: 'Vehicle Specialist',
    roleType: 'Secondary SSR',
    deliveryTeam: 'Army HQ',
  },
};

/**
 * ASSET TEST DATA
 * ---------------
 * Sample assets to add to SSR records
 */
export const ASSET_DATA = {
  asset1: {
    nsn: '2320-99-111-2222',
    assetCode: 'AST-001',
    designation: 'Test Vehicle Alpha',
    assetType: 'B Vehicle',
  },

  asset2: {
    nsn: '2355-99-333-4444',
    assetCode: 'AST-002',
    designation: 'Test Equipment Beta',
    assetType: 'Equipment',
  },
};

/**
 * TDS TOOL TEST DATA
 * ------------------
 * Sample data for testing the TDS Tool calculations
 */
export const TDS_TOOL_DATA = {
  /**
   * CENTER OF GRAVITY CALCULATION
   */
  cogCalculation: {
    totalWeight: '5000',     // kg
    frontAxleWeight: '2500', // kg
    wheelbase: '3.5',        // meters
    // Expected result: CoG at 1.75m from front axle
  },

  /**
   * RESTRAINT SYSTEM CALCULATION
   */
  restraintCalculation: {
    transportationWeight: '8000',  // kg
    forwardAcceleration: '0.8',    // g
    rearwardAcceleration: '0.5',   // g
    lateralAcceleration: '0.5',    // g
    strapRating: '2000',           // daN
    lashingAngle: '45',            // degrees
  },

  /**
   * CONTAINER FIT CHECK
   */
  containerFit: {
    assetLength: '5.5',   // meters
    assetWidth: '2.2',    // meters
    assetHeight: '2.3',   // meters
    assetWeight: '12000', // kg
    // Should fit in 20ft ISO container
  },
};

/**
 * URL PATHS
 * ---------
 * All the pages in the application
 * Using constants prevents typos and makes refactoring easier
 */
export const ROUTES = {
  auth: '/auth',
  home: '/',
  dashboard: '/dashboard',
  mySubmissions: '/my-submissions',
  submitRequest: '/submit-request',
  viewAllRequests: '/admin',
  ssrDirectory: '/ssr-directory',
  tdsTool: '/tds-tool',
  users: '/users',
  userApproval: '/user-approval',
  agentDashboard: '/agent-dashboard',
};

/**
 * TEST TIMEOUTS
 * -------------
 * Consistent timeout values across tests
 */
export const TIMEOUTS = {
  short: 5000,    // 5 seconds - for quick operations
  medium: 15000,  // 15 seconds - for normal operations
  long: 30000,    // 30 seconds - for slow operations
  veryLong: 60000, // 1 minute - for very slow operations
};

/**
 * SELECTORS
 * ---------
 * Common CSS selectors and test IDs used across tests
 * Using data-testid attributes is best practice for test stability
 */
export const SELECTORS = {
  // Navigation
  navDashboard: '[data-testid="nav-dashboard"]',
  navSubmissions: '[data-testid="nav-my-submissions"]',
  navSSRDirectory: '[data-testid="nav-ssr-directory"]',
  navTDSTool: '[data-testid="nav-tds-tool"]',
  
  // Auth
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  
  // Common
  loadingSpinner: '[data-testid="loading"]',
  errorMessage: '[data-testid="error"]',
  successMessage: '[role="status"]',  // Toast notifications
  
  // Tables
  tableRow: 'tbody tr',
  tableCell: 'td',
};
