const axios = require('axios');

/**
 * Ticketmaster Discovery API Scraper
 * Uses official Ticketmaster API - no actual web scraping required
 */
class TicketmasterScraper {
  constructor() {
    this.baseUrl = 'https://app.ticketmaster.com/discovery/v2';
    // Ticketmaster API key - obtained February 2026
    this.apiKey = 'f0t5Pj2zQSMYV21IgF2iITemK4T560Kc';
    this.city = 'Birmingham';
    this.stateCode = 'AL';
  }

  /**
   * Scrape events from Ticketmaster
   */
  async scrape() {
    try {
      console.log('Scraping Ticketmaster events...');

      const params = {
        apikey: this.apiKey,
        city: this.city,
        stateCode: this.stateCode,
        size: 200, // Max results per page
        sort: 'date,asc',
        classificationName: 'Arts,Music,Sports,Family,Miscellaneous' // Broad categories
      };

      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params,
        timeout: 10000
      });

      if (!response.data || !response.data._embedded || !response.data._embedded.events) {
        console.log('No Ticketmaster events found');
        return [];
      }

      const events = response.data._embedded.events.map(event => this.parseEvent(event));
      console.log(`Found ${events.length} Ticketmaster events`);

      return events;
    } catch (error) {
      console.error('Error scraping Ticketmaster:', error.message);
      return [];
    }
  }

  /**
   * Parse Ticketmaster event object
   */
  parseEvent(event) {
    const dates = event.dates || {};
    const start = dates.start || {};
    const venue = event._embedded?.venues?.[0] || {};
    const priceRanges = event.priceRanges || [];
    const images = event.images || [];

    // Get best quality image
    const image = images.find(img => img.width >= 640) || images[0];

    return {
      name: event.name,
      description: event.info || event.pleaseNote || '',
      date: start.localDate,
      time: start.localTime,
      startDate: start.localDate,
      startTime: start.localTime,
      venue: venue.name,
      address: venue.address?.line1 || '',
      city: venue.city?.name || 'Birmingham',
      state: venue.state?.stateCode || 'AL',
      zipCode: venue.postalCode || '',
      category: event.classifications?.[0]?.segment?.name || 'General',
      price: this.formatPrice(priceRanges),
      image: image?.url || '',
      imageUrl: image?.url || '',
      url: event.url,
      link: event.url
    };
  }

  /**
   * Format price range
   */
  formatPrice(priceRanges) {
    if (!priceRanges || priceRanges.length === 0) return 'See website';

    const range = priceRanges[0];
    const min = range.min;
    const max = range.max;

    if (min === max) {
      return `$${min}`;
    } else if (min && max) {
      return `$${min} - $${max}`;
    } else if (min) {
      return `Starting at $${min}`;
    } else {
      return 'See website';
    }
  }
}

module.exports = TicketmasterScraper;
