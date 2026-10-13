import { type Page, type Locator } from '@playwright/test';

export class ConfirmationPage {
  readonly page: Page;
  readonly orderConfirmationMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderConfirmationMessage = page.locator('[data-testid="order-confirmation-message"]');
  }

  async goto() {
    await this.page.goto('/confirmation');
  }

  async getConfirmationText(): Promise<string | null> {
    return await this.orderConfirmationMessage.textContent();
  }

  async isConfirmationMessageVisible(): Promise<boolean> {
    return await this.orderConfirmationMessage.isVisible();
  }
}
