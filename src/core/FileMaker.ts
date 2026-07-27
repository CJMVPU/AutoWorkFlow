import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { output, outputSus } from '../utils/logger';
import { DBConnection } from '../db/connection';
import * as path from 'path';

export class FileMaker {
  private static instance: FileMaker;
  private initialized: boolean = false;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private readonly userDataDir = path.join(process.cwd(), 'playwright_user_data');
  private readonly userAgentStr = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";

  private constructor() {}

  public static getInstance(): FileMaker {
    if (!FileMaker.instance) {
      FileMaker.instance = new FileMaker();
    }
    return FileMaker.instance;
  }

  public async init(): Promise<void> {
    if (!this.initialized) {
      output("opening browser and connect db");
      // Ensure DB is initialized
      DBConnection.getInstance();
      output("db connected");

      this.browser = await chromium.launch({ headless: true });
      this.context = await this.browser.newContext({
        userAgent: this.userAgentStr,
      });
      this.page = await this.context.newPage();

      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      this.initialized = true;
      outputSus("Browser initialized successfully.");
    }
  }

  public async close(): Promise<void> {
    if (this.initialized) {
      output("closing browser and disconnect db");
      // Not strictly closing DB to allow other modules to use it,
      // but in a real app might want to manage DB lifecycle here if FileMaker is the only consumer
      if (this.browser) {
        await this.browser.close();
      }
      this.initialized = false;
    }
  }

  public getPage(): Page | null {
    return this.page;
  }
}
