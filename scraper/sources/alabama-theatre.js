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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://alabamatheatre.com/'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Alabama Theatre uses WordPress tribe-events plugin
      const items = $('.tribe-events-calendar-list__event-row, .tribe-common-g-row, article.tribe-events-calendar-list__event');

      let foundEvents = false;
      items.each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event && event.name) {
          events.push(event);
          foundEvents = true;
        }
      });

      console.log(`Found ${events.length} Alabama Theatre events`);
      return events;
    } catch (error) {
      console.error('Error scraping Alabama Theatre:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // Alabama Theatre uses tribe-events structure
      const title = element.find('.tribe-events-calendar-list__event-title-link, .tribe-events-calendar-list__event-title, h3.tribe-events-calendar-list__event-title, .tribe-common-h6--min-medium').first().text().trim() ||
                    element.find('h4 a, h3 a').first().text().trim() ||
                    element.find('a.tribe-event-url').first().text().trim();

      const dateText = element.find('.tribe-event-date-start, .tribe-events-calendar-list__event-datetime, time').first().text().trim() ||
                       element.find('.tribe-event-schedule-details').first().text().trim();
      const timeText = element.find('.tribe-events-start-time, .tribe-event-time').first().text().trim();

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
