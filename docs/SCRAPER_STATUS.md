# Scraper Status Report

## Currently Working ✅

These scrapers successfully fetch events:

1. **Ticketmaster** - 200+ events via API (now includes venue-specific queries for Iron City & Saturn)
2. **BJCC** - 12 events
3. **WorkPlay** - 51 events
4. **Sidewalk Film Festival** - 7 events
5. **InBirmingham.com** - 108 events
6. **Eventbrite** - 26-27 events
7. **Saturn** - Fixed with correct `/calendar` URL and selectors
8. **Avondale Brewing** - Fixed with `.event-item` selectors
9. **Cahaba Brewing** - ✨ NEW: Google Calendar API integration (3 calendars)
10. **Iron City** - ✨ NOW COVERED by Ticketmaster venue-specific query

## ✅ Alternative Data Sources Found

### Cahaba Brewing - SOLVED ✨
- **Original Issue**: FullCalendar with Google Calendar (JavaScript-rendered)
- **Attempted Solution**: Google Calendar API (failed - domain-restricted API key)
- **Final Solution**: Public iCal format (.ics feeds)
- **Status**: Now fetching from 3 public calendars (Main Events, Food Trucks, Live Music)
- **Technical Details**: Uses `node-ical` package to parse iCal feeds from Google Calendar public URLs
- **Date Range**: Fetches events from next 90 days

### Iron City - SOLVED ✨
- **Original Issue**: Ticketmaster widget (JavaScript-rendered)
- **Solution**: Query Ticketmaster API by venue ID (`KovZpZAE7IJA`)
- **Status**: Events now included in Ticketmaster scraper results

## Still JavaScript-Rendered (Low Priority) ⚠️

### TrimTab Brewing
- **URL**: https://www.trimtabbrewing.com/calendar
- **Issue**: Wix framework with heavy JavaScript, no public calendar API found
- **Status**: Would need Puppeteer
- **Priority**: Low (can check their social media for major events)

### Birmingham Legion FC
- **URL**: https://www.uslchampionship.com/birmingham-legion-fc-schedule
- **Issue**: Opta sports widget, official site uses images for schedule
- **Status**: No viable scraping solution found
- **Priority**: Low (team website posts game schedules on social media)

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

**✅ Working: 10 sources** (Ticketmaster w/ Iron City + Saturn venues, BJCC, WorkPlay, Sidewalk w/ pagination, InBirmingham, Eventbrite, Saturn, Avondale, Cahaba via iCal)

**⚠️ Would Need Puppeteer: 2 sources** (TrimTab, Birmingham Legion - both low priority)

**❌ No Public Calendar: 2 sources** (Monday Night, Good People)

**🚫 Blocked: 3 sources** (Alabama Theatre, BHMSTR, Eventim)

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

- **Before Fixes**: ~405 events scraped → 191 unique after dedup
- **After All Updates**: 480+ events → 220+ unique (estimated)
  - Cahaba iCal (3 calendars): +10-20 events
  - Sidewalk pagination (5 pages): +35 events (from 7 to 42)
  - Venue-specific Ticketmaster: +5-10 events
  - Saturn + Avondale fixes: +5-10 events
- **Still Missing**: ~10-20 events from TrimTab and Birmingham Legion (low priority)
