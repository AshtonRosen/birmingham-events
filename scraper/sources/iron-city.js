const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Iron City Scraper
 * https://ironcitybham.com/events/
 */
class IronCityScraper {
  constructor() {
    this.baseUrl = 'https://ironcitybham.com';
    this.eventsUrl = 'https://ironcitybham.com/events/';
  }

  async scrape() {
    try {
      console.log('Scraping Iron City events...');

      const response = await axios.get(this.eventsUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      const selectors = [
        '.event-item',
        '.show',
        '.event',
        'article[class*="event"]',
        '.tribe-events-list-event-row'
      ];

      let foundEvents = false;
      for (const selector of selectors) {
        const items = $(selector);
        if (items.length > 0) {
          items.each((i, elem) => {
            const event = this.parseEvent($, $(elem));
            if (event && event.name) {
              events.push(event);
              foundEvents = true;
            }
          });
          if (foundEvents) break;
        }
      }

      console.log(`Found ${events.length} Iron City events`);
      return events;
    } catch (error) {
      console.error('Error scraping Iron City:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      const title = element.find('.event-title, .title, h2, h3, .show-title').first().text().trim() ||
                    element.find('a').first().text().trim();

      const dateText = element.find('.event-date, .date, time').first().text().trim();
      const timeText = element.find('.event-time, .time, .doors').first().text().trim();

      const venue = 'Iron City';

      const description = element.find('.event-description, .description, p').first().text().trim();

      const image = element.find('img').first().attr('src') || '';
      const imageUrl = image && !image.startsWith('http') ? `${this.baseUrl}${image}` : image;

      let link = element.find('a').first().attr('href') || '';
      if (link && !link.startsWith('http')) {
        link = `${this.baseUrl}${link}`;
      }

      return {
        name: title,
        title: title,
        description: description,
        date: dateText,
        time: timeText,
        venue: venue,
        location: venue,
        address: '2700 1st Ave S',
        city: 'Birmingham',
        state: 'AL',
        zipCode: '35233',
        category: 'Music',
        image: imageUrl,
        imageUrl: imageUrl,
        url: link,
        link: link
      };
    } catch (error) {
      console.error('Error parsing Iron City event:', error.message);
      return null;
    }
  }
}

module.exports = IronCityScraper;
