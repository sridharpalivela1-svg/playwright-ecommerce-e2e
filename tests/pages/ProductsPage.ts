import { type Page, type Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly cartLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartLink = page.locator('[data-testid="cart-link"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
  }

  async goto() {
    await this.page.goto('/products');
  }

  getProductItem(productId: string): Locator {
    return this.page.locator(`[data-testid="product-item-${productId}"]`);
  }

  getAddToCartButton(productId: string): Locator {
    return this.page.locator(`[data-testid="add-to-cart-${productId}"]`);
  }

  async addProductToCart(productId: string) {
    await this.getAddToCartButton(productId).click();
  }

  async goToCart() {
    await this.cartLink.click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
