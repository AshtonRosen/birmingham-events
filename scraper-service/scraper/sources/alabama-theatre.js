const { launchBrowser } = require('../browser-config');

/**
 * Alabama Theatre Scraper (Puppeteer version)
 * Uses headless browser for WordPress tribe-events plugin
 * https://alabamatheatre.com/events/
 */
class AlabamaTheatreScraper {
  constructor() {
    this.baseUrl = 'https://alabamatheatre.com';
    this.eventsUrl = 'https://alabamatheatre.com/events/';
  }

  async scrape() {
    const browser = await launchBrowser();

    try {
      console.log('Scraping Alabama Theatre events with Puppeteer...');
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await page.goto(this.eventsUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for tribe-events to load
      try {
        await page.waitForSelector('.tribe-events-calendar-list__event-row, .tribe-common-g-row, article', { timeout: 10000 });
      } catch (e) {
        console.log('No events found on Alabama Theatre');
        return [];
      }

      const events = await page.evaluate((baseUrl) => {
        const eventElements = document.querySelectorAll('.tribe-events-calendar-list__event-row, .tribe-common-g-row, article.tribe-events-calendar-list__event, article.event');
        const results = [];

        eventElements.forEach(el => {
          try {
            const titleEl = el.querySelector('.tribe-events-calendar-list__event-title-link, .tribe-events-calendar-list__event-title, h3.tribe-events-calendar-list__event-title, .tribe-common-h6--min-medium, h4 a, h3 a, a.tribe-event-url');
            const title = titleEl ? titleEl.textContent.trim() : '';

            if (!title) return;

            const dateEl = el.querySelector('.tribe-event-date-start, .tribe-events-calendar-list__event-datetime, time, .tribe-event-schedule-details');
            const dateText = dateEl ? dateEl.textContent.trim() : '';

            const timeEl = el.querySelector('.tribe-events-start-time, .tribe-event-time');
            const timeText = timeEl ? timeEl.textContent.trim() : '';

            const venueEl = el.querySelector('.venue, .location');
            const venue = venueEl ? venueEl.textContent.trim() : 'Alabama Theatre';

            const descEl = el.querySelector('.event-description, .description, p');
            const description = descEl ? descEl.textContent.trim().substring(0, 300) : '';

            const imgEl = el.querySelector('img');
            let imageUrl = imgEl ? imgEl.src : '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = baseUrl + imageUrl;
            }

            const linkEl = el.querySelector('a');
            let link = linkEl ? linkEl.href : '';
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
              address: '1817 3rd Ave N',
              city: 'Birmingham',
              state: 'AL',
              zipCode: '35203',
              category: 'Entertainment',
              image: imageUrl,
              imageUrl: imageUrl,
              url: link || `${baseUrl}/events/`,
              link: link || `${baseUrl}/events/`
            });
          } catch (error) {
            console.error('Error parsing event:', error);
          }
        });

        return results;
      }, this.baseUrl);

      console.log(`Found ${events.length} Alabama Theatre events`);
      return events;

    } catch (error) {
      console.error('Error scraping Alabama Theatre:', error.message);
      return [];
    } finally {
      await browser.close();
    }
  }
}

module.exports = AlabamaTheatreScraper;
