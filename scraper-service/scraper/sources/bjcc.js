const { launchBrowser } = require('../browser-config');

/**
 * BJCC (Birmingham-Jefferson Convention Complex) Event Scraper (Puppeteer version)
 * Uses headless browser for Modern Events Calendar plugin
 */
class BJCCScraper {
  constructor() {
    this.baseUrl = 'https://www.bjcc.org/events/';
  }

  async scrape() {
    const browser = await launchBrowser();

    try {
      console.log('Scraping BJCC events with Puppeteer...');
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for Modern Events Calendar to load
      try {
        await page.waitForSelector('.mec-event-article, .event-wrapper, article', { timeout: 10000 });
      } catch (e) {
        console.log('No events found on BJCC');
        return [];
      }

      const events = await page.evaluate(() => {
        const eventElements = document.querySelectorAll('.mec-event-article, .event-wrapper, article[class*="mec-event"], article.event');
        const results = [];

        eventElements.forEach(el => {
          try {
            const titleEl = el.querySelector('.mec-event-title, h3, h2, a[title]');
            const title = titleEl ? (titleEl.textContent.trim() || titleEl.getAttribute('title')) : '';

            if (!title) return;

            const dateEl = el.querySelector('.mec-event-d, .mec-start-date, .event-date');
            const dateText = dateEl ? dateEl.textContent.trim() : '';

            const timeEl = el.querySelector('.mec-time-details, .event-time');
            const timeText = timeEl ? timeEl.textContent.trim() : '';

            const venueEl = el.querySelector('.mec-event-address-name, .mec-venue-details, .event-location');
            const venue = venueEl ? venueEl.textContent.trim() : 'BJCC';

            const descEl = el.querySelector('.mec-event-description, .event-content');
            const description = descEl ? descEl.textContent.trim().substring(0, 300) : '';

            const imgEl = el.querySelector('img');
            const imageUrl = imgEl ? imgEl.src : '';

            const categoryEl = el.querySelector('.mec-event-category, .event-category');
            const category = categoryEl ? categoryEl.textContent.trim() : 'General';

            const linkEl = el.querySelector('.mec-event-title a, a.mec-booking-button, a');
            let link = linkEl ? linkEl.href : '';

            results.push({
              name: title,
              title: title,
              description: description,
              date: dateText,
              time: timeText,
              venue: venue,
              location: venue,
              address: '2100 Richard Arrington Jr Blvd N',
              city: 'Birmingham',
              state: 'AL',
              zipCode: '35203',
              category: category,
              image: imageUrl,
              imageUrl: imageUrl,
              url: link || 'https://www.bjcc.org/events/',
              link: link || 'https://www.bjcc.org/events/'
            });
          } catch (error) {
            console.error('Error parsing event:', error);
          }
        });

        return results;
      });

      console.log(`Found ${events.length} BJCC events`);
      return events;

    } catch (error) {
      console.error('Error scraping BJCC:', error.message);
      return [];
    } finally {
      await browser.close();
    }
  }
}

module.exports = BJCCScraper;
