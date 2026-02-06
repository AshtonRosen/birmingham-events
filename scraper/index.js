const fs = require('fs').promises;
const path = require('path');
const EventNormalizer = require('./utils/normalizer');
const EventDeduplicator = require('./utils/deduplicator');

// Import all scrapers
const TicketmasterScraper = require('./sources/ticketmaster');
const BJCCScraper = require('./sources/bjcc');
const InBirminghamScraper = require('./sources/inbirmingham');
const EventbriteScraper = require('./sources/eventbrite');
const BHMSTRScraper = require('./sources/bhmstr');
const EventimScraper = require('./sources/eventim');

// New Birmingham venue scrapers
const AlabamaTheatreScraper = require('./sources/alabama-theatre');
const IronCityScraper = require('./sources/iron-city');
const WorkPlayScraper = require('./sources/workplay');
const SaturnBirminghamScraper = require('./sources/saturn-birmingham');

// Sports scrapers
const BirminghamLegionScraper = require('./sources/birmingham-legion');

// Brewery scrapers
const MondayNightBrewingScraper = require('./sources/monday-night-brewing');
const TrimTabBrewingScraper = require('./sources/trimtab-brewing');
const CahabaBrewingScraper = require('./sources/cahaba-brewing');
const AvondaleBrewingScraper = require('./sources/avondale-brewing');
const GoodPeopleBrewingScraper = require('./sources/good-people-brewing');

// Arts & culture scrapers
const SidewalkFilmScraper = require('./sources/sidewalk-film');

/**
 * Main event scraper orchestrator
 */
class EventScraper {
  constructor() {
    this.scrapers = [
      // API-based (most reliable)
      { name: 'ticketmaster', scraper: new TicketmasterScraper() },

      // Birmingham venues
      { name: 'bjcc', scraper: new BJCCScraper() },
      { name: 'alabama-theatre', scraper: new AlabamaTheatreScraper() },
      { name: 'iron-city', scraper: new IronCityScraper() },
      { name: 'workplay', scraper: new WorkPlayScraper() },
      { name: 'saturn', scraper: new SaturnBirminghamScraper() },

      // Sports
      { name: 'birmingham-legion', scraper: new BirminghamLegionScraper() },

      // Breweries
      { name: 'monday-night-brewing', scraper: new MondayNightBrewingScraper() },
      { name: 'trimtab-brewing', scraper: new TrimTabBrewingScraper() },
      { name: 'cahaba-brewing', scraper: new CahabaBrewingScraper() },
      { name: 'avondale-brewing', scraper: new AvondaleBrewingScraper() },
      { name: 'good-people-brewing', scraper: new GoodPeopleBrewingScraper() },

      // Arts & Culture
      { name: 'sidewalk-film', scraper: new SidewalkFilmScraper() },

      // Other aggregators
      { name: 'inbirmingham', scraper: new InBirminghamScraper() },
      { name: 'eventbrite', scraper: new EventbriteScraper() },
      { name: 'bhmstr', scraper: new BHMSTRScraper() },
      { name: 'eventim', scraper: new EventimScraper() }
    ];

    this.outputPath = path.join(__dirname, '..', 'data', 'events.json');
  }

  /**
   * Run all scrapers
   */
  async scrapeAll() {
    console.log('=== Birmingham Events Scraper ===');
    console.log(`Started at: ${new Date().toLocaleString()}\n`);

    const allEvents = [];
    const results = {
      scraped: {},
      normalized: 0,
      deduplicated: 0,
      final: 0,
      timestamp: new Date().toISOString()
    };

    // Run each scraper with rate limiting
    for (const { name, scraper } of this.scrapers) {
      try {
        const events = await scraper.scrape();
        results.scraped[name] = events.length;

        // Normalize events
        const normalized = events.map(event => EventNormalizer.normalize(event, name));
        allEvents.push(...normalized);

        // Rate limiting - reduced for Vercel serverless
        await this.sleep(200);
      } catch (error) {
        console.error(`Error with ${name} scraper:`, error.message);
        results.scraped[name] = 0;
      }
    }

    console.log('\n--- Scraping Summary ---');
    Object.entries(results.scraped).forEach(([source, count]) => {
      console.log(`${source}: ${count} events`);
    });

    results.normalized = allEvents.length;
    console.log(`\nTotal scraped: ${allEvents.length} events`);

    // Deduplicate events
    console.log('\nDeduplicating events...');
    const deduplicated = EventDeduplicator.mergeDuplicates(allEvents);
    results.deduplicated = allEvents.length - deduplicated.length;
    console.log(`Removed ${results.deduplicated} duplicates`);

    // Filter out invalid events (no date)
    const valid = deduplicated.filter(event => event.date !== null);
    results.final = valid.length;
    console.log(`Final event count: ${valid.length}`);

    // Group by date
    const groupedByDate = EventNormalizer.groupByDate(valid);
    const sortedByDate = EventNormalizer.sortDates(groupedByDate);

    // Save to file
    const output = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalEvents: valid.length,
        dateRange: {
          earliest: Object.keys(sortedByDate)[0] || null,
          latest: Object.keys(sortedByDate)[Object.keys(sortedByDate).length - 1] || null
        },
        sources: Object.keys(results.scraped),
        scrapingResults: results
      },
      eventsByDate: sortedByDate,
      allEvents: valid
    };

    await this.saveEvents(output);

    console.log(`\nEvents saved to: ${this.outputPath}`);
    console.log(`Completed at: ${new Date().toLocaleString()}`);
    console.log('=================================\n');

    return output;
  }

  /**
   * Save events to JSON file
   */
  async saveEvents(data) {
    const dir = path.dirname(this.outputPath);

    // Ensure data directory exists
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    await fs.writeFile(this.outputPath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Sleep helper for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get events from saved file
   */
  async getEvents() {
    try {
      const data = await fs.readFile(this.outputPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading events file:', error.message);
      return null;
    }
  }
}

// Run scraper if called directly
if (require.main === module) {
  const scraper = new EventScraper();
  scraper.scrapeAll()
    .then(() => {
      console.log('Scraping complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = EventScraper;
