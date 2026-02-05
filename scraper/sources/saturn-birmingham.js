const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Saturn Birmingham Scraper
 * https://saturnbirmingham.com/events/
 */
class SaturnBirminghamScraper {
  constructor() {
    this.baseUrl = 'https://www.saturnbirmingham.com';
    this.eventsUrl = 'https://www.saturnbirmingham.com/calendar';
  }

  async scrape() {
    try {
      console.log('Scraping Saturn Birmingham events...');

      const response = await axios.get(this.eventsUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Saturn uses SeeTickets widget with .seetickets-list-event-container
      const items = $('.seetickets-list-event-container');

      items.each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event && event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} Saturn Birmingham events`);
      return events;
    } catch (error) {
      console.error('Error scraping Saturn Birmingham:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // Saturn uses .seetickets-list-event-container with h3 links
      const title = element.find('h3 a').first().text().trim();

      // Date is in .event-date div ("Thu Feb 5" format)
      const dateText = element.find('.event-date').first().text().trim();

      // Time is in p tags - look for "Doors:" or "Show:" text
      let timeText = '';
      element.find('p').each((i, p) => {
        const text = $(p).text().trim();
        if (text.includes('Doors:') || text.includes('Show:')) {
          timeText = text;
          return false; // break
        }
      });

      const venue = 'Saturn';

      // Description is in p.subtitle
      const description = element.find('p.subtitle').first().text().trim();

      const image = element.find('img').first().attr('src') || '';
      const imageUrl = image && !image.startsWith('http') ? `${this.baseUrl}${image}` : image;

      // SeeTickets links are in h3 a or buy button
      let link = element.find('h3 a').first().attr('href') ||
                 element.find('.seetickets-buy-btn').first().attr('href') || '';
      // SeeTickets URLs are typically absolute

      return {
        name: title,
        title: title,
        description: description,
        date: dateText,
        time: timeText,
        venue: venue,
        location: venue,
        address: '200 41st St S',
        city: 'Birmingham',
        state: 'AL',
        zipCode: '35222',
        category: 'Music',
        image: imageUrl,
        imageUrl: imageUrl,
        url: link,
        link: link
      };
    } catch (error) {
      console.error('Error parsing Saturn Birmingham event:', error.message);
      return null;
    }
  }
}

module.exports = SaturnBirminghamScraper;
