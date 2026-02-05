const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Alabama Theatre Scraper
 * https://alabamatheatre.com/events/
 */
class AlabamaTheatreScraper {
  constructor() {
    this.baseUrl = 'https://alabamatheatre.com';
    this.eventsUrl = 'https://alabamatheatre.com/events/';
  }

  async scrape() {
    try {
      console.log('Scraping Alabama Theatre events...');

      const response = await axios.get(this.eventsUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Try multiple selectors for event listings
      const selectors = [
        '.event-item',
        '.tribe-events-list-event-row',
        '.event',
        'article[class*="event"]',
        '.ecs-event'
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

      console.log(`Found ${events.length} Alabama Theatre events`);
      return events;
    } catch (error) {
      console.error('Error scraping Alabama Theatre:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // Extract data using various possible selectors
      const title = element.find('.event-title, .tribe-event-title, h2, h3, .title').first().text().trim() ||
                    element.find('a').first().text().trim();

      const dateText = element.find('.event-date, .tribe-event-date, .date, time').first().text().trim();
      const timeText = element.find('.event-time, .tribe-event-time, .time').first().text().trim();

      const venue = element.find('.venue, .location').first().text().trim() || 'Alabama Theatre';

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
        address: '1817 3rd Ave N',
        city: 'Birmingham',
        state: 'AL',
        zipCode: '35203',
        category: 'Entertainment',
        image: imageUrl,
        imageUrl: imageUrl,
        url: link,
        link: link
      };
    } catch (error) {
      console.error('Error parsing Alabama Theatre event:', error.message);
      return null;
    }
  }
}

module.exports = AlabamaTheatreScraper;
