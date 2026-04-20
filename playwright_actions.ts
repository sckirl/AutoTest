import { Page } from 'playwright';

export class AutomationExercisePage {
  constructor(private page: Page) {}

  // Header
  async clickHeaderLogo() {
    await this.page.locator("//div[@class='logo pull-left']/a/img[@src='/static/images/home/logo.png']").click();
  }

  async clickHeaderHome() {
    await this.page.locator("//a[contains(text(),'Home')]").click();
  }

  async clickHeaderProducts() {
    await this.page.locator("//a[contains(text(),'Products')]").click();
  }

  async clickHeaderCart() {
    await this.page.locator("//a[contains(text(),'Cart')]").click();
  }

  async clickHeaderLogin() {
    await this.page.locator("//a[contains(text(),'Signup / Login')]").click();
  }

  async clickHeaderTestCases() {
    await this.page.locator("//a[contains(text(),'Test Cases')]").click();
  }

  async clickHeaderAPITesting() {
    await this.page.locator("//a[contains(text(),'API Testing')]").click();
  }

  async clickHeaderVideoTutorials() {
    await this.page.locator("//a[contains(text(),'Video Tutorials')]").click();
  }

  async clickHeaderContactUs() {
    await this.page.locator("//a[contains(text(),'Contact us')]").click();
  }

  // Slider
  async getSliderCarousel() {
    return this.page.locator("#slider-carousel");
  }

  // Category
  async clickCategoryWomen() {
    await this.page.locator("//a[@href='#Women']").click();
  }

  async clickCategoryMen() {
    await this.page.locator("//a[@href='#Men']").click();
  }

  async clickCategoryKids() {
    await this.page.locator("//a[@href='#Kids']").click();
  }

  async clickCategoryWomenDress() {
    await this.page.locator("//div[@id='Women']//a[contains(text(),'Dress')]").click();
  }

  async clickCategoryWomenTops() {
    await this.page.locator("//div[@id='Women']//a[contains(text(),'Tops')]").click();
  }

  async clickCategoryWomenSaree() {
    await this.page.locator("//div[@id='Women']//a[contains(text(),'Saree')]").click();
  }

  async clickCategoryMenTshirts() {
    await this.page.locator("//div[@id='Men']//a[contains(text(),'Tshirts')]").click();
  }

  async clickCategoryMenJeans() {
    await this.page.locator("//div[@id='Men']//a[contains(text(),'Jeans')]").click();
  }

  async clickCategoryKidsDress() {
    await this.page.locator("//div[@id='Kids']//a[contains(text(),'Dress')]").click();
  }

  async clickCategoryKidsTopsShirts() {
    await this.page.locator("//div[@id='Kids']//a[contains(text(),'Tops & Shirts')]").click();
  }

  // Brands
  async clickBrandsPolo() {
    await this.page.locator("//a[@href='/brand_products/Polo']").click();
  }

  async clickBrandsHM() {
    await this.page.locator("//a[@href='/brand_products/H&M']").click();
  }

  async clickBrandsMadame() {
    await this.page.locator("//a[@href='/brand_products/Madame']").click();
  }

  async clickBrandsMastHarbour() {
    await this.page.locator("//a[@href='/brand_products/Mast & Harbour']").click();
  }

  async clickBrandsBabyhug() {
    await this.page.locator("//a[@href='/brand_products/Babyhug']").click();
  }

  async clickBrandsAllenSollyJunior() {
    await this.page.locator("//a[@href='/brand_products/Allen Solly Junior']").click();
  }

  async clickBrandsKookieKids() {
    await this.page.locator("//a[@href='/brand_products/Kookie Kids']").click();
  }

  async clickBrandsBiba() {
    await this.page.locator("//a[@href='/brand_products/Biba']").click();
  }

  // Featured Items
  async clickFeaturedItemAddToCart() {
    await this.page.locator("//a[@data-product-id='1']").click();
  }

  async clickFeaturedItemViewProduct() {
    await this.page.locator("//a[@href='/product_details/1']").click();
  }

  // Footer
  async fillFooterSubscriptionEmail(email: string) {
    await this.page.locator("#susbscribe_email").fill(email);
  }

  async clickFooterSubscriptionButton() {
    await this.page.locator("#subscribe").click();
  }
}
