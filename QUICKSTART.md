# Quick Start Guide

Get the Birmingham Events Aggregator up and running in 5 minutes!

## 📋 Prerequisites

- Node.js 14+ installed
- (Optional) Free Ticketmaster API key from [developer.ticketmaster.com](https://developer.ticketmaster.com/)

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd birmingham-events
npm install
```

### 2. Run Initial Scrape

```bash
npm run scrape
```

This will scrape events from all configured sources and save to `data/events.json`.

Expected output:
```
=== Birmingham Events Scraper ===
Started at: 2/4/2026, 3:46:59 PM

Scraping BJCC events...
Found 12 BJCC events
...
Final event count: 3
```

### 3. Start the Web Server

```bash
npm start
```

The server will start on http://localhost:3000

### 4. View Events

Open your browser to:
- **Web Interface**: http://localhost:3000
- **API**: http://localhost:3000/api/events

## 📝 Current Status

### Working Sources

✅ **BJCC** (Birmingham-Jefferson Convention Complex)
- Uses static HTML with Modern Events Calendar plugin
- Works great with Cheerio
- Scrapes: Protective Stadium, Legacy Arena, BJCC events

### Sources Requiring Setup

🔑 **Ticketmaster** (requires API key)
1. Get free API key at [developer.ticketmaster.com](https://developer.ticketmaster.com/)
2. Edit `scraper/sources/ticketmaster.js`
3. Replace `YOUR_API_KEY_HERE` with your actual key
4. Re-run `npm run scrape`

### Sources with JavaScript Content

⚠️ **Eventbrite & InBirmingham** (require headless browser)
- These sites load content dynamically via JavaScript
- Cheerio cannot execute JavaScript
- Options:
  - Use Puppeteer/Playwright (heavier, slower)
  - Focus on other sources
  - Use their APIs if available

❌ **BHMSTR** (blocking scrapers)
- Returns 403 Forbidden error
- May require specific headers or authentication

## 🎯 What You Can Do Now

### View Events by Date

The web interface shows all scraped events organized by date:
- Today's date highlighted
- Events grouped by day
- Search and filter by category
- Click events to visit original source

### Use the API

Get events programmatically:

```bash
# Get all events
curl http://localhost:3000/api/events

# Get upcoming events
curl http://localhost:3000/api/events/upcoming

# Search events
curl http://localhost:3000/api/events/search?q=festival

# Get specific date
curl http://localhost:3000/api/events/date/2026-02-15
```

### Trigger Manual Scrape

Refresh event data anytime:

```bash
curl -X POST http://localhost:3000/api/scrape
```

Or click "Refresh Data" button on the web interface.

## 🔧 Customization

### Add More Sources

1. Create new scraper in `scraper/sources/yoursite.js`
2. Follow the pattern from `bjcc.js` or `ticketmaster.js`
3. Add to `scraper/index.js`:

```javascript
const YourSiteScraper = require('./sources/yoursite');

this.scrapers = [
  // ... existing scrapers
  { name: 'yoursite', scraper: new YourSiteScraper() }
];
```

### Change Scraping Schedule

Edit `api/server.js` line ~60:

```javascript
// Current: Daily at 6 AM
cron.schedule('0 6 * * *', async () => { ... });

// Every 6 hours
cron.schedule('0 */6 * * *', async () => { ... });

// Twice daily (6 AM and 6 PM)
cron.schedule('0 6,18 * * *', async () => { ... });
```

### Customize Frontend

- **Colors**: Edit `public/styles.css` - change `#667eea` to your color
- **Layout**: Modify `public/index.html`
- **Logic**: Update `public/app.js`

## 📚 Next Steps

1. **Get Ticketmaster API key** - Adds 100+ events from concerts, sports, etc.
2. **Deploy to hosting** - See README.md for Heroku deployment instructions
3. **Add more sources** - Local venues, arts organizations, etc.
4. **Customize styling** - Match your brand/preferences
5. **Share with community** - Make it public for Birmingham residents!

## 🐛 Troubleshooting

### No events showing

```bash
# Re-run scraper
npm run scrape

# Check data file exists
ls data/events.json

# View raw data
cat data/events.json
```

### Server won't start

```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Use different port
PORT=3001 npm start
```

### Scraper errors

- **401 Unauthorized**: Need API key (Ticketmaster)
- **403 Forbidden**: Site blocking scrapers (BHMSTR)
- **Timeout**: Increase timeout in scraper files

## 💡 Tips

- Run `npm run scrape` daily to keep events fresh (or let auto-scheduler do it)
- BJCC typically has 10-15 upcoming events at any time
- Ticketmaster API adds 50-100+ Birmingham events
- Check `data/events.json` to see raw scraped data
- Browser console (F12) shows any frontend JavaScript errors

## 🎉 You're All Set!

Your Birmingham Events Aggregator is now running. Visit http://localhost:3000 to see it in action!

For full documentation, see [README.md](README.md).
