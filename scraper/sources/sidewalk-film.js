const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Sidewalk Film Festival Scraper
 * https://sidewalkfest.com/schedule/
 */
class SidewalkFilmScraper {
  constructor() {
    this.baseUrl = 'https://sidewalkfest.com';
    this.scheduleUrl = 'https://sidewalkfest.com/events-list/';
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

      // Sidewalk uses FacetWP with .fwpl-row.event structure
      const items = $('.fwpl-row.event, .event');

      items.each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event && event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} Sidewalk Film Festival events`);
      return events;
    } catch (error) {
      console.error('Error scraping Sidewalk Film Festival:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // Sidewalk uses FacetWP structure
      const title = element.find('h3, h2, .film-title').first().text().trim() ||
                    element.find('strong').first().text().trim();

      // Get date from .tickets-for-date or date sections
      const dateText = element.find('.tickets-for-date, .date-section, time').first().text().trim();
      const timeText = element.find('.date-buttons, .showtime').first().text().trim();

      const venue = element.find('.venue-wrapper, .venue').first().text().trim() || 'Sidewalk Film Center';

      const description = element.find('.description, .synopsis, p').first().text().trim();

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
