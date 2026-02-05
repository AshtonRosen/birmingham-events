const axios = require('axios');
const cheerio = require('cheerio');

/**
 * InBirmingham.com Event Scraper
 * Uses Schema.org JSON-LD structured data
 */
class InBirminghamScraper {
  constructor() {
    this.baseUrl = 'https://inbirmingham.com/news-and-stories/upcoming-events-in-greater-birmingham/';
  }

  /**
   * Scrape events from InBirmingham.com
   */
  async scrape() {
    try {
      console.log('Scraping InBirmingham.com events...');

      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Look for Schema.org JSON-LD structured data
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const json = JSON.parse($(elem).html());
          if (json['@type'] === 'Article' || json['@type'] === 'Event') {
            const event = this.parseSchemaOrg(json);
            if (event.name) {
              events.push(event);
            }
          }
        } catch (e) {
          // Not valid JSON or not an event
        }
      });

      // Also scrape HTML content as fallback
      $('.splw-accordion-item, .splw-forecast-item, article').each((i, elem) => {
        const event = this.parseHTMLEvent($, $(elem));
        if (event.name && !events.find(e => e.name === event.name)) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} InBirmingham events`);
      return events;
    } catch (error) {
      console.error('Error scraping InBirmingham:', error.message);
      return [];
    }
  }

  /**
   * Parse Schema.org structured data
   */
  parseSchemaOrg(json) {
    return {
      name: json.headline || json.name || '',
      title: json.headline || json.name || '',
      description: json.description || json.articleBody || '',
      date: json.datePublished || json.startDate || '',
      startDate: json.datePublished || json.startDate || '',
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

  /**
   * Parse HTML event element (fallback)
   */
  parseHTMLEvent($, element) {
    const title = element.find('h2, h3, .splw-pro-header-title-wrapper').first().text().trim();
    const description = element.find('.splw-pro-weather-short-desc, .weather-desc, p').first().text().trim();
    const date = element.find('.splw-weather-detailed-updated-time, time').first().text().trim() ||
                 element.find('time').attr('datetime') || '';
    const image = element.find('img').first().attr('src') || '';
    const url = element.find('a').first().attr('href') || '';

    return {
      name: title,
      title: title,
      description: description,
      date: date,
      venue: 'Birmingham Area',
      location: 'Birmingham Area',
      city: 'Birmingham',
      state: 'AL',
      category: 'Event',
      image: image,
      imageUrl: image,
      url: url ? (url.startsWith('http') ? url : `https://inbirmingham.com${url}`) : '',
      link: url ? (url.startsWith('http') ? url : `https://inbirmingham.com${url}`) : ''
    };
  }
}

module.exports = InBirminghamScraper;
