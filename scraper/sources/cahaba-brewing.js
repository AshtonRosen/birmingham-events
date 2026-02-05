const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Cahaba Brewing Scraper
 * https://www.cahababrewing.com/events
 */
class CahabaBrewingScraper {
  constructor() {
    this.baseUrl = 'https://cahababrewing.com';
    this.eventsUrl = 'https://cahababrewing.com/taproom/calendar/';
  }

  async scrape() {
    try {
      console.log('Scraping Cahaba Brewing events...');

      const response = await axios.get(this.eventsUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Cahaba uses FullCalendar with Google Calendar
      // Note: This might be JavaScript-rendered and not scrapable with Cheerio
      const items = $('.fc-daygrid-event, .fc-event, a.fc-event');

      items.each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event && event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} Cahaba Brewing events`);
      return events;
    } catch (error) {
      console.error('Error scraping Cahaba Brewing:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      // Cahaba uses FullCalendar structure
      const title = element.find('.fc-event-title').first().text().trim();

      const dateText = element.attr('data-date') || element.find('.fc-event-time').attr('data-start') || '';
      const timeText = element.find('.fc-event-time').first().text().trim();

      const venue = 'Cahaba Brewing';

      const description = element.find('.event-description, .description, p, .summary-excerpt').first().text().trim();

      const image = element.find('img').first().attr('data-src') || element.find('img').first().attr('src') || '';
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
        address: '4500 5th Ave S',
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
      console.error('Error parsing Cahaba Brewing event:', error.message);
      return null;
    }
  }
}

module.exports = CahabaBrewingScraper;
