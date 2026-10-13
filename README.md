# E-Commerce End-to-End Test Suite (Playwright & Page Object Model)

This repository contains an automated end-to-end (E2E) test suite for a sample e-commerce web application, built with [Playwright](https://playwright.dev/) and TypeScript adhering to the **Page Object Model (POM)** design pattern.

---

## Project Overview

The objective of this project is to simulate real user journeys across an e-commerce platform and validate system integrity, state transitions, and UI interactions with robust, maintainable test automation.

### Key Capabilities
- **Page Object Model (POM)**: Complete decoupling of test logic from selector definitions. Zero raw locators in test specs.
- **Resilient Selectors**: Built around dedicated `data-testid` attributes.
- **Automated Failure Artifacts**: Automatic capture of screenshots, videos, and execution traces on test failures.
- **Comprehensive Scenarios**:
  - Full end-to-end checkout happy path.
  - Empty cart validation preventing unauthorized checkout.
  - Protected route guard with session expiry and cart persistence upon re-login.
- **CI/CD Automation**: GitHub Actions workflow running in headless mode and archiving the Playwright HTML report.
- **Integrated Mock Application**: Built-in HTTP server (`server.js`) on port 8080 automatically managed via Playwright's `webServer` configuration.

---

## Directory Structure

```text
.
├── .github/
│   └── workflows/
│       └── playwright.yml         # CI pipeline configuration
├── tests/
│   ├── pages/                     # Page Object Model classes
│   │   ├── CartPage.ts
│   │   ├── CheckoutPage.ts
│   │   ├── ConfirmationPage.ts
│   │   ├── LoginPage.ts
│   │   └── ProductsPage.ts
│   └── specs/                     # End-to-end test specifications
│       └── checkout.spec.ts
├── playwright.config.ts           # Playwright test & artifact configuration
├── package.json                   # Project scripts and dependencies
├── server.js                      # Target mock e-commerce web application
├── tsconfig.json                  # TypeScript compiler settings
└── README.md                      # Documentation
```

---

## Setup & Installation

### Prerequisites
- Node.js (version 18 or later)
- npm (Node Package Manager)

### Installation
1. Clone the repository and navigate into the project directory:
   ```bash
   cd playwright-ecommerce-e2e
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```
   *(In CI environments, run `npm ci`)*

3. Install the required Playwright browser binaries and dependencies:
   ```bash
   npx playwright install --with-deps
   ```

---

## Running Tests

Playwright can automatically start the built-in mock server when running tests. You can also run the server independently using `npm start`.

### Execute the Test Suite
Run all tests in headless mode:
```bash
npx playwright test
```
or using the npm script:
```bash
npm test
```

### Run Tests in Headed Mode
To watch tests execute in an open browser window:
```bash
npx playwright test --headed
```
or:
```bash
npm run test:headed
```

### Run with Playwright UI Mode
To use the interactive test runner and live time-travel debugger:
```bash
npx playwright test --ui
```
or:
```bash
npm run test:ui
```

### View Test Reports
After test execution, launch the HTML report:
```bash
npx playwright show-report
```

---

## Failure Artifacts & Debugging

The test configuration in `playwright.config.ts` captures artifacts to accelerate debugging when failures occur:

- **Screenshots**: Configured as `'only-on-failure'` – records the final visual state when an assertion or action fails.
- **Videos**: Configured as `'retain-on-failure'` – records full video playback of failed test attempts.
- **Traces**: Configured as `'on-first-retry'` – captures a timeline trace with DOM snapshots, console logs, and network events.

### Inspecting Traces
To open and analyze a captured trace zip file locally:
```bash
npx playwright show-trace test-results/<test-run-folder>/trace.zip
```
You can also drag and drop the `.zip` file into [https://trace.playwright.dev/](https://trace.playwright.dev/).

---

## Target Application Specification

The mock server exposes the following endpoints and `data-testid` attributes:

1. **Login Page (`/login`)**
   - Email Input: `data-testid="login-email"`
   - Password Input: `data-testid="login-password"`
   - Submit Button: `data-testid="login-submit"`
2. **Products Page (`/products`)**
   - Product Item: `data-testid="product-item-{productId}"` (e.g., `product-item-1`)
   - Add to Cart: `data-testid="add-to-cart-{productId}"`
   - Cart Link: `data-testid="cart-link"`
   - Logout: `data-testid="logout-button"`
3. **Cart Page (`/cart`)**
   - Cart Item: `data-testid="cart-item-{productId}"`
   - Checkout Button: `data-testid="checkout-button"`
   - Empty Cart Error: `data-testid="cart-empty-message"`
4. **Checkout Page (`/checkout`)**
   - Shipping Address Input: `data-testid="shipping-address"`
   - Payment Info Input: `data-testid="payment-info"`
   - Confirm Purchase: `data-testid="confirm-purchase-button"`
5. **Confirmation Page (`/confirmation`)**
   - Success Message: `data-testid="order-confirmation-message"`

---

## Continuous Integration (CI)

A GitHub Actions workflow is defined in `.github/workflows/playwright.yml`. It automatically triggers on pushes and pull requests to `main` and `master`, performing:
1. Repository checkout (`actions/checkout@v4`).
2. Node.js setup (`actions/setup-node@v4`).
3. Clean dependency installation (`npm ci`).
4. Browser provisioning (`npx playwright install --with-deps`).
5. Execution of all tests (`npx playwright test`).
6. Archival of the `playwright-report/` artifact (`actions/upload-artifact@v4`) with `if: always()`.
