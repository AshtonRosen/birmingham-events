const axios = require('axios');
const cheerio = require('cheerio');

/**
 * WorkPlay Scraper
 * https://workplay.com/calendar/
 */
class WorkPlayScraper {
  constructor() {
    this.baseUrl = 'https://www.workplay.com';
    this.eventsUrl = 'https://www.workplay.com/events';
  }

  async scrape() {
    try {
      console.log('Scraping WorkPlay events...');

      const response = await axios.get(this.eventsUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // WorkPlay uses .event-card structure
      const items = $('.event-card, a.event-card');

      items.each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event && event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} WorkPlay events`);
      return events;
    } catch (error) {
      console.error('Error scraping WorkPlay:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // WorkPlay uses custom event-card structure
      const title = element.find('.event-title').first().text().trim();

      const dateText = element.find('.event-meta-item').first().text().trim();
      const timeText = element.find('.event-meta-item').eq(1).text().trim();

      const venue = 'WorkPlay';

      const description = element.find('.event-description, .description, p').first().text().trim();

      const image = element.find('.event-image-wrapper img').first().attr('src') || '';
      const imageUrl = image && !image.startsWith('http') ? `${this.baseUrl}${image}` : image;

      let link = element.attr('href') || element.find('a').first().attr('href') || '';
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
        address: '500 23rd St S',
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
      console.error('Error parsing WorkPlay event:', error.message);
      return null;
    }
  }
}

module.exports = WorkPlayScraper;
