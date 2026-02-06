const puppeteer = require('puppeteer');

/**
 * Saturn Birmingham Scraper (Puppeteer version)
 * Uses headless browser for SeeTickets widget
 * https://saturnbirmingham.com/calendar
 */
class SaturnBirminghamScraper {
  constructor() {
    this.baseUrl = 'https://www.saturnbirmingham.com';
    this.eventsUrl = 'https://www.saturnbirmingham.com/calendar';
  }

  async scrape() {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    try {
      console.log('Scraping Saturn Birmingham events with Puppeteer...');
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      await page.goto(this.eventsUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for SeeTickets widget to load
      try {
        await page.waitForSelector('.seetickets-list-event-container, .event, article', { timeout: 10000 });
      } catch (e) {
        console.log('No events found on Saturn Birmingham');
        return [];
      }

      const events = await page.evaluate((baseUrl) => {
        const eventElements = document.querySelectorAll('.seetickets-list-event-container, .event, article');
        const results = [];

        eventElements.forEach(el => {
          try {
            const titleEl = el.querySelector('h3 a, h2, h3, .title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            if (!title) return;

            const dateEl = el.querySelector('.event-date, .date, time');
            const dateText = dateEl ? dateEl.textContent.trim() : '';

            // Look for "Doors:" or "Show:" time info
            let timeText = '';
            const paragraphs = el.querySelectorAll('p');
            paragraphs.forEach(p => {
              const text = p.textContent.trim();
              if (text.includes('Doors:') || text.includes('Show:')) {
                timeText = text;
              }
            });

            const descEl = el.querySelector('p.subtitle, .description, .synopsis');
            const description = descEl ? descEl.textContent.trim().substring(0, 300) : '';

            const imgEl = el.querySelector('img');
            let imageUrl = imgEl ? imgEl.src : '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = baseUrl + imageUrl;
            }

            const linkEl = el.querySelector('h3 a, .seetickets-buy-btn, a');
            let link = linkEl ? linkEl.href : '';

            results.push({
              name: title,
              title: title,
              description: description,
              date: dateText,
              time: timeText,
              venue: 'Saturn',
              location: 'Saturn',
              address: '200 41st St S',
              city: 'Birmingham',
              state: 'AL',
              zipCode: '35222',
              category: 'Music',
              image: imageUrl,
              imageUrl: imageUrl,
              url: link || `${baseUrl}/calendar`,
              link: link || `${baseUrl}/calendar`
            });
          } catch (error) {
            console.error('Error parsing event:', error);
          }
        });

        return results;
      }, this.baseUrl);

      console.log(`Found ${events.length} Saturn Birmingham events`);
      return events;

    } catch (error) {
      console.error('Error scraping Saturn Birmingham:', error.message);
      return [];
    } finally {
      await browser.close();
    }
  }
}

module.exports = SaturnBirminghamScraper;
