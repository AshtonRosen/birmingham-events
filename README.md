# Birmingham Events Aggregator

A comprehensive event scraper and aggregator for Birmingham, AL. Scrapes events from **19 local sources** including music venues, breweries, sports teams, and cultural institutions using Node.js and Puppeteer headless browser, then presents them in a beautiful Moon River festival-inspired web interface.

## Features

- **Headless Browser Scraping**: Uses Puppeteer for robust JavaScript rendering and dynamic content
- **Multi-Source Scraping**: Aggregates events from 19 Birmingham event sources
  - Music venues (Alabama Theatre, Iron City, WorkPlay, Saturn)
  - Breweries (Monday Night, TrimTab, Cahaba, Avondale, Good People)
  - Sports (Birmingham Legion FC, BJCC events)
  - Arts & Culture (Sidewalk Film Festival)
  - Major platforms (Ticketmaster, Eventbrite)
- **Moon River Design**: Earthy, natural color palette inspired by Moon River Music Festival
  - River Teal (#3B9C9C), Cream (#F5F2E8), Warm Brown (#8B6F47), Terracotta (#D4845C)
  - Clean, minimalist typography
  - Responsive, mobile-friendly layout
- **Smart Deduplication**: Automatically removes duplicate events from multiple sources
- **JSON API**: RESTful API for accessing event data programmatically
- **Daily Automation**: Automatically scrapes events daily at 6 AM
- **Comprehensive Data**: Captures name, date, time, location, description, images, prices, and categories

## Architecture

```
birmingham-events/
├── scraper/              # Event scraping logic
│   ├── sources/          # Individual source scrapers (17 total)
│   │   ├── ticketmaster.js       # Ticketmaster API
│   │   ├── bjcc.js               # BJCC venue
│   │   ├── alabama-theatre.js    # Alabama Theatre
│   │   ├── iron-city.js          # Iron City venue
│   │   ├── workplay.js           # WorkPlay
│   │   ├── saturn-birmingham.js  # Saturn
│   │   ├── birmingham-legion.js  # Legion FC soccer
│   │   ├── monday-night-brewing.js
│   │   ├── trimtab-brewing.js
│   │   ├── cahaba-brewing.js
│   │   ├── avondale-brewing.js
│   │   ├── good-people-brewing.js
│   │   ├── sidewalk-film.js      # Sidewalk Film Festival
│   │   ├── inbirmingham.js       # Tourism site
│   │   ├── eventbrite.js         # Eventbrite platform
│   │   ├── bhmstr.js             # Birmingham arts
│   │   └── eventim.js            # Eventim ticketing
│   ├── utils/            # Utility functions
│   │   ├── normalizer.js # Standardize event formats
│   │   └── deduplicator.js # Remove duplicates
│   └── index.js          # Main scraper orchestrator
├── api/
│   └── server.js         # Express API server
├── public/               # Frontend
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── data/
│   └── events.json       # Scraped event data (generated)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 14+ installed
- (Optional) Free Ticketmaster API key from [developer.ticketmaster.com](https://developer.ticketmaster.com/)

### Installation

1. Clone or download this project
2. Install dependencies:

```bash
cd birmingham-events
npm install
```

3. (Optional) Add your Ticketmaster API key:

Edit `scraper/sources/ticketmaster.js` and replace `YOUR_API_KEY_HERE` with your actual API key. The scraper will work without it, but won't include Ticketmaster events.

### Running the Scraper

**First-time scrape** (populate initial data):

```bash
npm run scrape
```

This will:
- Scrape events from all sources
- Normalize and deduplicate the data
- Save to `data/events.json`
- Take ~15-30 seconds

Expected output:
```
=== Birmingham Events Scraper ===
Started at: 2/4/2026, 1:30:00 PM

Scraping Ticketmaster events...
Found 45 Ticketmaster events
Scraping BJCC events...
Found 12 BJCC events
Scraping InBirmingham.com events...
Found 8 InBirmingham events
Scraping Eventbrite events...
Found 32 Eventbrite events
Scraping BHMSTR events...
Found 15 BHMSTR events

--- Scraping Summary ---
ticketmaster: 45 events
bjcc: 12 events
inbirmingham: 8 events
eventbrite: 32 events
bhmstr: 15 events

Total scraped: 112 events
Deduplicating events...
Removed 8 duplicates
Final event count: 104

Events saved to: C:\Users\...\birmingham-events\data\events.json
Completed at: 2/4/2026, 1:30:28 PM
=================================
```

### Starting the Web Server

```bash
npm start
```

The server will:
- Start on http://localhost:3000
- Load cached events from `data/events.json`
- Schedule daily scraping at 6:00 AM
- Serve both the API and web interface

Visit http://localhost:3000 in your browser to see the events!

## Using Puppeteer for Scraping

Puppeteer provides powerful headless browser capabilities for scraping websites with dynamic JavaScript content.

### Basic Puppeteer Scraper Pattern

```javascript
const puppeteer = require('puppeteer');

class ExampleScraper {
  async scrape() {
    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Navigate to page
      await page.goto('https://example.com/events', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for dynamic content to load
      await page.waitForSelector('.event-card');

      // Extract data from DOM
      const events = await page.evaluate(() => {
        const eventElements = document.querySelectorAll('.event-card');
        return Array.from(eventElements).map(el => ({
          name: el.querySelector('.title')?.textContent?.trim(),
          date: el.querySelector('.date')?.textContent?.trim(),
          venue: el.querySelector('.venue')?.textContent?.trim(),
          url: el.querySelector('a')?.href
        }));
      });

      return events;
    } finally {
      await browser.close(); // Always close browser
    }
  }
}

module.exports = ExampleScraper;
```

### When to Use Puppeteer vs Cheerio

**Use Puppeteer when:**
- Site has dynamic JavaScript content
- Content loads via AJAX/fetch
- Need to interact with page (click buttons, fill forms)
- Site uses modern frameworks (React, Vue, Angular)

**Use Cheerio when:**
- Site has static HTML
- Content is server-rendered
- Faster scraping needed
- Lower memory usage required

### Puppeteer Best Practices

1. **Always close the browser** - Use try/finally blocks
2. **Set timeouts** - Prevent hanging on slow sites
3. **Wait for selectors** - Ensure content loads before scraping
4. **Use headless mode** - Faster and more efficient
5. **Handle errors gracefully** - Some sites may block or fail

## API Endpoints

All endpoints return JSON data.

### Get All Events

```
GET /api/events
```

Returns complete event data including metadata, events by date, and all events list.

### Get Events By Date

```
GET /api/events/by-date
```

Returns events grouped by date (YYYY-MM-DD format).

### Get Events for Specific Date

```
GET /api/events/date/2026-02-15
```

Returns all events for the specified date.

### Get Upcoming Events

```
GET /api/events/upcoming
```

Returns only upcoming events (today and future).

### Search Events

```
GET /api/events/search?q=festival
```

Search events by keyword (searches title, description, venue, category).

### Get Metadata

```
GET /api/metadata
```

Returns metadata about the event database (total count, date range, sources, last update).

### Trigger Manual Scrape

```
POST /api/scrape
```

Triggers an immediate scrape (runs in background).

## Event Data Format

Each event is normalized to this structure:

```json
{
  "id": "ticketmaster-concert-name-20260215",
  "title": "Concert Name",
  "description": "Event description...",
  "date": "2026-02-15",
  "time": "19:00",
  "endDate": null,
  "endTime": null,
  "location": {
    "venue": "Legacy Arena at The BJCC",
    "address": "2100 Richard Arrington Jr Blvd N",
    "city": "Birmingham",
    "state": "AL",
    "zipCode": "35203"
  },
  "category": "Music",
  "price": {
    "min": 45,
    "max": 125,
    "currency": "USD",
    "isFree": false
  },
  "image": "https://example.com/event-image.jpg",
  "url": "https://ticketmaster.com/event/...",
  "source": "ticketmaster",
  "scrapedAt": "2026-02-04T19:30:00.000Z"
}
```

## Customization

### Add More Event Sources

1. Create a new scraper in `scraper/sources/`:

```javascript
// scraper/sources/newsource.js
const axios = require('axios');
const cheerio = require('cheerio');

class NewSourceScraper {
  constructor() {
    this.baseUrl = 'https://example.com/events';
  }

  async scrape() {
    const response = await axios.get(this.baseUrl);
    const $ = cheerio.load(response.data);
    const events = [];

    $('.event-item').each((i, elem) => {
      events.push({
        name: $(elem).find('.title').text(),
        date: $(elem).find('.date').text(),
        // ... more fields
      });
    });

    return events;
  }
}

module.exports = NewSourceScraper;
```

2. Add to `scraper/index.js`:

```javascript
const NewSourceScraper = require('./sources/newsource');

this.scrapers = [
  // ... existing scrapers
  { name: 'newsource', scraper: new NewSourceScraper() }
];
```

### Adjust Scraping Schedule

Edit `api/server.js` to change the cron schedule:

```javascript
// Run at 6:00 AM daily
cron.schedule('0 6 * * *', async () => { ... });

// Examples:
// Every 6 hours: '0 */6 * * *'
// Twice daily (6 AM, 6 PM): '0 6,18 * * *'
// Every Monday at 8 AM: '0 8 * * 1'
```

### Customize Frontend Styling

Edit `public/styles.css` to change colors, fonts, layouts, etc.

Primary color is defined in multiple places:
- `#667eea` (purple-blue gradient)
- Change to your preferred color scheme

## Deployment

### Deploy to Vercel (Recommended)

Vercel provides the fastest hosting with automatic deployments and global edge network.

**Quick Deploy:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd birmingham-events
vercel

# Deploy to production
vercel --prod
```

**GitHub Integration (Recommended):**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel auto-detects settings and deploys
4. Every push to `main` triggers automatic production deployment

**Configuration:**

The project includes `vercel.json` for optimal deployment settings. Puppeteer is supported on Vercel with:

```javascript
// Vercel-compatible Puppeteer config
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ]
});
```

### Deploy to Railway (Alternative for Background Jobs)

Railway is great if you need persistent background scraping:

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Deploy automatically
4. $5/month for persistent hosting

### Environment Variables

For production, set environment variables in your hosting platform:

```bash
PORT=3000
NODE_ENV=production
```

## Troubleshooting

### No events showing

1. Run the scraper first: `npm run scrape`
2. Check `data/events.json` exists and has content
3. Check console for error messages

### Scraper failing on specific source

Some sites may block scrapers or change their HTML structure. Check:
- Network connectivity
- User-Agent header (set in scraper)
- HTML structure changes (update selectors)

### Rate limiting errors

If you get 429 (Too Many Requests) errors:
- Increase delays in `scraper/index.js` (line ~57: `await this.sleep(1000)`)
- Use official APIs when available (Ticketmaster)

## Contributing

This is a public tool! Contributions welcome:
- Add new event sources
- Improve deduplication logic
- Enhance UI/UX
- Add filtering/sorting features

## Legal & Ethics

This scraper:
- Only accesses publicly available event listings
- Respects robots.txt (where applicable)
- Includes rate limiting to avoid server overload
- Attributes events to their original sources
- Links back to original event pages

**Use responsibly.** If a website asks you not to scrape, use their official API instead.

## License

MIT License - feel free to use, modify, and distribute this project.

## Author

Created by Ashton Rosen for the Birmingham, AL community.

## Acknowledgments

- Built with Node.js, Cheerio, Express, and date-fns
- Event data sourced from Ticketmaster, Eventbrite, BJCC, InBirmingham.com, and BHMSTR
- Inspired by the need for a centralized Birmingham events calendar
