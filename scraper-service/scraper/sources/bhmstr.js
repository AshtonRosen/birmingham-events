const axios = require('axios');
const cheerio = require('cheerio');

/**
 * BHMSTR.com (Birmingham Arts & Entertainment Calendar) Scraper
 * Uses The Events Calendar plugin
 */
class BHMSTRScraper {
  constructor() {
    this.baseUrl = 'https://bhmstr.com/';
  }

  /**
   * Scrape events from BHMSTR
   */
  async scrape() {
    try {
      console.log('Scraping BHMSTR events...');

      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // The Events Calendar uses .tribe-events-* classes
      $('.tribe-events-calendar-day__event, .tribe-events-calendar-list__event, article[class*="tribe-event"]').each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} BHMSTR events`);
      return events;
    } catch (error) {
      console.error('Error scraping BHMSTR:', error.message);
      return [];
    }
  }

  /**
   * Parse individual event element
   */
  parseEvent($, element) {
    // Title
    const title = element.find('.tribe-events-calendar-day__event-title, .tribe-events-calendar-list__event-title, h3, h2').first().text().trim();

    // URL
    const url = element.find('a').first().attr('href') || '';

    // Date
    const dateText = element.find('.tribe-events-calendar-day__event-datetime, .tribe-event-date-start, time').first().text().trim() ||
                     element.find('time').attr('datetime') || '';

    // Time
    const timeText = element.find('.tribe-events-calendar-list__event-datetime, .tribe-event-time').text().trim();

    // Venue
    const venue = element.find('.tribe-events-calendar-day__event-venue, .tribe-events-calendar-list__event-venue, .tribe-venue').text().trim();

    // Description
    const description = element.find('.tribe-events-calendar-list__event-description, .tribe-events-event-excerpt').text().trim();

    // Image
    const image = element.find('img').first().attr('src') || '';

    // Category
    const category = element.find('.tribe-events-event-categories, .tribe-event-category').text().trim() || 'Arts & Entertainment';

    // Check if event is currently happening
    const isLive = element.hasClass('tribe-ext-events-control-list-event--live');

    return {
      name: title,
      title: title,
      description: description + (isLive ? ' (Happening Now)' : ''),
      date: dateText,
      time: this.extractTime(timeText),
      venue: venue || 'Birmingham Area',
      location: venue || 'Birmingham Area',
      city: 'Birmingham',
      state: 'AL',
      category: category,
      image: image,
      imageUrl: image,
      url: url,
      link: url
    };
  }

  /**
   * Extract time from datetime text
   */
  extractTime(text) {
    if (!text) return null;

    const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      return timeMatch[0];
    }

    return null;
  }
}

module.exports = BHMSTRScraper;
