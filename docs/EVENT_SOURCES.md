# Birmingham Events - Complete Source List

🌐 **Live Site:** https://birmingham-events.onrender.com

**Last Updated:** February 5, 2026

---

## Overview

Birmingham Events aggregates event data from **17 local sources** to provide the most comprehensive calendar of happenings in Birmingham, Alabama.

---

## Active Event Sources (17)

### 🎟️ Major Platforms (1)

#### Ticketmaster Discovery API
- **URL:** https://www.ticketmaster.com
- **Status:** ✅ Active (API-based)
- **Events:** 50-100+ per scrape
- **Categories:** Concerts, Sports, Theater, Family events
- **Notes:** Most reliable source, requires API key
- **File:** `scraper/sources/ticketmaster.js`

---

### 🎵 Music Venues (4)

#### Alabama Theatre
- **URL:** https://alabamatheatre.com/events/
- **Address:** 1817 3rd Ave N, Birmingham, AL 35203
- **Status:** ✅ Active
- **Events:** 5-15 per month
- **Categories:** Entertainment, Concerts, Shows
- **Notes:** Historic theater with varied programming
- **File:** `scraper/sources/alabama-theatre.js`

#### Iron City
- **URL:** https://ironcitybham.com/events/
- **Address:** 2700 1st Ave S, Birmingham, AL 35233
- **Status:** ✅ Active (via Ticketmaster API)
- **Events:** 15-25 per month
- **Categories:** Music, Concerts
- **Technical:** Covered by Ticketmaster venue-specific query (Venue ID: KovZpZAE7IJA)
- **Notes:** Popular live music venue, events pulled from Ticketmaster
- **File:** `scraper/sources/ticketmaster.js` (venue query)

#### WorkPlay
- **URL:** https://workplay.com/calendar/
- **Address:** 500 23rd St S, Birmingham, AL 35233
- **Status:** ✅ Active
- **Events:** 10-20 per month
- **Categories:** Music, Live performances
- **Notes:** Theater and soundstage venue
- **File:** `scraper/sources/workplay.js`

#### Saturn
- **URL:** https://saturnbirmingham.com/calendar/
- **Address:** 200 41st St S, Birmingham, AL 35222
- **Status:** ✅ Active (dual coverage)
- **Events:** 15-25 per month
- **Categories:** Music, Entertainment
- **Technical:** Direct scraping + Ticketmaster venue query (Venue ID: KovZpZAIdEAA)
- **Notes:** Located in Avondale neighborhood. Uses SeeTickets widget.
- **File:** `scraper/sources/saturn-birmingham.js` + Ticketmaster

---

### 🍺 Breweries with Event Calendars (5)

#### Monday Night Brewing - Birmingham
- **URL:** https://mondaynightbrewing.com/birmingham/events/
- **Address:** 2821 5th Ave S, Birmingham, AL 35233
- **Status:** ❌ No public calendar (404)
- **Events:** N/A
- **Categories:** Food & Drink, Live music, Trivia
- **Notes:** No online event calendar found. Check social media for events.
- **File:** `scraper/sources/monday-night-brewing.js` (disabled)

#### TrimTab Brewing
- **URL:** https://www.trimtabbrewing.com/calendar/
- **Address:** 2721 5th Ave S, Birmingham, AL 35233
- **Status:** ⚠️ JavaScript-rendered (Wix)
- **Events:** 3-8 per month (not currently captured)
- **Categories:** Food & Drink, Community events
- **Technical:** Wix framework, would require Puppeteer
- **Notes:** Known for yoga and community gatherings. Low priority for enhancement.
- **File:** `scraper/sources/trimtab-brewing.js` (returns 0)

#### Cahaba Brewing
- **URL:** https://www.cahababrewing.com/events
- **Address:** 4500 5th Ave S, Birmingham, AL 35222
- **Status:** ✅ Active (iCal API)
- **Events:** 10-20 per month (3 calendars)
- **Categories:** Food & Drink, Live Music, Food Trucks
- **Technical:** Uses public Google Calendar iCal feeds (.ics format)
- **Notes:** Scrapes 3 calendars: Main Events, Food Trucks, Live Music
- **File:** `scraper/sources/cahaba-brewing.js`

#### Avondale Brewing
- **URL:** https://avondalebrewing.com/events/
- **Address:** 201 41st St S, Birmingham, AL 35222
- **Status:** ✅ Active
- **Events:** 5-10 per month
- **Categories:** Food & Drink, Music, Community
- **Notes:** Historic location in Avondale
- **File:** `scraper/sources/avondale-brewing.js`

#### Good People Brewing
- **URL:** https://www.goodpeoplebrewing.com/events
- **Address:** 114 14th St S, Birmingham, AL 35233
- **Status:** ❌ No public calendar (404)
- **Events:** N/A
- **Categories:** Food & Drink, Entertainment
- **Notes:** No online event calendar found. Check social media for events.
- **File:** `scraper/sources/good-people-brewing.js` (disabled)

---

### ⚽ Sports (2)

#### Birmingham Legion FC
- **URL:** https://www.uslchampionship.com/birmingham-legion-fc-schedule
- **Venue:** Protective Stadium
- **Address:** 2150 Richard Arrington Jr Blvd N, Birmingham, AL 35203
- **Status:** ⚠️ JavaScript-rendered (Opta widget)
- **Events:** 15-20 home games per season (not currently captured)
- **Categories:** Sports (Soccer)
- **Technical:** Opta sports data widget, would require Puppeteer
- **Notes:** USL Championship team, March-October season. Low priority for enhancement.
- **File:** `scraper/sources/birmingham-legion.js` (returns 0)

#### BJCC (Birmingham-Jefferson Convention Complex)
- **URL:** https://www.bjcc.org/events
- **Status:** ✅ Active
- **Events:** 10-15 per month
- **Categories:** Sports, Concerts, Conventions
- **Notes:** Includes Legacy Arena and Convention Center
- **File:** `scraper/sources/bjcc.js`

---

### 🎬 Arts & Culture (1)

#### Sidewalk Film Festival / Sidewalk Film Center
- **URL:** https://sidewalkfest.com/events-list/
- **Status:** ✅ Active (Year-round)
- **Events:** 40-50 screenings/events (paginated)
- **Categories:** Film, Arts, Screenings, Special Events
- **Technical:** FacetWP pagination (5 pages, 9 events per page)
- **Notes:** Year-round cinema + annual festival (August). Includes watch parties, marathons, free events
- **File:** `scraper/sources/sidewalk-film.js`

---

### 🌐 Event Aggregators (4)

#### InBirmingham.com
- **URL:** https://inbirmingham.com/events/
- **Status:** ⚠️ JavaScript-heavy
- **Events:** Variable
- **Categories:** Tourism, General events
- **Notes:** Official Birmingham tourism site, may need upgrade
- **File:** `scraper/sources/inbirmingham.js`

#### Eventbrite
- **URL:** Eventbrite Birmingham search
- **Status:** ⚠️ JavaScript-heavy
- **Events:** 20-50+
- **Categories:** All categories
- **Notes:** User-submitted events, may need upgrade
- **File:** `scraper/sources/eventbrite.js`

#### BHMSTR (Birmingham Arts Calendar)
- **URL:** https://www.bhmstr.com
- **Status:** ❌ Blocked (403)
- **Events:** N/A
- **Categories:** Arts, Culture
- **Notes:** Site blocks scrapers, may need different approach
- **File:** `scraper/sources/bhmstr.js`

#### Eventim.us
- **URL:** https://www.eventim.us
- **Status:** ❌ Blocked (403)
- **Events:** N/A
- **Categories:** Various
- **Notes:** Ticketing platform, blocks scrapers
- **File:** `scraper/sources/eventim.js`

---

## Source Status Summary

| Status | Count | Sources |
|--------|-------|---------|
| ✅ **Active & Working** | 10 | Ticketmaster (w/ Iron City + Saturn venues), BJCC, Alabama Theatre, WorkPlay, Saturn, Avondale, Cahaba (iCal), Sidewalk (paginated), InBirmingham, Eventbrite |
| ⚠️ **Low Priority / JS-heavy** | 2 | TrimTab (Wix), Legion FC (Opta widget) |
| ❌ **No Calendar / Blocked** | 5 | Monday Night, Good People, BHMSTR, Eventim, Iron City scraper (redundant) |
| **TOTAL** | **17** | **10 working, 7 inactive/redundant** |

---

## Expected Event Counts

**Per scrape run, typical totals:**
- **Minimum:** 100+ events (if all working sources active)
- **Average:** 150-200 events
- **Peak:** 250+ events (during high season, festival times)

**Breakdown by category:**
- Music venues: 40-80 events
- Breweries: 20-40 events
- Sports: 15-30 events
- Major platforms (Ticketmaster, BJCC): 60-120 events
- Arts & Culture: Variable (seasonal)

---

## Adding New Sources

To add a new Birmingham event source:

1. **Create scraper file:** `scraper/sources/new-source.js`
2. **Use template pattern:**
   ```javascript
   const axios = require('axios');
   const cheerio = require('cheerio');

   class NewSourceScraper {
     constructor() {
       this.baseUrl = 'https://example.com';
       this.eventsUrl = 'https://example.com/events';
     }

     async scrape() {
       // Scraping logic
     }

     parseEvent($, element) {
       // Parse event data
     }
   }

   module.exports = NewSourceScraper;
   ```

3. **Register in main scraper:** Edit `scraper/index.js`
   ```javascript
   const NewSourceScraper = require('./sources/new-source');

   // Add to scrapers array
   { name: 'new-source', scraper: new NewSourceScraper() }
   ```

4. **Test locally:** `npm run scrape`
5. **Deploy:** Push to GitHub, Render auto-deploys

---

## Potential Sources to Add

### Music Venues
- [ ] Zydeco Birmingham
- [ ] The Nick
- [ ] Bottle Tree (if reopened)
- [ ] Steel City Pop concerts

### Sports
- [ ] Birmingham Squadron (G-League Basketball)
- [ ] UAB Blazers Athletics
- [ ] Birmingham Bulls (Hockey)
- [ ] Barons Baseball (AA)

### Breweries
- [ ] Ghost Train Brewing
- [ ] Ferus Artisan Ales
- [ ] Birmingham District Brewing

### Arts & Culture
- [ ] Birmingham Museum of Art
- [ ] Alabama Symphony Orchestra
- [ ] Red Mountain Theatre
- [ ] Alys Stephens Performing Arts Center (UAB)
- [ ] Birmingham Botanical Gardens

### Other
- [ ] Birmingham Zoo events
- [ ] Regions Field (Barons)
- [ ] Pepper Place Saturday Market
- [ ] Sloss Furnaces events
- [ ] Railroad Park events

---

## Source Reliability

### Most Reliable (API or Static HTML)
1. **Ticketmaster** - Official API, 99.9% uptime
2. **BJCC** - Static HTML, consistent structure
3. **Alabama Theatre** - Static HTML, well-structured
4. **Iron City** - Static calendar page

### May Need Monitoring
- **Breweries** - Sites occasionally change structure
- **InBirmingham** - Requires JavaScript rendering
- **Eventbrite** - Requires JavaScript rendering

### Blocked/Problematic
- **BHMSTR** - Actively blocks scrapers (403)
- **Eventim** - Bot detection active

---

## Maintenance Notes

### Regular Checks (Monthly)
- [ ] Verify all scrapers returning events
- [ ] Check for website structure changes
- [ ] Update selectors if sites redesigned
- [ ] Monitor error logs for failed scrapes

### Seasonal Adjustments
- **Sidewalk Film Festival:** Active August, limited off-season
- **Birmingham Legion FC:** March-October season
- **Outdoor brewery events:** Peak spring/summer/fall

---

## Performance Metrics

### Scrape Performance
- **Total scrape time:** 15-30 seconds (all 17 sources)
- **Rate limiting:** 1 second delay between sources
- **Success rate:** 65-75% of sources return events per run
- **Cache duration:** 24 hours (daily updates at 6 AM)

### API Response Times
- `/api/events`: < 50ms (cached)
- `/api/events/search`: < 100ms
- `/api/scrape`: 30-60 seconds (background process)

---

## Technical Details

### Scraping Method by Source
- **API-based (2):** Ticketmaster (JSON API), Cahaba (iCal feeds)
- **Static HTML w/ Pagination (1):** Sidewalk (FacetWP, 5 pages)
- **Static HTML (6):** BJCC, Alabama Theatre, WorkPlay, Saturn, Avondale, InBirmingham, Eventbrite
- **JavaScript-rendered (2):** TrimTab (Wix), Legion FC (Opta)
- **No Calendar/Blocked (4):** Monday Night, Good People, BHMSTR, Eventim

### Categories Used
- Music
- Sports
- Food & Drink
- Film
- Arts
- Entertainment
- General/Event

---

## Questions or Issues?

**Site not scraping?**
1. Check if venue site changed structure
2. Inspect HTML selectors in scraper file
3. Test locally: `npm run scrape`
4. Check Render logs for errors

**Want to add a source?**
1. Provide URL to event calendar
2. Check if events are in static HTML (view source)
3. Create scraper using template above
4. Test and deploy

---

**Last Updated:** February 5, 2026
**Maintained by:** Ashton Rosen
**Live Site:** https://birmingham-events.onrender.com
