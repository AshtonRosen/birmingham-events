const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Avondale Brewing Scraper
 * https://avondalebrewing.com/events/
 */
class AvondaleBrewingScraper {
  constructor() {
    this.baseUrl = 'https://www.avondalebrewing.com';
    this.eventsUrl = 'https://www.avondalebrewing.com/calendar-tickets';
  }

  async scrape() {
    try {
      console.log('Scraping Avondale Brewing events...');

      const response = await axios.get(this.eventsUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Avondale uses .event-item structure
      const items = $('.event-item');

      items.each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event && event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} Avondale Brewing events`);
      return events;
    } catch (error) {
      console.error('Error scraping Avondale Brewing:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // Avondale uses .event-item structure with h3 titles
      const title = element.find('h3').first().text().trim();

      // Date is split into .month and .day spans
      const month = element.find('.event-date .month').text().trim();
      const day = element.find('.event-date .day').text().trim();
      const dateText = `${month} ${day}`;

      // Time is in the ul > li list (second item)
      const timeText = element.find('ul li').eq(1).text().trim();

      const venue = 'Avondale Brewing';

      const description = element.find('ul li').first().text().trim(); // Full date info

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
        address: '201 41st St S',
        city: 'Birmingham',
        state: 'AL',
        zipCode: '35222',
        category: 'Food & Drink',
        image: imageUrl,
        imageUrl: imageUrl,
        url: link,
        link: link
      };
    } catch (error) {
      console.error('Error parsing Avondale Brewing event:', error.message);
      return null;
    }
  }
}

module.exports = AvondaleBrewingScraper;
