import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ConfirmationPage } from '../pages/ConfirmationPage';

test.describe('E-Commerce Checkout Suite', () => {
  test('should successfully complete the checkout flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const confirmationPage = new ConfirmationPage(page);

    // 1. User logs in
    await loginPage.goto();
    await loginPage.login('testuser@example.com', 'password123');
    await expect(page).toHaveURL('/products');

    // 2. User adds at least one product to the cart from the products page
    await productsPage.addProductToCart('1');

    // 3. User navigates to the cart and proceeds to checkout
    await productsPage.goToCart();
    await expect(page).toHaveURL('/cart');
    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL('/checkout');

    // 4. User fills in shipping and payment details on the checkout page
    await checkoutPage.fillShippingAddress('123 Test Street, Suite 400');
    await checkoutPage.fillPaymentInfo('4111-2222-3333-4444');

    // 5. User confirms the purchase
    await checkoutPage.confirmPurchase();
    await expect(page).toHaveURL('/confirmation');

    // 6. User sees an order confirmation message on the final page
    await expect(confirmationPage.orderConfirmationMessage).toBeVisible();
  });

  test('should display an error when checking out with an empty cart', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const cartPage = new CartPage(page);

    // User logs in
    await loginPage.goto();
    await loginPage.login('emptycartuser@example.com', 'password123');
    await expect(page).toHaveURL('/products');

    // User navigates directly to the cart page without adding any products
    await cartPage.goto();
    await expect(page).toHaveURL('/cart');

    // User clicks the checkout button
    await cartPage.proceedToCheckout();

    // The application should display an error message and prevent navigation to the checkout page
    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(page).toHaveURL('/cart');
  });

  test('should preserve cart contents after session expiry and re-login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // User logs in and adds a product to the cart
    await loginPage.goto();
    await loginPage.login('sessionuser@example.com', 'password123');
    await expect(page).toHaveURL('/products');
    await productsPage.addProductToCart('1');

    // The test simulates an expired session by clearing cookies or local storage
    await page.context().clearCookies();

    // User attempts to navigate to a protected page like /checkout
    await checkoutPage.goto();

    // The application must redirect the user to the /login page
    await expect(page).toHaveURL(/\/login/);

    // User logs in again
    await loginPage.login('sessionuser@example.com', 'password123');

    // The application should redirect the user back to the cart, and the previously added product must still be present
    await expect(page).toHaveURL(/\/cart/);
    await expect(cartPage.getCartItem('1')).toBeVisible();
  });
});
