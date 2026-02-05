const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Sidewalk Film Festival Scraper
 * https://sidewalkfest.com/schedule/
 */
class SidewalkFilmScraper {
  constructor() {
    this.baseUrl = 'https://sidewalkfest.com';
    this.scheduleUrl = 'https://sidewalkfest.com/schedule/';
  }

  async scrape() {
    try {
      console.log('Scraping Sidewalk Film Festival events...');

      const response = await axios.get(this.scheduleUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      const selectors = [
        '.event-item',
        '.screening',
        '.film',
        'article[class*="event"]',
        '.schedule-item'
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

      console.log(`Found ${events.length} Sidewalk Film Festival events`);
      return events;
    } catch (error) {
      console.error('Error scraping Sidewalk Film Festival:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      const title = element.find('.event-title, .title, h2, h3, .film-title').first().text().trim() ||
                    element.find('a').first().text().trim();

      const dateText = element.find('.event-date, .date, time, .screening-date').first().text().trim();
      const timeText = element.find('.event-time, .time, .screening-time').first().text().trim();

      const venue = element.find('.venue, .location, .theater').first().text().trim() || 'Various Venues';

      const description = element.find('.event-description, .description, p, .synopsis').first().text().trim();

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
        city: 'Birmingham',
        state: 'AL',
        category: 'Film',
        image: imageUrl,
        imageUrl: imageUrl,
        url: link,
        link: link
      };
    } catch (error) {
      console.error('Error parsing Sidewalk Film event:', error.message);
      return null;
    }
  }
}

module.exports = SidewalkFilmScraper;
