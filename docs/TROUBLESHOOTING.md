# Birmingham Events - Troubleshooting Guide

**Last Updated:** February 5, 2026

This guide documents common issues and their solutions for the Birmingham Events scraper system.

---

## Table of Contents

1. [Common Scraping Issues](#common-scraping-issues)
2. [API Key Problems](#api-key-problems)
3. [Pagination Issues](#pagination-issues)
4. [JavaScript-Rendered Content](#javascript-rendered-content)
5. [Blocked Scrapers (403/404)](#blocked-scrapers-403404)
6. [Deployment Issues](#deployment-issues)

---

## Common Scraping Issues

### Issue: Scraper Returns 0 Events

**Symptoms:**
- Log shows `Found 0 [VenueName] events`
- Events visible on website but not captured

**Common Causes & Solutions:**

#### 1. **Website Structure Changed**
```
Error: Selectors no longer match current HTML structure
```

**Solution:** Update CSS selectors in scraper file
1. Visit the event calendar page
2. Right-click → Inspect Element on an event
3. Note the current CSS classes/structure
4. Update selectors in `scraper/sources/[venue].js`

**Example (Avondale Brewing fix):**
```javascript
// OLD (wrong):
const items = $('.event, .tribe-events-list-event-row');

// NEW (correct):
const items = $('.event-item');  // Updated to match actual structure
```

#### 2. **Pagination Not Handled**
```
Error: Only getting first page of results
```

**Solution:** Add pagination support

**Example (Sidewalk Film fix):**
```javascript
// Added pagination loop:
for (let page = 1; page <= 5; page++) {
  const pageUrl = page === 1 ? this.scheduleUrl : `${this.scheduleUrl}?fwp_paged=${page}`;
  // Fetch and parse each page
}
```

**Testing pagination:**
1. Check if site has "Page 2", "Next", or "Load More" buttons
2. Inspect network tab to see URL patterns (`?page=2`, `?fwp_paged=2`)
3. Implement loop to fetch all pages

#### 3. **Events Loaded by JavaScript**
```
Error: HTML exists but events missing when scraped
```

**Solution:** Use alternative data sources (API, iCal) or Puppeteer

**Example (Cahaba Brewing fix):**
- Problem: FullCalendar uses JavaScript to load Google Calendar
- Solution: Switched to public iCal feeds instead of scraping HTML

```javascript
// Instead of scraping HTML:
const ical = require('node-ical');
const data = await ical.fromURL(calendarICalUrl);
```

---

## API Key Problems

### Issue: Google Calendar API Returns "Invalid API Key"

**Symptoms:**
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key."
  }
}
```

**Cause:** API key has domain restrictions (HTTP referer restrictions)

**Solution:** Use public iCal format instead

**Before (doesn't work from server):**
```javascript
// Tries to use their restricted API key:
const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`;
```

**After (works publicly):**
```javascript
// Use public iCal URL:
const ical = require('node-ical');
const url = `https://calendar.google.com/calendar/ical/${calendarId}/public/basic.ics`;
const data = await ical.fromURL(url);
```

**How to find iCal URLs:**
1. Find Google Calendar ID in page source (e.g., `cahababrewing.com_3klg8osefbctleqqlh503j6k04@group.calendar.google.com`)
2. Construct iCal URL: `https://calendar.google.com/calendar/ical/[CALENDAR_ID]/public/basic.ics`
3. Test in browser - should download .ics file
4. Parse with `node-ical` package

---

## Pagination Issues

### Issue: Only First Page of Events Captured

**Symptoms:**
- Website shows "Page 1 of 5" but scraper only gets 7-9 events
- Total events on site doesn't match scraped count

**Diagnosis:**
1. Check browser network tab when clicking "Next Page"
2. Note URL pattern:
   - `?page=2`, `?p=2` (WordPress)
   - `?fwp_paged=2` (FacetWP)
   - `?offset=10` (offset-based)
3. Look for pagination config in page source:
   ```javascript
   "pager": {"page": 1, "per_page": 9, "total_pages": 5}
   ```

**Solution Patterns:**

**Pattern 1: URL Query Parameters**
```javascript
async scrape() {
  const events = [];
  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `${this.baseUrl}?page=${page}`;
    const pageEvents = await this.scrapePage(pageUrl);
    events.push(...pageEvents);

    // Exit if no events found
    if (pageEvents.length === 0) break;
  }
  return events;
}
```

**Pattern 2: "Load More" / Infinite Scroll**
- Requires Puppeteer to click "Load More" button
- Or find AJAX endpoint in network tab and call directly

**Pattern 3: JavaScript Pagination**
- Events loaded via API calls
- Find API endpoint in network tab
- Call API directly instead of scraping HTML

---

## JavaScript-Rendered Content

### Issue: Content Visible in Browser But Not When Scraped

**Symptoms:**
- View Source shows minimal HTML or placeholder divs
- Browser DevTools shows full content after JavaScript runs
- Cheerio returns empty results

**Diagnosis:**
```bash
# Test: Does view-source show the events?
curl [URL] | grep "event-title"

# If returns nothing, content is JS-rendered
```

**Solutions (in order of preference):**

### Option 1: Find Alternative Data Source (Best)
Look for:
- Public API endpoints (check Network tab)
- RSS feeds
- iCal/ICS calendar feeds
- JSON data endpoints

**Example:**
```javascript
// Instead of scraping Wix/JavaScript site:
// Found they use Eventbrite API:
const apiUrl = 'https://www.eventbriteapi.com/v3/organizations/[id]/events/';
```

### Option 2: Use Puppeteer (If No Alternative)
```bash
npm install puppeteer
```

```javascript
const puppeteer = require('puppeteer');

async scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(this.eventsUrl, { waitUntil: 'networkidle2' });

  // Wait for events to load
  await page.waitForSelector('.event-item');

  const events = await page.evaluate(() => {
    // Extract data from rendered DOM
    return Array.from(document.querySelectorAll('.event-item')).map(el => ({
      title: el.querySelector('.title')?.textContent,
      date: el.querySelector('.date')?.textContent
    }));
  });

  await browser.close();
  return events;
}
```

**Note:** Puppeteer is slower and uses more resources. Only use if no API/feed alternative exists.

---

## Blocked Scrapers (403/404)

### Issue: HTTP 403 Forbidden or 404 Not Found

**Symptoms:**
```
Error scraping [Venue]: Request failed with status code 403
Error scraping [Venue]: Request failed with status code 404
```

**Causes:**

#### 403 Forbidden
- Site actively blocks scrapers/bots
- User-Agent detected as bot
- Rate limiting triggered
- IP address blacklisted

**Solutions:**
1. **Better Headers:**
```javascript
const response = await axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://example.com/',
    'DNT': '1'
  }
});
```

2. **Rate Limiting:**
```javascript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 1000));
```

3. **Contact Venue:**
- Ask if they have an official API
- Request RSS feed or data export
- Explain use case (event aggregation for community benefit)

#### 404 Not Found
- URL changed or page removed
- Venue doesn't maintain online calendar

**Solutions:**
1. **Check venue website navigation** for new calendar URL
2. **Use Wayback Machine** to find old URL patterns
3. **Check robots.txt** for allowed paths: `example.com/robots.txt`
4. **Alternative sources:**
   - Check if venue posts to Ticketmaster/Eventbrite
   - Query by venue name in Ticketmaster API
   - Monitor social media (Instagram/Facebook) for events

---

## Deployment Issues

### Issue: Works Locally But Fails on Render

**Common Causes:**

#### 1. Missing Dependencies
```
Error: Cannot find module 'node-ical'
```

**Solution:**
```bash
npm install node-ical --save
git add package.json package-lock.json
git commit -m "Add node-ical dependency"
git push origin main
```

#### 2. Environment-Specific Paths
```javascript
// BAD (absolute path):
const data = require('/Users/ashton/data.json');

// GOOD (relative path):
const data = require('./data.json');
```

#### 3. Timezone Differences
```javascript
// Server may be UTC while events are in CST/CDT
// Always specify timezone or use ISO 8601 format
const date = new Date(eventDate).toLocaleString('en-US', {
  timeZone: 'America/Chicago'
});
```

---

## Quick Reference: Common Fixes

### Scraper Returns Wrong Count
1. ✅ Check pagination (add loop for multiple pages)
2. ✅ Verify selectors match current HTML
3. ✅ Test if content is JavaScript-rendered

### API Key Fails
1. ✅ Try iCal/RSS feeds instead
2. ✅ Check for domain restrictions
3. ✅ Use Ticketmaster API as fallback for venue events

### Events Show Wrong Data
1. ✅ Check date parsing for timezone issues
2. ✅ Verify selector targets correct element
3. ✅ Test with multiple event types (free vs paid, all-day vs timed)

### Deployment Fails
1. ✅ Ensure all dependencies in package.json
2. ✅ Check Render logs for specific errors
3. ✅ Test with production environment variables

---

## Testing Checklist

Before deploying scraper changes:

- [ ] Test locally: `node scraper/index.js` or `npm run scrape`
- [ ] Verify event count matches website
- [ ] Check for duplicate events
- [ ] Validate date/time parsing
- [ ] Confirm images load correctly
- [ ] Test with empty results (off-season venues)
- [ ] Check logs for errors/warnings

---

## Getting Help

### Check Logs
```bash
# Local logs:
node scraper/index.js

# Render logs:
https://dashboard.render.com → [Your Service] → Logs
```

### Debug Single Scraper
```javascript
// In scraper/index.js, comment out all but one scraper:
const scrapers = [
  { name: 'cahaba-brewing', scraper: new CahabaBrewingScraper() }
  // ... comment out others
];
```

### Common Log Patterns

**Success:**
```
Scraping [Venue] events...
Found 15 [Venue] events
```

**Failure (structure change):**
```
Scraping [Venue] events...
Found 0 [Venue] events
```

**Failure (network):**
```
Error scraping [Venue]: Request failed with status code 403
```

**Failure (parsing):**
```
Error parsing [Venue] event: Cannot read property 'text' of undefined
```

---

**Need more help?** Check other documentation:
- [EVENT_SOURCES.md](./EVENT_SOURCES.md) - All source details
- [SCRAPER_STATUS.md](./SCRAPER_STATUS.md) - Current status of all scrapers
- [README.md](../README.md) - Main project documentation

**Last Updated:** February 5, 2026
