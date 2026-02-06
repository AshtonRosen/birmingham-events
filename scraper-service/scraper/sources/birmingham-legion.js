const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Birmingham Legion FC Scraper
 * https://www.bhmlegion.com/schedule/
 */
class BirminghamLegionScraper {
  constructor() {
    this.baseUrl = 'https://www.uslchampionship.com';
    this.scheduleUrl = 'https://www.uslchampionship.com/birmingham-legion-fc-schedule';
  }

  async scrape() {
    try {
      console.log('Scraping Birmingham Legion FC schedule...');

      const response = await axios.get(this.scheduleUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      const selectors = [
        '.match',
        '.game',
        '.schedule-item',
        'article[class*="match"]',
        '.fixture'
      ];

      let foundEvents = false;
      for (const selector of selectors) {
        const items = $(selector);
        if (items.length > 0) {
          items.each((i, elem) => {
            const event = this.parseEvent($, $(elem));
            if (event && event.name) {
              events.push(event);
              foundEvents = true;
            }
          });
          if (foundEvents) break;
        }
      }

      console.log(`Found ${events.length} Birmingham Legion FC games`);
      return events;
    } catch (error) {
      console.error('Error scraping Birmingham Legion FC:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    try {
      const opponent = element.find('.opponent, .team').first().text().trim();
      const title = opponent ? `Birmingham Legion FC vs ${opponent}` : 'Birmingham Legion FC Match';

      const dateText = element.find('.date, .match-date, time').first().text().trim();
      const timeText = element.find('.time, .match-time').first().text().trim();

      const venue = element.find('.venue, .location').first().text().trim() || 'Protective Stadium';

      const image = element.find('img').first().attr('src') || '';
      const imageUrl = image && !image.startsWith('http') ? `${this.baseUrl}${image}` : image;

      let link = element.find('a').first().attr('href') || this.scheduleUrl;
      if (link && !link.startsWith('http')) {
        link = `${this.baseUrl}${link}`;
      }

      return {
        name: title,
        title: title,
        description: `USL Championship match`,
        date: dateText,
        time: timeText,
        venue: venue,
        location: venue,
        address: '2150 Richard Arrington Jr Blvd N',
        city: 'Birmingham',
        state: 'AL',
        zipCode: '35203',
        category: 'Sports',
        image: imageUrl,
        imageUrl: imageUrl,
        url: link,
        link: link
      };
    } catch (error) {
      console.error('Error parsing Birmingham Legion event:', error.message);
      return null;
    }
  }
}

module.exports = BirminghamLegionScraper;
