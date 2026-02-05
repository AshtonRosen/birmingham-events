# Birmingham Events Aggregator

A lightweight event scraper and aggregator for Birmingham, AL. Scrapes events from multiple sources (Ticketmaster, Eventbrite, BJCC, InBirmingham.com, and BHMSTR) using Node.js and Cheerio, then presents them in a clean, organized web interface.

## Features

- **Multi-Source Scraping**: Aggregates events from 5+ Birmingham event sources
- **Lightweight**: Uses Cheerio for HTML parsing (no headless browser needed)
- **Smart Deduplication**: Automatically removes duplicate events from multiple sources
- **JSON API**: RESTful API for accessing event data programmatically
- **Clean Web UI**: Beautiful, responsive interface for browsing events by date
- **Daily Automation**: Automatically scrapes events daily at 6 AM
- **Comprehensive Data**: Captures name, date, time, location, description, images, prices, and categories

## Architecture

```
birmingham-events/
├── scraper/              # Event scraping logic
│   ├── sources/          # Individual source scrapers
│   │   ├── ticketmaster.js
│   │   ├── bjcc.js
│   │   ├── inbirmingham.js
│   │   ├── eventbrite.js
│   │   └── bhmstr.js
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

### Deploy to Heroku

1. Create a Heroku app
2. Add `Procfile`:

```
web: node api/server.js
```

3. Deploy:

```bash
git init
git add .
git commit -m "Initial commit"
heroku create your-app-name
git push heroku main
```

4. Run initial scrape:

```bash
heroku run npm run scrape
```

### Deploy to Vercel/Netlify

These platforms support static sites + serverless functions. You'll need to adapt the API endpoints to serverless function format.

### Environment Variables

For production, use environment variables:

```bash
PORT=3000
TICKETMASTER_API_KEY=your_key_here
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
