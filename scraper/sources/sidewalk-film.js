const puppeteer = require('puppeteer');

/**
 * Sidewalk Film Festival Scraper (Puppeteer version)
 * Uses headless browser to handle JavaScript-rendered content
 * https://sidewalkfest.com/events-list/
 */
class SidewalkFilmScraper {
  constructor() {
    this.baseUrl = 'https://sidewalkfest.com';
    this.scheduleUrl = 'https://sidewalkfest.com/events-list/';
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
      console.log('Scraping Sidewalk Film Festival events with Puppeteer...');
      const page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Navigate to events page
      await page.goto(this.scheduleUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for events to load (FacetWP structure)
      try {
        await page.waitForSelector('.fwpl-row.event, .event, article', { timeout: 10000 });
      } catch (e) {
        console.log('No events found or different structure');
        return [];
      }

      // Extract events from page
      const events = await page.evaluate((baseUrl) => {
        const eventElements = document.querySelectorAll('.fwpl-row.event, .event, article.event-item');
        const results = [];

        eventElements.forEach(el => {
          try {
            // Extract title
            const titleEl = el.querySelector('h3, h2, .film-title, .entry-title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            if (!title) return;

            // Extract date
            const dateEl = el.querySelector('.tickets-for-date, .date-section, time, .event-date');
            const dateText = dateEl ? dateEl.textContent.trim() : '';

            // Extract time
            const timeEl = el.querySelector('.date-buttons, .showtime, .event-time');
            const timeText = timeEl ? timeEl.textContent.trim() : '';

            // Extract venue
            const venueEl = el.querySelector('.venue-wrapper, .venue, .event-venue');
            const venue = venueEl ? venueEl.textContent.trim() : 'Sidewalk Film Center';

            // Extract description
            const descEl = el.querySelector('.description, .synopsis, .entry-content, p');
            const description = descEl ? descEl.textContent.trim().substring(0, 300) : '';

            // Extract image
            const imgEl = el.querySelector('img');
            let imageUrl = imgEl ? imgEl.src : '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = baseUrl + imageUrl;
            }

            // Extract link
            const linkEl = el.querySelector('a');
            let link = linkEl ? linkEl.href : '';
            if (!link && el.tagName === 'A') {
              link = el.href;
            }
            if (link && !link.startsWith('http') && link.startsWith('/')) {
              link = baseUrl + link;
            }

            results.push({
              name: title,
              title: title,
              description: description,
              date: dateText,
              time: timeText,
              venue: venue,
              location: venue,
              city: 'Birmingham',
              state: 'AL',
              category: 'Film',
              image: imageUrl,
              imageUrl: imageUrl,
              url: link || `${baseUrl}/events-list/`,
              link: link || `${baseUrl}/events-list/`
            });
          } catch (error) {
            console.error('Error parsing event:', error);
          }
        });

        return results;
      }, this.baseUrl);

      console.log(`Found ${events.length} Sidewalk Film Festival events`);
      return events;

    } catch (error) {
      console.error('Error scraping Sidewalk Film Festival:', error.message);
      return [];
    } finally {
      await browser.close();
    }
  }
}

module.exports = SidewalkFilmScraper;
