const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Iron City Scraper
 * https://ironcitybham.com/events/
 */
class IronCityScraper {
  constructor() {
    this.baseUrl = 'https://www.ironcitybham.com';
    this.eventsUrl = 'https://www.ironcitybham.com/events';
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

      // Iron City uses Ticketmaster widget
      const items = $('.tw-widget-event, li.tw-widget-event');

      items.each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event && event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} Iron City events`);
      return events;
    } catch (error) {
      console.error('Error scraping Iron City:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // Iron City uses Ticketmaster widget structure
      const title = element.find('.tw-event-name, .event-name').first().text().trim();

      const dateText = element.find('.tw-event-date-time, .event-date').first().text().trim();
      const timeText = '';

      const venue = 'Iron City';

      const description = element.find('.event-description, .description, p').first().text().trim();

      const image = element.find('.tw-event-image img, .event-img').first().attr('src') || '';
      const imageUrl = image && !image.startsWith('http') ? `${this.baseUrl}${image}` : image;

      let link = element.find('.tw-more-info-btn, a.button').first().attr('href') ||
                 element.find('a').first().attr('href') || '';
      if (link && !link.startsWith('http') && link.startsWith('/')) {
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
