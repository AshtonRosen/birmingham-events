const axios = require('axios');
const cheerio = require('cheerio');

/**
 * BJCC (Birmingham-Jefferson Convention Complex) Event Scraper
 * Uses Modern Events Calendar plugin
 */
class BJCCScraper {
  constructor() {
    this.baseUrl = 'https://www.bjcc.org/events/';
  }

  /**
   * Scrape events from BJCC
   */
  async scrape() {
    try {
      console.log('Scraping BJCC events...');

      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Modern Events Calendar uses .mec-event-* classes
      $('.mec-event-article, .event-wrapper, article[class*="mec-event"]').each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} BJCC events`);
      return events;
    } catch (error) {
      console.error('Error scraping BJCC:', error.message);
      return [];
    }
  }

  /**
   * Parse individual event element
   */
  parseEvent($, element) {
    // Title
    const title = element.find('.mec-event-title, h3, h2').first().text().trim() ||
                  element.find('a').first().attr('title') || '';

    // URL
    const url = element.find('.mec-event-title a, a.mec-booking-button').first().attr('href') || '';

    // Date
    const dateText = element.find('.mec-event-d, .mec-start-date, .event-date').text().trim();

    // Time
    const timeText = element.find('.mec-time-details, .event-time').text().trim();

    // Venue
    const venue = element.find('.mec-event-address-name, .mec-venue-details, .event-location').text().trim();

    // Description
    const description = element.find('.mec-event-description, .event-content').text().trim();

    // Image
    const image = element.find('img').first().attr('src') || '';

    // Category (if available)
    const category = element.find('.mec-event-category, .event-category').text().trim() || 'General';

    return {
      name: title,
      title: title,
      description: description,
      date: this.extractDate(dateText),
      time: this.extractTime(timeText),
      venue: venue || 'BJCC',
      location: venue || 'BJCC',
      address: '2100 Richard Arrington Jr Blvd N',
      city: 'Birmingham',
      state: 'AL',
      zipCode: '35203',
      category: category,
      image: image,
      imageUrl: image,
      url: url ? (url.startsWith('http') ? url : `https://www.bjcc.org${url}`) : '',
      link: url ? (url.startsWith('http') ? url : `https://www.bjcc.org${url}`) : ''
    };
  }

  /**
   * Extract date from text
   */
  extractDate(text) {
    if (!text) return null;

    // Handle date ranges like "06 - 08 Feb"
    const rangeMatch = text.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+(\w+)/i);
    if (rangeMatch) {
      const [, startDay, endDay, month] = rangeMatch;
      const year = new Date().getFullYear();
      // Use the start date
      return `${month} ${startDay}, ${year}`;
    }

    // Handle single date like "15 Feb" or "Feb 15"
    const singleMatch = text.match(/(\d{1,2})\s+(\w+)|(\w+)\s+(\d{1,2})/i);
    if (singleMatch) {
      const year = new Date().getFullYear();
      return `${text}, ${year}`;
    }

    // Try to match common date patterns
    const datePatterns = [
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i, // "January 15, 2024"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,   // "1/15/2024"
      /(\d{4})-(\d{2})-(\d{2})/          // "2024-01-15"
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return text; // Return raw text, normalizer will handle it
      }
    }

    return text;
  }

  /**
   * Extract time from text
   */
  extractTime(text) {
    if (!text) return null;

    // Match time patterns like "7:00 PM" or "19:00"
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
    if (timeMatch) {
      return timeMatch[0];
    }

    return text;
  }
}

module.exports = BJCCScraper;
