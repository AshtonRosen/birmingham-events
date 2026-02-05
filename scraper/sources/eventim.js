const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Eventim.us Event Scraper
 * Note: May require specific headers or cookies to bypass 403 blocking
 */
class EventimScraper {
  constructor() {
    this.baseUrl = 'https://www.eventim.us';
    this.searchUrl = 'https://www.eventim.us/city/birmingham-al-2634/';
  }

  /**
   * Scrape events from Eventim.us
   */
  async scrape() {
    try {
      console.log('Scraping Eventim.us events...');

      const response = await axios.get(this.searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Eventim uses various structures - check for common patterns
      $('article, .event-item, [class*="event"], [data-event]').each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event.name) {
          events.push(event);
        }
      });

      // Also check for Schema.org structured data
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const json = JSON.parse($(elem).html());
          if (json['@type'] === 'Event') {
            events.push(this.parseSchemaOrg(json));
          }
        } catch (e) {
          // Not valid JSON or not an event
        }
      });

      console.log(`Found ${events.length} Eventim events`);
      return events;
    } catch (error) {
      if (error.response?.status === 403) {
        console.error('Eventim.us is blocking requests (403). May need browser automation or API access.');
      } else {
        console.error('Error scraping Eventim:', error.message);
      }
      return [];
    }
  }

  /**
   * Parse HTML event element
   */
  parseEvent($, element) {
    const title = element.find('h1, h2, h3, .title, [class*="title"]').first().text().trim();
    const url = element.find('a').first().attr('href') || '';
    const fullUrl = url ? (url.startsWith('http') ? url : `${this.baseUrl}${url}`) : '';

    const date = element.find('.date, [class*="date"], time').first().text().trim() ||
                 element.find('time').attr('datetime') || '';

    const venue = element.find('.venue, [class*="venue"], [class*="location"]').first().text().trim();
    const image = element.find('img').first().attr('src') || '';
    const description = element.find('.description, [class*="description"], p').first().text().trim();

    return {
      name: title,
      title: title,
      description: description,
      date: date,
      venue: venue || 'Birmingham Area',
      location: venue || 'Birmingham Area',
      city: 'Birmingham',
      state: 'AL',
      category: 'Event',
      image: image ? (image.startsWith('http') ? image : `${this.baseUrl}${image}`) : '',
      imageUrl: image ? (image.startsWith('http') ? image : `${this.baseUrl}${image}`) : '',
      url: fullUrl,
      link: fullUrl
    };
  }

  /**
   * Parse Schema.org structured data
   */
  parseSchemaOrg(json) {
    return {
      name: json.name || '',
      title: json.name || '',
      description: json.description || '',
      date: json.startDate || '',
      startDate: json.startDate || '',
      endDate: json.endDate || '',
      venue: json.location?.name || '',
      location: json.location?.name || '',
      address: json.location?.address?.streetAddress || '',
      city: json.location?.address?.addressLocality || 'Birmingham',
      state: json.location?.address?.addressRegion || 'AL',
      zipCode: json.location?.address?.postalCode || '',
      category: 'Event',
      image: json.image?.url || json.image || '',
      imageUrl: json.image?.url || json.image || '',
      url: json.url || '',
      link: json.url || ''
    };
  }
}

module.exports = EventimScraper;
