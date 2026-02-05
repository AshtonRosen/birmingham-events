const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Saturn Birmingham Scraper
 * https://saturnbirmingham.com/events/
 */
class SaturnBirminghamScraper {
  constructor() {
    this.baseUrl = 'https://www.saturnbirmingham.com';
    this.eventsUrl = 'https://www.saturnbirmingham.com/events';
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

      // Saturn uses SeeTickets widget
      const items = $('.seetickets-list-event-container, .mdc-card');

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
      // Saturn uses SeeTickets widget structure
      const paragraphs = element.find('p');
      const title = paragraphs.eq(1).find('a').first().text().trim() || paragraphs.eq(1).text().trim();

      const dateText = paragraphs.eq(0).text().trim();
      const timeText = paragraphs.eq(2).text().trim();

      const venue = 'Saturn';

      const description = element.find('.event-description, .description, p').first().text().trim();

      const image = element.find('img').first().attr('src') || '';
      const imageUrl = image && !image.startsWith('http') ? `${this.baseUrl}${image}` : image;

      let link = element.find('.seetickets-buy-btn').first().attr('href') ||
                 element.find('p a').first().attr('href') || '';
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
