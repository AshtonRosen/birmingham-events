# Scraper Status Report

## Currently Working ✅

These scrapers successfully fetch events:

1. **Ticketmaster** - 200 events via API
2. **BJCC** - 12 events
3. **WorkPlay** - 51 events
4. **Sidewalk Film Festival** - 7 events
5. **InBirmingham.com** - 108 events
6. **Eventbrite** - 26-27 events
7. **Saturn** - Fixed with correct `/calendar` URL and selectors
8. **Avondale Brewing** - Fixed with `.event-item` selectors

## JavaScript-Rendered Sites ⚠️

These sites use JavaScript to dynamically load events, which **Cheerio cannot scrape**. They require **Puppeteer** (headless browser) instead:

### Iron City
- **URL**: https://www.ironcitybham.com/events
- **Issue**: Events populated via `EventData.events.push()` JavaScript
- **Widget**: Ticketmaster widget (`.tw-widget-event`)
- **Solution**: Need Puppeteer to wait for JavaScript execution

### TrimTab Brewing
- **URL**: https://www.trimtabbrewing.com/calendar
- **Issue**: Wix framework with heavy JavaScript
- **Solution**: Need Puppeteer or check if they have a public Google Calendar link

### Cahaba Brewing
- **URL**: https://cahababrewing.com/taproom/calendar/
- **Issue**: FullCalendar with Google Calendar integration
- **Widget**: FullCalendar (`.fc-event`, `.fc-daygrid-event`)
- **Solution**: Need Puppeteer or scrape their Google Calendar directly

### Birmingham Legion FC
- **URL**: https://www.uslchampionship.com/birmingham-legion-fc-schedule
- **Issue**: Opta sports data widget loads schedule dynamically
- **Widget**: Opta (`.Opta-fixture`, `.Opta-Match-*`)
- **Solution**: Need Puppeteer or check if USL has a public API

## No Public Event Calendar ❌

These breweries don't maintain public online event calendars:

### Monday Night Brewing
- **URL Tried**: https://www.mondaynightbrewing.com/events
- **Status**: 404 - Page doesn't exist
- **Alternative**: Follow their Instagram/Facebook for events

### Good People Brewing
- **URL Tried**: Various URLs all returned 404 or no events
- **Alternative**: Follow their social media for events

## Blocked/Access Issues 🚫

### Alabama Theatre
- **Status**: 403 Forbidden
- **Issue**: Site blocks automated scrapers
- **Possible Solutions**:
  - Add more sophisticated headers/cookies
  - Use rotating user agents
  - Contact venue for API access

### BHMSTR
- **Status**: 403 Forbidden
- **Issue**: Actively blocks scrapers

### Eventim.us
- **Status**: 404 Not Found
- **Issue**: URL incorrect or page doesn't exist

## Summary

**Working: 8 sources** (Ticketmaster, BJCC, WorkPlay, Sidewalk, InBirmingham, Eventbrite, Saturn, Avondale)

**Need Puppeteer: 4 sources** (Iron City, TrimTab, Cahaba, Birmingham Legion)

**No Public Calendar: 2 sources** (Monday Night, Good People)

**Blocked: 3 sources** (Alabama Theatre, BHMSTR, Eventim)

## Recommended Next Steps

### Option 1: Add Puppeteer Support
Install Puppeteer and create a separate scraper type for JavaScript-heavy sites:

```bash
npm install puppeteer
```

This would allow scraping Iron City, TrimTab, Cahaba, and Birmingham Legion.

### Option 2: Find Alternative Data Sources
- **Iron City**: Check if they have an RSS feed or newsletter
- **TrimTab/Cahaba**: Look for Google Calendar embed links we can parse
- **Birmingham Legion**: Check USL Championship API

### Option 3: Focus on Working Sources
Keep the 8 working sources (currently showing 400+ events) and skip the JavaScript-heavy sites.

## Current Event Count

- **Total Events Scraped**: 404-405 events
- **After Deduplication**: ~191 unique events
- **Missing Events**: Potentially 20-50 events from JavaScript sites
