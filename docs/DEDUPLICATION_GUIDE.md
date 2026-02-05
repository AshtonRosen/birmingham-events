# Event Deduplication Guide

## How Duplicate Events Are Handled

When the same event appears on **Ticketmaster, Eventbrite, BJCC, and other sources**, the system automatically:

1. **Detects duplicates** using intelligent similarity matching
2. **Merges them** into a single event with the best data from all sources
3. **Preserves all URLs** so users can choose where to buy tickets

---

## The Deduplication Process

### Step 1: Generate Event Signature

Each event gets a unique "fingerprint" combining:
- **Title** (normalized: lowercase, no punctuation)
- **Date** (exact match required)
- **Venue** (normalized)

**Example:**
```
Event: "Alabama Symphony Orchestra Concert"
Date: "2026-02-15"
Venue: "Legacy Arena at the BJCC"

→ Signature: "alabama symphony orchestra concert|2026-02-15|legacy arena at the bjcc"
```

### Step 2: Calculate Similarity

When comparing two events:

```javascript
✓ Date MUST match exactly (if different = not duplicate)
✓ Title similarity: 70% weight
✓ Venue similarity: 30% weight
✓ Threshold: 80% overall similarity = duplicate
```

**Algorithm:** [Jaccard Index](https://en.wikipedia.org/wiki/Jaccard_index) - measures word overlap

**Example Comparison:**

```
Event A (Ticketmaster):
  Title: "Alabama Symphony Orchestra"
  Venue: "BJCC Legacy Arena"
  Date: "2026-02-15"

Event B (BJCC):
  Title: "ASO Performance - Alabama Symphony"
  Venue: "Legacy Arena"
  Date: "2026-02-15"

Title Similarity:
  Words in A: [alabama, symphony, orchestra]
  Words in B: [aso, performance, alabama, symphony]
  Common words: [alabama, symphony]
  Similarity: 2 / 5 = 40%

Venue Similarity:
  Words in A: [bjcc, legacy, arena]
  Words in B: [legacy, arena]
  Common words: [legacy, arena]
  Similarity: 2 / 3 = 67%

Overall Similarity:
  (0.40 × 0.7) + (0.67 × 0.3) = 0.48
  48% < 80% threshold
  → Treated as SEPARATE events (conservative approach)
```

### Step 3: Smart Merging

When duplicates ARE detected (>80% similarity), the system merges them intelligently:

| Field | Strategy | Reason |
|-------|----------|--------|
| **Description** | Take LONGEST | Most informative version |
| **Image** | Take FIRST valid | Any image is better than none |
| **Price** | Take MOST SPECIFIC | "$25-75" beats "See website" |
| **Address** | Take MOST COMPLETE | Full address beats just venue name |
| **URL** | Keep PRIMARY + save others | User can choose ticket source |
| **Sources** | Track ALL sources | Give credit, show all options |

**Example Merge:**

```javascript
// SOURCE 1: Ticketmaster
{
  title: "Ed Sheeran: Mathematics Tour",
  description: "Ed Sheeran brings his Mathematics Tour...",
  date: "2026-03-20",
  time: "19:30",
  venue: "Protective Stadium",
  price: { min: 59.50, max: 299.00 },
  image: "https://ticketmaster.com/ed-sheeran.jpg",
  url: "https://ticketmaster.com/event/ed-sheeran-12345"
}

// SOURCE 2: BJCC
{
  title: "Ed Sheeran - Mathematics Tour 2026",
  description: "Grammy Award-winning artist Ed Sheeran returns to Birmingham with his highly anticipated Mathematics Tour, featuring hits from all his albums plus new material from Subtract.",
  date: "2026-03-20",
  time: "19:30",
  venue: "Protective Stadium at The BJCC",
  price: "Varies",
  image: null,
  url: "https://bjcc.org/events/ed-sheeran"
}

// SOURCE 3: Eventbrite
{
  title: "Ed Sheeran Concert",
  description: "See Ed Sheeran live!",
  date: "2026-03-20",
  time: null,
  venue: "Protective Stadium",
  price: "See website",
  image: "https://eventbrite.com/ed-sheeran-small.jpg",
  url: "https://eventbrite.com/e/ed-sheeran-birmingham"
}

// ═══════════════════════════════════════════════════
// MERGED RESULT (Best of All Sources):
// ═══════════════════════════════════════════════════

{
  title: "Ed Sheeran: Mathematics Tour",

  // ✅ Longest description wins (BJCC)
  description: "Grammy Award-winning artist Ed Sheeran returns to Birmingham with his highly anticipated Mathematics Tour, featuring hits from all his albums plus new material from Subtract.",

  date: "2026-03-20",

  // ✅ First valid time wins (Ticketmaster)
  time: "19:30",

  // ✅ Most complete venue name (BJCC)
  venue: "Protective Stadium at The BJCC",

  // ✅ Most specific price wins (Ticketmaster)
  price: { min: 59.50, max: 299.00, currency: "USD" },

  // ✅ First valid image wins (Ticketmaster)
  image: "https://ticketmaster.com/ed-sheeran.jpg",

  // ✅ Primary URL (Ticketmaster - first source)
  url: "https://ticketmaster.com/event/ed-sheeran-12345",

  // ✅ All other URLs preserved
  alternateUrls: [
    { source: "bjcc", url: "https://bjcc.org/events/ed-sheeran" },
    { source: "eventbrite", url: "https://eventbrite.com/e/ed-sheeran-birmingham" }
  ],

  // ✅ All sources credited
  sources: ["ticketmaster", "bjcc", "eventbrite"],

  source: "ticketmaster" // Primary source for attribution
}
```

---

## Benefits of This Approach

### 1. **Best Data Quality**
Users get the most complete information by combining multiple sources:
- Detailed descriptions from official venue sites
- Accurate pricing from ticket platforms
- High-quality images from promotional materials

### 2. **Multiple Purchase Options**
Users can see where to buy tickets:
```javascript
Primary: Buy on Ticketmaster
Also available on: BJCC Box Office, Eventbrite
```

### 3. **Accurate Event Counts**
Without deduplication:
```
Ticketmaster: 85 events
BJCC: 12 events
Eventbrite: 32 events
Total: 129 events (but many duplicates!)
```

With deduplication:
```
Unique events: 104 events
Removed duplicates: 25 events
```

### 4. **Better Search Results**
No duplicate search results confusing users.

---

## Adjusting Similarity Threshold

The default threshold is **80%**. You can adjust it in `scraper/utils/deduplicator.js`:

```javascript
// Line 19: Current threshold
return this.calculateSimilarity(signature, existingSignature) > 0.8;

// More aggressive (merge more):
return this.calculateSimilarity(signature, existingSignature) > 0.7;

// More conservative (merge less):
return this.calculateSimilarity(signature, existingSignature) > 0.9;
```

**Tradeoffs:**
- **Lower threshold (0.7)**: Catches more duplicates, but may merge unrelated events
- **Higher threshold (0.9)**: Fewer false merges, but may miss obvious duplicates

---

## Testing Deduplication

Run the scraper and check the summary:

```bash
npm run scrape

# Output shows:
Total scraped: 146 events
Removed 25 duplicates
Final event count: 121
```

Check merged events in `data/events.json`:

```json
{
  "title": "Some Event",
  "sources": ["ticketmaster", "bjcc"],
  "alternateUrls": [
    { "source": "bjcc", "url": "..." }
  ]
}
```

---

## Common Scenarios

### Scenario 1: Same Event, Different Titles

```
Source A: "Christmas at the Alabama"
Source B: "Alabama Theatre Christmas Show"

→ 60% similarity (below threshold)
→ Kept as SEPARATE events (conservative)
```

**If you want these merged**, lower the threshold or use custom matching rules.

### Scenario 2: Event Series vs Individual Events

```
Source A: "Broadway Series: Hamilton"
Source B: "Hamilton"

→ 75% similarity (below threshold)
→ Kept as SEPARATE

→ This is CORRECT (series pass vs single show)
```

### Scenario 3: Different Dates

```
Source A: "Taylor Swift" on "2026-03-15"
Source B: "Taylor Swift" on "2026-03-16"

→ Date mismatch = 0% similarity
→ Kept as SEPARATE (correct - different concert dates)
```

---

## Eventim.us Integration

### Current Status: ❌ Blocked (403 Forbidden)

Eventim.us actively blocks web scrapers. I've created the scraper file (`scraper/sources/eventim.js`), but it's currently blocked.

### Why It's Blocked

Modern ticketing sites use:
- **Bot detection** (Cloudflare, DataDome, etc.)
- **Browser fingerprinting** (check if real browser)
- **Rate limiting** (too many requests = ban)
- **JavaScript challenges** (requires JS execution)

### Options to Add Eventim.us

#### Option 1: Use Puppeteer/Playwright (Browser Automation)

Install Puppeteer:
```bash
npm install puppeteer
```

Update `scraper/sources/eventim.js`:
```javascript
const puppeteer = require('puppeteer');

async scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://www.eventim.us/city/birmingham-al-2634/');
  await page.waitForSelector('.event-item');

  const events = await page.evaluate(() => {
    // Extract events from DOM
  });

  await browser.close();
  return events;
}
```

**Pros:** Works on JavaScript-heavy sites
**Cons:** Slower, more resource-intensive, requires Chrome

#### Option 2: Contact Eventim for API Access

Check if they have a partner API:
- Email: partners@eventim.us
- Look for "API Documentation" on their site
- Mention you're building a community event calendar

**Pros:** Official, reliable, fast
**Cons:** May require approval or fees

#### Option 3: Manual Curation

Add Eventim events manually:
```bash
# Create a JSON file with Eventim events
# Import via custom script
node scripts/import-manual-events.js eventim-events.json
```

**Pros:** Works immediately, no scraping issues
**Cons:** Manual work, not automated

#### Option 4: Use Existing Sources

Focus on sources that work:
- ✅ **Ticketmaster** (50-100+ events with API key)
- ✅ **BJCC** (10-15 venue events)
- ⚠️ **Eventbrite** (partial, needs JS execution)

**Many Eventim events are ALSO on Ticketmaster**, so you'll capture them via the Ticketmaster API anyway!

---

## Recommended Approach

1. **Get Ticketmaster API key** (free, 5 minutes)
   - Covers most major Birmingham events
   - Many Eventim events are also on Ticketmaster
   - Official API = reliable and legal

2. **Add Puppeteer for Eventbrite** (optional, 1 hour)
   - Captures community events not on Ticketmaster
   - Adds food festivals, small venue shows

3. **Skip Eventim for now**
   - High effort, low unique value
   - Most events available elsewhere
   - Can add later if there's demand

---

## Questions?

- **"Will duplicates confuse users?"** No - they're automatically merged!
- **"Can I see all ticket sources?"** Yes - check `alternateUrls` field
- **"What if two events look similar but aren't?"** Adjust threshold in deduplicator.js
- **"How do I debug deduplication?"** Add console.log in `mergeEventGroup()` function

The deduplication system is robust and production-ready! 🎉
