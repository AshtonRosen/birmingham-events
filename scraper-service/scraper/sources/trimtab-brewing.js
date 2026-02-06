const axios = require('axios');
const cheerio = require('cheerio');

/**
 * TrimTab Brewing Scraper
 * https://www.trimtabbrewing.com/events/
 */
class TrimTabBrewingScraper {
  constructor() {
    this.baseUrl = 'https://www.trimtabbrewing.com';
    this.eventsUrl = 'https://www.trimtabbrewing.com/calendar';
  }

  async scrape() {
    try {
      console.log('Scraping TrimTab Brewing events...');

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

      console.log(`Found ${events.length} TrimTab Brewing events`);
      return events;
    } catch (error) {
      console.error('Error scraping TrimTab Brewing:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      const title = element.find('.event-title, .title, h2, h3').first().text().trim() ||
                    element.find('a').first().text().trim();

      const dateText = element.find('.event-date, .date, time').first().text().trim();
      const timeText = element.find('.event-time, .time').first().text().trim();

      const venue = 'TrimTab Brewing';

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
        address: '2721 5th Ave S',
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
      console.error('Error parsing TrimTab Brewing event:', error.message);
      return null;
    }
  }
}

module.exports = TrimTabBrewingScraper;
