import { type Page, type Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly checkoutButton: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.emptyCartMessage = page.locator('[data-testid="cart-empty-message"]');
  }

  async goto() {
    await this.page.goto('/cart');
  }

  getCartItem(productId: string): Locator {
    return this.page.locator(`[data-testid="cart-item-${productId}"]`);
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async isCartItemVisible(productId: string): Promise<boolean> {
    return await this.getCartItem(productId).isVisible();
  }

  async isEmptyCartMessageVisible(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }
}
