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

    // Specific venue IDs to ensure we capture all events
    this.specificVenues = [
      { id: 'KovZpZAE7IJA', name: 'Iron City' },
      { id: 'KovZpZAIdEAA', name: 'Saturn Birmingham' }
    ];
  }

  /**
   * Scrape events from Ticketmaster
   */
  async scrape() {
    try {
      console.log('Scraping Ticketmaster events...');
      const allEvents = [];

      // First, get general Birmingham events
      const generalEvents = await this.fetchCityEvents();
      allEvents.push(...generalEvents);

      // Then, query specific venues to ensure complete coverage
      for (const venue of this.specificVenues) {
        const venueEvents = await this.fetchVenueEvents(venue);
        allEvents.push(...venueEvents);
      }

      // Deduplicate by event ID
      const uniqueEvents = this.deduplicateById(allEvents);

      console.log(`Found ${uniqueEvents.length} Ticketmaster events (${allEvents.length} before dedup)`);
      return uniqueEvents;
    } catch (error) {
      console.error('Error scraping Ticketmaster:', error.message);
      return [];
    }
  }

  /**
   * Fetch events by city
   */
  async fetchCityEvents() {
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
      return [];
    }

    return response.data._embedded.events.map(event => this.parseEvent(event));
  }

  /**
   * Fetch events by specific venue ID
   */
  async fetchVenueEvents(venue) {
    const params = {
      apikey: this.apiKey,
      venueId: venue.id,
      size: 100,
      sort: 'date,asc'
    };

    try {
      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params,
        timeout: 10000
      });

      if (!response.data || !response.data._embedded || !response.data._embedded.events) {
        return [];
      }

      return response.data._embedded.events.map(event => this.parseEvent(event));
    } catch (error) {
      console.error(`Error fetching ${venue.name} events:`, error.message);
      return [];
    }
  }

  /**
   * Deduplicate events by Ticketmaster event ID
   */
  deduplicateById(events) {
    const seen = new Set();
    return events.filter(event => {
      const id = event.url; // Use URL as unique identifier
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
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
