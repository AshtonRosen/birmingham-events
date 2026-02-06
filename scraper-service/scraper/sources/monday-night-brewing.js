const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Monday Night Brewing Birmingham Scraper
 * https://mondaynightbrewing.com/birmingham/events/
 */
class MondayNightBrewingScraper {
  constructor() {
    this.baseUrl = 'https://www.mondaynightbrewing.com';
    this.eventsUrl = 'https://www.mondaynightbrewing.com/events-birmingham';
  }

  async scrape() {
    try {
      console.log('Scraping Monday Night Brewing events...');

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

      console.log(`Found ${events.length} Monday Night Brewing events`);
      return events;
    } catch (error) {
      console.error('Error scraping Monday Night Brewing:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      const title = element.find('.event-title, .title, h2, h3').first().text().trim() ||
                    element.find('a').first().text().trim();

      const dateText = element.find('.event-date, .date, time').first().text().trim();
      const timeText = element.find('.event-time, .time').first().text().trim();

      const venue = 'Monday Night Brewing - Birmingham';

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
        address: '2821 5th Ave S',
        city: 'Birmingham',
        state: 'AL',
        zipCode: '35233',
        category: 'Food & Drink',
        image: imageUrl,
        imageUrl: imageUrl,
        url: link,
        link: link
      };
    } catch (error) {
      console.error('Error parsing Monday Night Brewing event:', error.message);
      return null;
    }
  }
}

module.exports = MondayNightBrewingScraper;
