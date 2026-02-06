const puppeteer = require('puppeteer');

/**
 * Example Puppeteer-based scraper
 * Use this as a template for creating new venue scrapers
 * that require JavaScript rendering
 */
class PuppeteerExampleScraper {
  constructor() {
    this.url = 'https://example.com/events';
    this.name = 'Example Venue';
  }

  async scrape() {
    console.log(`Scraping ${this.name} events with Puppeteer...`);

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // For Vercel/serverless
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();

      // Set user agent to avoid bot detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Navigate to events page
      await page.goto(this.url, {
        waitUntil: 'networkidle2', // Wait for network to settle
        timeout: 30000
      });

      // Wait for event cards to load
      await page.waitForSelector('.event-card', { timeout: 10000 });

      // Extract event data from DOM
      const events = await page.evaluate(() => {
        const eventElements = document.querySelectorAll('.event-card');

        return Array.from(eventElements).map(el => {
          // Extract event details
          const title = el.querySelector('.event-title')?.textContent?.trim() || '';
          const date = el.querySelector('.event-date')?.textContent?.trim() || '';
          const time = el.querySelector('.event-time')?.textContent?.trim() || '';
          const venue = el.querySelector('.venue-name')?.textContent?.trim() || '';
          const description = el.querySelector('.event-description')?.textContent?.trim() || '';
          const image = el.querySelector('img')?.src || '';
          const link = el.querySelector('a')?.href || '';
          const priceText = el.querySelector('.price')?.textContent?.trim() || '';

          return {
            name: title,
            date: date,
            time: time,
            venue: venue,
            description: description,
            image: image,
            url: link,
            price: priceText,
            category: 'General'
          };
        });
      });

      console.log(`Found ${events.length} ${this.name} events`);
      return events;

    } catch (error) {
      console.error(`Error scraping ${this.name}:`, error.message);
      return [];
    } finally {
      // ALWAYS close the browser to free resources
      await browser.close();
    }
  }

  /**
   * Example: Scraping with pagination
   */
  async scrapeWithPagination() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const allEvents = [];

    try {
      const page = await browser.newPage();
      await page.goto(this.url);

      let hasNextPage = true;
      let pageNum = 1;

      while (hasNextPage && pageNum <= 5) { // Max 5 pages
        console.log(`Scraping page ${pageNum}...`);

        // Wait for events to load
        await page.waitForSelector('.event-card');

        // Extract events from current page
        const events = await page.evaluate(() => {
          // ... extraction logic here
        });

        allEvents.push(...events);

        // Check for next page button
        const nextButton = await page.$('.next-page');
        if (nextButton) {
          await nextButton.click();
          await page.waitForNavigation();
          pageNum++;
        } else {
          hasNextPage = false;
        }
      }

      return allEvents;

    } finally {
      await browser.close();
    }
  }

  /**
   * Example: Scraping with form interaction
   */
  async scrapeWithFormInteraction() {
    const browser = await puppeteer.launch({ headless: 'new' });

    try {
      const page = await browser.newPage();
      await page.goto(this.url);

      // Fill in search form
      await page.type('#city-input', 'Birmingham');
      await page.select('#state-select', 'AL');
      await page.click('#search-button');

      // Wait for results
      await page.waitForSelector('.results-list');

      // Extract data
      const events = await page.evaluate(() => {
        // ... extraction logic here
      });

      return events;

    } finally {
      await browser.close();
    }
  }
}

module.exports = PuppeteerExampleScraper;
