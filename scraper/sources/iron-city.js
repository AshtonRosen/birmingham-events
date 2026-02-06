const { launchBrowser } = require('../browser-config');

/**
 * Iron City Scraper (Puppeteer version)
 * Uses headless browser for Ticketmaster widget
 * https://ironcitybham.com/events/
 */
class IronCityScraper {
  constructor() {
    this.baseUrl = 'https://www.ironcitybham.com';
    this.eventsUrl = 'https://www.ironcitybham.com/events';
  }

  async scrape() {
    const browser = await launchBrowser();

    try {
      console.log('Scraping Iron City events with Puppeteer...');
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      await page.goto(this.eventsUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for Ticketmaster widget to load
      try {
        await page.waitForSelector('.tw-widget-event, .event, article', { timeout: 10000 });
      } catch (e) {
        console.log('No events found on Iron City');
        return [];
      }

      const events = await page.evaluate((baseUrl) => {
        const eventElements = document.querySelectorAll('.tw-widget-event, li.tw-widget-event, .event, article');
        const results = [];

        eventElements.forEach(el => {
          try {
            const titleEl = el.querySelector('.tw-event-name, .event-name, h2, h3, .title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            if (!title) return;

            const dateEl = el.querySelector('.tw-event-date-time, .event-date, .date, time');
            const dateText = dateEl ? dateEl.textContent.trim() : '';

            const timeEl = el.querySelector('.event-time, .time');
            const timeText = timeEl ? timeEl.textContent.trim() : '';

            const descEl = el.querySelector('.event-description, .description, p');
            const description = descEl ? descEl.textContent.trim().substring(0, 300) : '';

            const imgEl = el.querySelector('.tw-event-image img, .event-img, img');
            let imageUrl = imgEl ? imgEl.src : '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = baseUrl + imageUrl;
            }

            const linkEl = el.querySelector('.tw-more-info-btn, a.button, a');
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
              venue: 'Iron City',
              location: 'Iron City',
              address: '2700 1st Ave S',
              city: 'Birmingham',
              state: 'AL',
              zipCode: '35233',
              category: 'Music',
              image: imageUrl,
              imageUrl: imageUrl,
              url: link || `${baseUrl}/events`,
              link: link || `${baseUrl}/events`
            });
          } catch (error) {
            console.error('Error parsing event:', error);
          }
        });

        return results;
      }, this.baseUrl);

      console.log(`Found ${events.length} Iron City events`);
      return events;

    } catch (error) {
      console.error('Error scraping Iron City:', error.message);
      return [];
    } finally {
      await browser.close();
    }
  }
}

module.exports = IronCityScraper;
