const { launchBrowser } = require('../browser-config');

/**
 * WorkPlay Scraper (Puppeteer version)
 * Uses headless browser for JavaScript-rendered content
 * https://workplay.com/events
 */
class WorkPlayScraper {
  constructor() {
    this.baseUrl = 'https://www.workplay.com';
    this.eventsUrl = 'https://www.workplay.com/events';
  }

  async scrape() {
    const browser = await launchBrowser();

    try {
      console.log('Scraping WorkPlay events with Puppeteer...');
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      await page.goto(this.eventsUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for events to load
      try {
        await page.waitForSelector('.event-card, .event, article', { timeout: 10000 });
      } catch (e) {
        console.log('No events found on WorkPlay');
        return [];
      }

      const events = await page.evaluate((baseUrl) => {
        const eventElements = document.querySelectorAll('.event-card, a.event-card, .event, article');
        const results = [];

        eventElements.forEach(el => {
          try {
            const titleEl = el.querySelector('.event-title, h2, h3, .title');
            const title = titleEl ? titleEl.textContent.trim() : '';

            if (!title) return;

            const dateEl = el.querySelector('.event-meta-item, .date, .event-date');
            const dateText = dateEl ? dateEl.textContent.trim() : '';

            const timeEl = el.querySelectorAll('.event-meta-item')[1] || el.querySelector('.time, .event-time');
            const timeText = timeEl ? timeEl.textContent.trim() : '';

            const descEl = el.querySelector('.event-description, .description, p');
            const description = descEl ? descEl.textContent.trim().substring(0, 300) : '';

            const imgEl = el.querySelector('.event-image-wrapper img, img');
            let imageUrl = imgEl ? imgEl.src : '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = baseUrl + imageUrl;
            }

            let link = el.href || '';
            const linkEl = el.querySelector('a');
            if (!link && linkEl) {
              link = linkEl.href;
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
              venue: 'WorkPlay',
              location: 'WorkPlay',
              address: '500 23rd St S',
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

      console.log(`Found ${events.length} WorkPlay events`);
      return events;

    } catch (error) {
      console.error('Error scraping WorkPlay:', error.message);
      return [];
    } finally {
      await browser.close();
    }
  }
}

module.exports = WorkPlayScraper;
