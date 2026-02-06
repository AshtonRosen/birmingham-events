const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Eventbrite Event Scraper
 * Scrapes basic event info (pricing requires JavaScript execution)
 */
class EventbriteScraper {
  constructor() {
    this.baseUrl = 'https://www.eventbrite.com/d/al--birmingham/events/';
  }

  /**
   * Scrape events from Eventbrite
   */
  async scrape() {
    try {
      console.log('Scraping Eventbrite events...');

      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Eventbrite uses event card links
      $('a[href*="/e/"]').each((i, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');

        // Only process event links
        if (!href || !href.includes('/e/') || !href.includes('tickets')) return;

        const event = this.parseEvent($, $elem);
        if (event.name && !events.find(e => e.url === event.url)) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} Eventbrite events`);
      return events;
    } catch (error) {
      console.error('Error scraping Eventbrite:', error.message);
      return [];
    }
  }

  /**
   * Parse individual event card
   */
  parseEvent($, element) {
    // Find the closest parent that contains all event info
    const card = element.closest('[data-event-id], article, div[class*="event"]');

    // Title - usually in h3 or h2
    const title = card.find('h3, h2, [class*="title"]').first().text().trim() ||
                  element.attr('aria-label') ||
                  element.text().trim();

    // URL
    const url = element.attr('href');
    const fullUrl = url ? (url.startsWith('http') ? url : `https://www.eventbrite.com${url}`) : '';

    // Image
    const img = card.find('img').first();
    let image = img.attr('src') || img.attr('data-src') || '';

    // Eventbrite uses srcset with optimization params
    if (!image) {
      const srcset = img.attr('srcset');
      if (srcset) {
        const match = srcset.match(/(https?:\/\/[^\s,]+)/);
        if (match) image = match[1];
      }
    }

    // Date and time - usually in format "Day • Time"
    const dateTimeText = card.find('[class*="date"], [class*="time"], time').text().trim();
    const { date, time } = this.parseDateTimeText(dateTimeText);

    // Location/Venue
    const venue = card.find('[class*="location"], [class*="venue"]').text().trim() || 'Birmingham Area';

    // Status labels (Almost full, Going fast, etc.)
    const statusLabels = [];
    card.find('[class*="status"], [class*="label"]').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text) statusLabels.push(text);
    });

    return {
      name: title,
      title: title,
      description: statusLabels.join(' • ') || '',
      date: date,
      time: time,
      venue: venue,
      location: venue,
      city: 'Birmingham',
      state: 'AL',
      category: 'Event',
      price: 'See website', // Pricing requires JavaScript execution
      image: image,
      imageUrl: image,
      url: fullUrl,
      link: fullUrl
    };
  }

  /**
   * Parse date/time text (e.g., "Friday • 8:00 PM" or "Jan 15 • 7:00 PM")
   */
  parseDateTimeText(text) {
    if (!text) return { date: null, time: null };

    // Split by bullet or comma
    const parts = text.split(/[•,]/).map(p => p.trim());

    let date = null;
    let time = null;

    parts.forEach(part => {
      // Check if it's a time (contains : or AM/PM)
      if (part.match(/\d{1,2}:\d{2}|AM|PM/i)) {
        time = part;
      }
      // Check if it's a date (contains day names or month names)
      else if (part.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}/i)) {
        // Check if it has a month name and day number (more specific)
        if (part.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i)) {
          // Add current year if not present
          const year = new Date().getFullYear();
          date = `${part}, ${year}`;
        } else {
          date = part;
        }
      }
    });

    // If we only got a day name, return it (normalizer will handle converting to date)
    // If we got a full date, return it as-is
    return { date, time };
  }
}

module.exports = EventbriteScraper;
