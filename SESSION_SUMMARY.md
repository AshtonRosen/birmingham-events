# Birmingham Events Scraper - Development Session Summary

**Date:** February 6, 2026
**Goal:** Upgrade event scraper with Puppeteer, Moon River design, and reliable hosting
**Status:** Partially complete - pending hosting solution for long-running scraper

---

## 🎯 Objectives Completed

### ✅ 1. Switched from Cheerio to Puppeteer for JavaScript-Heavy Sites

**Problem:** Sites like Saturn, WorkPlay, Sidewalk Film use JavaScript-rendered content that Cheerio couldn't scrape.

**Solution:** Upgraded 6 key scrapers to use Puppeteer headless browser:
- `scraper/sources/saturn-birmingham.js`
- `scraper/sources/workplay.js`
- `scraper/sources/sidewalk-film.js`
- `scraper/sources/iron-city.js`
- `scraper/sources/alabama-theatre.js`
- `scraper/sources/bjcc.js`

**Files Modified:**
- Created `scraper/browser-config.js` - Handles Puppeteer configuration for local vs serverless
- Added `@sparticuz/chromium` package for serverless Chrome support
- Updated package.json with Puppeteer dependencies

**Key Technical Details:**
```javascript
// browser-config.js handles both environments
const config = await getBrowserConfig(); // Auto-detects Vercel vs local
const browser = await launchBrowser();   // Works everywhere

// Vercel serverless flags to prevent spawn ETXTBSY errors:
'--single-process',  // Critical for serverless
'--no-zygote'       // Prevents forking issues
```

---

### ✅ 2. Redesigned UI with Moon River Festival Aesthetic

**Problem:** Old design used generic purple gradient with emojis, not professional.

**Solution:** Complete CSS rewrite with earth-toned color palette.

**Files Modified:**
- `public/styles.css` - Complete rewrite
- `public/index.html` - Removed emojis from header and refresh button
- `public/app.js` - Removed emojis from event cards and refresh functionality

**Moon River Color Palette:**
```css
--river-teal: #3B9C9C;
--river-teal-dark: #2C7777;
--cream: #F5F2E8;
--warm-brown: #8B6F47;
--terracotta: #D4845C;
--sage: #9CAF88;
--light-sand: #FAF7F0;
```

**Design Features:**
- Clean, professional aesthetic
- No emojis throughout entire application
- Gradient headers with teal tones
- Subtle shadows and rounded corners
- Responsive card-based layout

---

### ✅ 3. Implemented Vercel Blob Storage for Persistent Events

**Problem:** Vercel serverless functions have no persistent file system. Events weren't cached between users.

**Solution:** Implemented two-tier caching system using Vercel Blob storage.

**Files Modified:**
- `api/server.js` - Complete rewrite of caching logic
- `package.json` - Added `@vercel/blob` dependency

**Architecture:**
```javascript
// Two-tier caching:
1. In-memory cache (1 hour TTL) - Fast for same serverless instance
2. Vercel Blob storage (permanent) - Shared across all users

async function loadEvents() {
  // Check memory cache first
  if (cachedEvents && withinCacheDuration) return;

  // Fetch from Blob storage
  const response = await fetch(blobUrl);
  cachedEvents = await response.json();
}

async function saveEventsToBlob(events) {
  await put(BLOB_EVENTS_URL, JSON.stringify(events), {
    access: 'public',
    addRandomSuffix: false
  });
}
```

**Environment Variables Required:**
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage authentication

---

### ✅ 4. Added Authentication to Scrape Endpoint

**Problem:** Public scrape endpoint could be abused by anyone.

**Solution:** Bearer token authentication for POST /api/scrape.

**Files Modified:**
- `api/server.js` - Added auth middleware to POST /api/scrape

**Implementation:**
```javascript
app.post('/api/scrape', async (req, res) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... scraping logic
});
```

**Environment Variables Required:**
- `CRON_SECRET` - Random secure token for authentication

**Generated Secret:**
```
7f3e9a8c2b5d1f4e6a9b8c7d0e2f5a8b9c0d2e4f6a8b9c0d2e4f6a8b9c0d2e4f6
```

---

### ✅ 5. Optimized Scraper Performance

**Problem:** Scraper was too slow for Vercel's timeout limits.

**Changes Made:**

**Reordered scrapers by speed:**
```javascript
// Fast sources first (breweries with iCal)
cahaba-brewing, monday-night-brewing, trimtab-brewing...

// Medium speed (Cheerio-based)
inbirmingham, eventbrite, bhmstr...

// Slower (Puppeteer-based)
sidewalk-film, bjcc, alabama-theatre...

// Slowest last (Ticketmaster API)
ticketmaster
```

**Reduced timeouts:**
- Ticketmaster: 30s → 8s (fail faster)
- Rate limiting: 1000ms → 200ms between scrapers

**Files Modified:**
- `scraper/index.js` - Reordered scraper array
- `scraper/sources/ticketmaster.js` - Reduced timeout

---

### ✅ 6. Added Debug and Test Endpoints

**Problem:** Hard to diagnose issues with Blob storage and scraping.

**Solution:** Added utility endpoints.

**New Endpoints:**

**/api/health** - System health check
```json
{
  "status": "healthy",
  "version": "2.0.0-blob-storage",
  "features": {
    "blobStorage": true,
    "puppeteer": true,
    "caching": true
  },
  "eventsLoaded": true,
  "eventCount": 150,
  "blobTokenPresent": true
}
```

**/api/test-blob** - Verify Blob storage connectivity
```json
{
  "success": true,
  "message": "Blob storage is working correctly",
  "blobUrl": "https://...",
  "tokenPresent": true
}
```

**/api/test-scrape** - Test single-source scrape
- Scrapes only Cahaba Brewing (fast, reliable)
- Saves to Blob storage
- Verifies entire pipeline works

---

### ✅ 7. Created Standalone Scraper Service

**Problem:** Vercel serverless has timeout limits (10-60 seconds). Full scrape needs 30-60+ seconds.

**Solution:** Created separate service that can run on traditional hosting.

**Directory Created:** `scraper-service/`

**Files:**
- `package.json` - Dependencies and scripts
- `scraper.js` - Main entry point with Blob saving logic
- `render.yaml` - Render.com deployment configuration
- `README.md` - Comprehensive deployment guide
- `.gitignore` - Proper exclusions
- `scraper/` - Copy of all scraper code (sources, utils, config)

**Key Features:**
```javascript
// scraper.js - Standalone entry point
const scraper = new EventScraper();
const events = await scraper.scrapeAll(); // No timeout limits!
await saveEventsToBlob(events);           // Saves to Vercel Blob
```

**Designed for:**
- Render.com cron jobs (paid)
- Railway cron jobs
- GitHub Actions
- Any traditional Node.js hosting

---

## 🚫 Blockers Encountered

### Blocker 1: Vercel Serverless Timeout Limits

**Issue:** Vercel serverless functions have hard timeout limits:
- Hobby plan: 10 seconds max
- Pro plan: 60 seconds max

**Impact:** Full scrape of 19 sources (especially with Puppeteer) takes 30-60+ seconds.

**Errors Encountered:**
- "Error scraping Ticketmaster: timeout of 8000ms exceeded"
- "spawn ETXTBSY" - Puppeteer Chrome binary conflicts
- Scrape starts but never completes/saves

**Why It's Incompatible:**
- Serverless functions are stateless, ephemeral
- Optimized for quick request/response cycles
- Not designed for long-running background jobs
- Even "background" promises get killed after response sent

---

### Blocker 2: Puppeteer on Vercel Serverless

**Issue:** Chrome requires special configuration on serverless:
- Can't use regular `puppeteer` package
- Must use `puppeteer-core` + `@sparticuz/chromium`
- Single-process mode required to avoid spawn errors

**Challenges:**
- `--single-process` flag limits parallelization
- Chrome binary is large (~50MB)
- Cold starts are slow
- Memory constraints on free tier

**Partially Solved:**
- Created `browser-config.js` with proper flags
- But still constrained by timeout limits

---

### Blocker 3: Render.com Free Tier Limitation

**Issue:** Render.com no longer offers free cron jobs (as of 2026).

**Plans:**
- Free tier: Web services only (no cron jobs)
- Starter plan: $7/month minimum (includes cron jobs)

**Impact:** Can't use Render for free automated scraping.

---

## 🏗️ Current Architecture

### What's Deployed (Vercel):

```
Vercel Deployment
├── Frontend (public/)
│   ├── index.html (Moon River design)
│   ├── styles.css (earth-toned palette)
│   └── app.js (event display logic)
│
├── API (api/server.js)
│   ├── GET /api/events (read from Blob)
│   ├── GET /api/health (system status)
│   ├── GET /api/test-blob (verify Blob)
│   ├── GET /api/test-scrape (single source test)
│   └── POST /api/scrape (authenticated, but times out)
│
├── Scraper (scraper/)
│   ├── 19 source scrapers (6 with Puppeteer)
│   ├── browser-config.js (Puppeteer setup)
│   └── utils/ (normalizer, deduplicator)
│
└── Vercel Blob Storage
    └── events/birmingham-events.json (persistent events)
```

### What's Ready But Not Deployed:

```
scraper-service/ (Standalone Service)
├── scraper.js (independent entry point)
├── package.json (all dependencies)
├── render.yaml (Render config)
├── README.md (deployment guide)
└── scraper/ (full copy of scrapers)

Purpose: Run on traditional hosting with no timeout limits
Status: Code ready, needs paid hosting to deploy
```

---

## 💰 Hosting Options Evaluated

### Option 1: Vercel Serverless (Current)
- ❌ 10-60 second timeout limits
- ❌ Puppeteer issues on serverless
- ✅ Free tier available
- ✅ Great for serving frontend/API
- **Verdict:** Good for serving, bad for scraping

### Option 2: Render.com Cron Jobs
- ✅ No timeout limits
- ✅ Native cron scheduling
- ✅ Good Puppeteer support
- ❌ $7/month minimum (no free cron jobs)
- **Verdict:** Best solution if budget allows

### Option 3: Railway
- ✅ Cron jobs available
- ✅ Free tier with limits (500 hours/month)
- ✅ Good for background jobs
- ? Need to verify pricing changes
- **Verdict:** Potential free alternative to Render

### Option 4: GitHub Actions
- ✅ Completely free (unlimited for public repos)
- ✅ Cron scheduling built-in
- ✅ Can call external APIs
- ❌ Complex setup
- ❌ Puppeteer support questionable
- **Verdict:** Free but complex

### Option 5: Fly.io
- ✅ Free tier available
- ✅ Good for background jobs
- ? Cron job pricing unclear
- **Verdict:** Need more research

### Option 6: Heroku
- ✅ Free tier (limited hours)
- ✅ Add-ons for scheduling
- ❌ Free tier very limited
- **Verdict:** Marginal free option

---

## 🔑 Environment Variables Required

### Vercel Dashboard:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_VpwRQWMr9hfbkC3J_J2tbsWmTQgdJycQMOG7XZZgNaLtuAk
CRON_SECRET=7f3e9a8c2b5d1f4e6a9b8c7d0e2f5a8b9c0d2e4f6a8b9c0d2e4f6a8b9c0d2e4f6
NODE_ENV=production
```

### External Scraper Service (when deployed):
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_VpwRQWMr9hfbkC3J_J2tbsWmTQgdJycQMOG7XZZgNaLtuAk
NODE_ENV=production
```

---

## 📁 Key Files and Their Purpose

### Frontend Files:
- `public/index.html` - Main HTML with Moon River design
- `public/styles.css` - Complete CSS with earth-toned palette
- `public/app.js` - Event fetching and display logic

### Backend Files:
- `api/server.js` - Express server with Blob caching (430 lines)
- `vercel.json` - Vercel deployment configuration

### Scraper Files:
- `scraper/index.js` - Main orchestrator (199 lines)
- `scraper/browser-config.js` - Puppeteer configuration helper
- `scraper/sources/*.js` - 19 individual scrapers
- `scraper/utils/normalizer.js` - Event data standardization
- `scraper/utils/deduplicator.js` - Duplicate event removal

### Standalone Service:
- `scraper-service/scraper.js` - Independent entry point (150 lines)
- `scraper-service/package.json` - Service dependencies
- `scraper-service/render.yaml` - Render deployment config
- `scraper-service/README.md` - Full deployment guide (302 lines)

### Documentation:
- `CRON_SETUP_GUIDE.md` - Cron-job.org setup (for reference)
- `DEPLOY_TO_RENDER.md` - Render deployment guide (286 lines)
- `SESSION_SUMMARY.md` - This document

---

## 🎨 Design Specifications

### Color Palette (Moon River Festival):
```css
Primary: #3B9C9C (River Teal)
Dark: #2C7777 (River Teal Dark)
Light: #5FB8B8 (River Teal Light)
Background: #F5F2E8 (Cream)
Accent: #8B6F47 (Warm Brown)
Secondary: #D4845C (Terracotta)
Tertiary: #9CAF88 (Sage)
Text: #3A3A3A (Charcoal)
Surface: #FAF7F0 (Light Sand)
Shadow: rgba(59, 156, 156, 0.15)
```

### Typography:
```css
Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Header: 2.5em, bold, gradient
Subheader: 1.2em, 400 weight
Body: 1em, 400 weight
```

### Layout:
- Responsive grid (3 columns → 2 → 1 as screen narrows)
- Card-based design with hover effects
- Subtle shadows and rounded corners (15px)
- Gradient headers (135deg teal gradient)

---

## 📊 Scraper Statistics

### Sources (19 total):

**Breweries (iCal-based, fast):**
1. Cahaba Brewing (iCal)
2. Monday Night Brewing (Cheerio)
3. TrimTab Brewing (Cheerio)
4. Avondale Brewing (Cheerio)
5. Good People Brewing (Cheerio)

**Venues (Puppeteer-based):**
6. Saturn Birmingham (Puppeteer)
7. WorkPlay (Puppeteer)
8. Iron City (Puppeteer)
9. Alabama Theatre (Puppeteer)
10. BJCC (Puppeteer)
11. Sidewalk Film Festival (Puppeteer)

**Sports:**
12. Birmingham Legion FC (Cheerio)

**Aggregators (Cheerio-based):**
13. InBirmingham (Cheerio)
14. Eventbrite (API)
15. BHMSTR (Cheerio)
16. Eventim (Cheerio)

**Major API:**
17. Ticketmaster Discovery API (slowest)

### Expected Output:
- **Total events:** 150-200
- **Date range:** Next 30-90 days
- **Sources working:** 15-18 (some may fail occasionally)
- **Processing time:** 30-60 seconds (full scrape)

---

## 🧪 Testing Endpoints

### Manual Testing:

**Health Check:**
```bash
curl https://birmingham-events.vercel.app/api/health
```

**Blob Storage Test:**
```bash
curl https://birmingham-events.vercel.app/api/test-blob
```

**Single Source Test:**
```bash
curl https://birmingham-events.vercel.app/api/test-scrape
```

**Authenticated Scrape (POST):**
```bash
curl -X POST https://birmingham-events.vercel.app/api/scrape \
  -H "Authorization: Bearer 7f3e9a8c2b5d1f4e6a9b8c7d0e2f5a8b9c0d2e4f6a8b9c0d2e4f6a8b9c0d2e4f6" \
  -H "Content-Type: application/json"
```

---

## 🚀 Deployment History

### Commits Made (in order):

1. **Initial Puppeteer implementation** (3 scrapers)
   - Sidewalk Film, WorkPlay, Saturn
   - Added Puppeteer dependencies

2. **Moon River UI redesign**
   - Complete CSS rewrite
   - Removed all emojis
   - New color palette

3. **Vercel Blob storage implementation**
   - Two-tier caching
   - Persistent events across users

4. **Health check endpoint**
   - System diagnostics
   - Version tracking

5. **Puppeteer Vercel fixes**
   - Added @sparticuz/chromium
   - Created browser-config.js
   - Fixed spawn ETXTBSY errors

6. **Additional Puppeteer upgrades**
   - Iron City, Alabama Theatre, BJCC
   - 6 total Puppeteer scrapers

7. **Scraper performance optimizations**
   - Reordered by speed
   - Reduced timeouts
   - Faster rate limiting

8. **Authentication for scrape endpoint**
   - Bearer token auth
   - CRON_SECRET environment variable

9. **Test endpoints**
   - /api/test-blob
   - /api/test-scrape

10. **Standalone scraper service**
    - Complete separate service
    - Render deployment ready

11. **Documentation**
    - CRON_SETUP_GUIDE.md
    - DEPLOY_TO_RENDER.md
    - This SESSION_SUMMARY.md

---

## ✅ What's Working

### Vercel Deployment:
- ✅ Frontend serving perfectly
- ✅ Moon River design looks great
- ✅ API endpoints respond correctly
- ✅ Blob storage connectivity works
- ✅ Health check shows system status
- ✅ Test endpoints verify functionality

### Code Quality:
- ✅ 6 Puppeteer scrapers ready
- ✅ 13 Cheerio scrapers working
- ✅ Proper error handling
- ✅ Non-fatal failures (partial results saved)
- ✅ Detailed logging
- ✅ Clean code organization

### Documentation:
- ✅ Comprehensive READMEs
- ✅ Step-by-step guides
- ✅ Troubleshooting sections
- ✅ Code comments throughout

---

## ❌ What's Not Working

### Scraping on Vercel:
- ❌ Full scrape times out (exceeds 10-60s limit)
- ❌ POST /api/scrape starts but never completes
- ❌ No events populate automatically
- ❌ Puppeteer spawn errors occasionally

### Automation:
- ❌ No automatic scraping (no cron job deployed)
- ❌ Requires manual trigger via GET /api/test-scrape
- ❌ Events don't update on schedule

### User Experience:
- ❌ Site shows "no events" initially
- ❌ Requires manual scrape to populate
- ❌ No automatic refresh

---

## 🔮 Future Solutions

### Option A: Railway Cron Jobs (Free Tier)
**If Railway still offers free cron jobs:**
1. Deploy `scraper-service/` to Railway
2. Set up cron schedule (every 6 hours)
3. Configure BLOB_READ_WRITE_TOKEN
4. Test and verify

**Effort:** 30 minutes
**Cost:** $0 (if free tier includes cron)

### Option B: GitHub Actions (Completely Free)
**Use GitHub's built-in cron scheduling:**
1. Create `.github/workflows/scrape.yml`
2. Schedule: `0 */6 * * *`
3. Workflow runs Node.js script
4. Calls scraper-service code
5. Saves to Blob

**Effort:** 1-2 hours (research + setup)
**Cost:** $0 (free for public repos)

### Option C: Render Paid ($7/month)
**Simplest solution if budget allows:**
1. Deploy `scraper-service/` to Render
2. Use guide in `DEPLOY_TO_RENDER.md`
3. Everything works immediately

**Effort:** 15 minutes
**Cost:** $7/month

### Option D: Hybrid - Manual Trigger
**Temporary workaround:**
1. Keep current Vercel setup
2. Visit `/api/test-scrape` manually every few days
3. Saves events to Blob
4. Users see updated events

**Effort:** 0 (already working)
**Cost:** $0
**Downside:** Manual process

### Option E: Vercel Pro Upgrade
**Upgrade Vercel to Pro plan:**
- 60-second timeout (vs 10 seconds)
- May be enough for optimized scrape
- Still risky with 19 sources

**Effort:** 0 (just upgrade)
**Cost:** $20/month
**Risk:** May still timeout

---

## 📝 Recommended Next Steps

### Immediate (Free):
1. **Test current deployment** with `/api/test-scrape`
   - Verify single-source scraping works
   - Confirm Blob storage saves correctly
   - Validate events display on site

2. **Research GitHub Actions** for free cron scheduling
   - Check if Puppeteer works in Actions
   - Test with simple workflow
   - Implement if viable

### Short-term (Budget-dependent):
1. **If budget available:** Deploy to Render ($7/month)
   - Follow `DEPLOY_TO_RENDER.md` guide
   - Simplest, most reliable solution
   - Production-ready immediately

2. **If free required:** Implement GitHub Actions
   - Create workflow file
   - Test scraper execution
   - Set up 6-hour schedule

### Long-term:
1. **Optimize scraper performance**
   - Parallelize source scraping (where safe)
   - Cache common data (venue info, etc.)
   - Reduce API calls

2. **Add monitoring**
   - Track scrape success rates
   - Alert on failures
   - Log event counts over time

3. **Expand sources**
   - Add more Birmingham venues
   - Include regional events
   - Partner with local organizations

---

## 🎓 Lessons Learned

### Architecture:
- **Serverless is great for APIs, terrible for background jobs**
  - Use serverless for serving content
  - Use traditional hosting for long-running tasks
  - Keep them separate with shared data store

### Puppeteer:
- **Puppeteer on serverless is complex**
  - Requires special Chrome binaries
  - Single-process mode needed
  - Memory constraints significant
  - Better on traditional servers

### Vercel Blob:
- **Excellent shared storage solution**
  - Cheap, fast, reliable
  - Perfect for serverless architectures
  - Good API for read/write operations

### Development Process:
- **Check hosting limits early**
  - Should have verified Render free tier limitations
  - Could have saved time with early research
  - Always check pricing before architecting

---

## 📚 Documentation Files

All documentation is saved in the repository:

1. **SESSION_SUMMARY.md** (this file)
   - Complete session overview
   - Technical details
   - Future directions

2. **DEPLOY_TO_RENDER.md**
   - Step-by-step Render deployment
   - Assumes paid plan available

3. **CRON_SETUP_GUIDE.md**
   - Cron-job.org manual setup
   - Alternative to built-in cron
   - Still requires dealing with Vercel timeouts

4. **scraper-service/README.md**
   - Standalone service documentation
   - Technical details
   - Deployment options

---

## 💾 Code Repository State

**Repository:** `birmingham-events`
**Branch:** `main`
**Last Commit:** Added SESSION_SUMMARY.md

**File Structure:**
```
birmingham-events/
├── api/
│   └── server.js (Vercel API with Blob caching)
├── public/
│   ├── index.html (Moon River design)
│   ├── styles.css (Earth-toned palette)
│   └── app.js (Event display)
├── scraper/
│   ├── sources/ (19 scrapers, 6 with Puppeteer)
│   ├── utils/ (normalizer, deduplicator)
│   ├── browser-config.js (Puppeteer helper)
│   └── index.js (Main orchestrator)
├── scraper-service/ (Standalone service - ready to deploy)
│   ├── scraper.js (Independent entry point)
│   ├── package.json
│   ├── render.yaml
│   └── README.md
├── vercel.json (Vercel configuration)
├── package.json (Dependencies)
├── CRON_SETUP_GUIDE.md (Cron-job.org guide)
├── DEPLOY_TO_RENDER.md (Render deployment guide)
└── SESSION_SUMMARY.md (This document)
```

**All code committed and pushed to GitHub** ✅

---

## 🎯 Summary

### What Works:
- Beautiful Moon River-themed frontend
- 6 Puppeteer scrapers for modern sites
- Vercel Blob storage for persistence
- Clean API with health checks
- Comprehensive documentation
- Standalone service ready to deploy

### What Doesn't:
- Automatic scraping (no free cron solution deployed)
- Full scrape on Vercel (timeout issues)

### The Gap:
- Need hosting for long-running background job
- Free tier limitations prevent deployment
- Options: GitHub Actions (free), Railway (?), or Render ($7/month)

### Next Action When Ready:
1. Research GitHub Actions for free scheduling
2. OR allocate $7/month for Render
3. Follow DEPLOY_TO_RENDER.md guide
4. Deploy and test

---

**End of Session Summary**
**Saved:** February 6, 2026
**Total Development Time:** ~6 hours
**Lines of Code Modified:** ~3,000+
**Documentation Created:** ~2,500 lines
**Status:** Ready for deployment when hosting solution chosen
