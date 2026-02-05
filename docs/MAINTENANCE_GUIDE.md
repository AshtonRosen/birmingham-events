# Maintenance & Operations Guide

How to maintain, monitor, and troubleshoot the Birmingham Events system.

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Weekly Maintenance](#weekly-maintenance)
3. [Monthly Tasks](#monthly-tasks)
4. [Monitoring](#monitoring)
5. [Troubleshooting](#troubleshooting)
6. [Backup & Recovery](#backup--recovery)
7. [Performance Optimization](#performance-optimization)
8. [Security](#security)

---

## Daily Operations

### Automated Tasks

These run automatically (no action needed):

**6:00 AM Daily**
```
✓ Scraper runs automatically
✓ Events refreshed from all sources
✓ Data saved to events.json
✓ API serves updated data
```

### Manual Checks (2 minutes)

**Morning Routine (9 AM):**

1. **Check if data is fresh:**
   ```bash
   curl http://localhost:3000/api/metadata | grep lastUpdated
   ```
   Should be from today (within last 3 hours).

2. **Verify event count:**
   ```bash
   curl http://localhost:3000/api/metadata | grep totalEvents
   ```
   Should have 50-150 events (varies by season).

3. **Check for errors:**
   ```bash
   # On server (Heroku example)
   heroku logs --tail --num 50 | grep "Error"
   ```
   Should have minimal errors (403s are expected for blocked sources).

### If Something's Wrong

**Scenario 1: No events / stale data**
```bash
# Manually trigger scrape
curl -X POST http://localhost:3000/api/scrape

# Wait 30 seconds, check again
curl http://localhost:3000/api/metadata
```

**Scenario 2: Server not responding**
```bash
# Check if server is running
curl http://localhost:3000/api/metadata

# Restart server (local)
npm start

# Restart server (Heroku)
heroku restart
```

**Scenario 3: Specific scraper failing**
- Check if source website is down
- Check if HTML structure changed
- Review scraper logs for details

---

## Weekly Maintenance

### Tasks (15 minutes every Monday)

#### 1. Review Scraper Performance

```bash
# Get detailed scraping results
curl http://localhost:3000/api/metadata | jq '.scrapingResults'
```

**Expected output:**
```json
{
  "scraped": {
    "ticketmaster": 85,      // ✓ Good (with API key)
    "bjcc": 12,              // ✓ Good
    "eventbrite": 5,         // ⚠ Low (JavaScript issue)
    "inbirmingham": 0,       // ⚠ Not working
    "bhmstr": 0,             // ⚠ Blocked (403)
    "eventim": 0             // ⚠ Blocked (403)
  },
  "normalized": 102,
  "deduplicated": 8,
  "final": 94
}
```

**Action items:**
- If Ticketmaster = 0: Check API key
- If BJCC = 0: Check website, update selectors
- Others at 0: Expected (known issues)

#### 2. Check Error Logs

**Local:**
```bash
# Review logs from past week
cat logs/error.log | grep -v "403\|401"  # Filter expected errors
```

**Heroku:**
```bash
heroku logs --tail --num 100 | grep "Error"
```

**Look for:**
- ❌ Unexpected errors (NOT 403/401)
- ❌ Timeout errors
- ❌ Memory issues
- ❌ Crashes/restarts

#### 3. Verify Data Quality

**Check for missing dates:**
```bash
curl http://localhost:3000/api/events | jq '.allEvents[] | select(.date == null) | .title'
```
Should return empty (all events should have dates).

**Check for events in the past:**
```bash
# Run scraper to refresh
npm run scrape

# Verify upcoming events only show future
curl http://localhost:3000/api/events/upcoming | jq '.events | keys | .[0]'
```
Should be today's date or later.

#### 4. Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update non-breaking changes
npm update

# Test after updating
npm run scrape
npm start
# Visit http://localhost:3000
```

**IMPORTANT:** Test locally before deploying updates.

---

## Monthly Tasks

### Tasks (1 hour on 1st of month)

#### 1. Review Analytics

**If using Google Analytics:**
- Page views trend
- Top searched keywords
- Most clicked events
- User demographics (location, device)

**Key metrics:**
- Total visits: Track growth
- Bounce rate: Should be <60%
- Avg session duration: >1 minute is good
- Click-through rate: % who click event links

#### 2. Add New Event Sources

**Research potential sources:**
```bash
# Search for Birmingham event calendars
Google: "birmingham alabama events calendar"

# Check local venues:
- WorkPlay
- Iron City
- Saturn Birmingham
- Ghost Train Brewing
- Avondale Brewing
```

**Evaluate source:**
1. Has upcoming events? ✓
2. Static HTML or API? ✓ (Cheerio works)
3. Blocks scrapers? (Test with curl)
4. Unique events? (Not all on Ticketmaster)

**If good candidate:**
1. Create scraper in `scraper/sources/`
2. Test locally
3. Add to `scraper/index.js`
4. Deploy

#### 3. Database Cleanup (if using DB)

**Currently:** events.json file (no cleanup needed)

**If migrated to database:**
```sql
-- Delete events older than 6 months
DELETE FROM events WHERE date < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- Archive old events
INSERT INTO events_archive SELECT * FROM events WHERE date < DATE_SUB(NOW(), INTERVAL 1 MONTH);
DELETE FROM events WHERE date < DATE_SUB(NOW(), INTERVAL 1 MONTH);
```

#### 4. Security Updates

```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities (if any)
npm audit fix

# Test after fixing
npm test
npm run scrape
```

#### 5. Backup Configuration

```bash
# Backup important files
mkdir backups/$(date +%Y-%m)
cp package.json backups/$(date +%Y-%m)/
cp -r scraper/sources backups/$(date +%Y-%m)/
cp api/server.js backups/$(date +%Y-%m)/

# Or commit to git
git add .
git commit -m "Monthly backup $(date +%Y-%m)"
git push
```

---

## Monitoring

### Automated Monitoring (Recommended)

#### 1. Uptime Monitoring

**Use UptimeRobot (Free):**

1. Sign up at https://uptimerobot.com/
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.herokuapp.com/api/metadata`
   - Interval: 5 minutes
3. Set up alerts:
   - Email when down
   - SMS for critical (optional)

**Expected uptime:** 99.5%+ (Heroku free tier may sleep)

#### 2. Error Tracking

**Use Sentry (Free tier):**

```bash
# Install Sentry
npm install @sentry/node

# Add to api/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: process.env.NODE_ENV
});

// Catch all errors
app.use(Sentry.Handlers.errorHandler());
```

**Benefits:**
- Email alerts on errors
- Error grouping and trends
- Stack traces for debugging

#### 3. Performance Monitoring

**Simple health check endpoint:**

Add to `api/server.js`:

```javascript
app.get('/health', async (req, res) => {
  const meta = await scraper.getEvents();

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    events: {
      total: meta?.allEvents?.length || 0,
      lastUpdated: meta?.metadata?.lastUpdated || null,
      dataAge: meta?.metadata?.lastUpdated
        ? (Date.now() - new Date(meta.metadata.lastUpdated)) / 1000 / 60 / 60
        : null
    }
  };

  // Alert if data is stale (>25 hours old)
  if (health.events.dataAge > 25) {
    health.status = 'warning';
    health.message = 'Event data is stale';
  }

  res.json(health);
});
```

**Monitor this endpoint:**
```bash
curl http://localhost:3000/health
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Scraper Not Running

**Symptoms:**
- `lastUpdated` timestamp is old (>24 hours)
- Event count is low or zero

**Diagnosis:**
```bash
# Check cron job is scheduled
heroku run node -e "console.log(require('node-cron'))"

# Check scraper runs manually
npm run scrape
```

**Solutions:**
1. **Cron not running:** Restart server
   ```bash
   heroku restart
   ```

2. **Scraper crashing:** Check logs
   ```bash
   heroku logs --tail | grep "scraper"
   ```

3. **Memory issues:** Upgrade dyno
   ```bash
   heroku ps:resize web=standard-1x
   ```

#### Issue 2: Specific Source Failing

**Symptoms:**
- One source returns 0 events
- Error in logs: "Error scraping [source]"

**Diagnosis:**
```bash
# Test source directly
curl https://bjcc.org/events/

# Check if site is up
curl -I https://bjcc.org/events/
```

**Solutions:**
1. **Site is down:** Wait and retry later
2. **403 Forbidden:** Site blocking, need Puppeteer or API
3. **HTML changed:** Update selectors in scraper
4. **Timeout:** Increase timeout in scraper

**Update selectors:**
```javascript
// Example: BJCC changed from .event to .event-item
// scraper/sources/bjcc.js
$('.event-item').each((i, elem) => {  // Changed from .event
  // ...
});
```

#### Issue 3: High Memory Usage

**Symptoms:**
- Server crashes with "JavaScript heap out of memory"
- Slow performance

**Diagnosis:**
```bash
# Check memory usage
heroku ps -a your-app-name
```

**Solutions:**
1. **Increase Node memory:**
   ```json
   // package.json
   {
     "scripts": {
       "start": "node --max-old-space-size=512 api/server.js"
     }
   }
   ```

2. **Optimize scraper:**
   - Process in batches
   - Clear unused variables
   - Don't load entire datasets

3. **Use database instead of JSON:**
   - Migrate from events.json to PostgreSQL
   - Reduces memory footprint

#### Issue 4: Dates Not Parsing

**Symptoms:**
- Events have `date: null`
- "Final event count: 0" after scraping

**Diagnosis:**
```bash
# Add debug logging
# scraper/utils/normalizer.js - line 45
console.log('Raw date:', dateStr);
console.log('Parsed date:', format(date, 'yyyy-MM-dd'));
```

**Solutions:**
Add date format to normalizer:

```javascript
// scraper/utils/normalizer.js
const formats = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'MMMM dd, yyyy',
  'dd-MMM-yy',        // Add format here
  'MMM d, yyyy'       // And here
];
```

#### Issue 5: Duplicate Events Not Merging

**Symptoms:**
- Same event appears twice in results
- Different sources not combining

**Diagnosis:**
Check similarity score:

```javascript
// scraper/utils/deduplicator.js - add logging
console.log('Comparing:', sig1, 'vs', sig2);
console.log('Similarity:', this.calculateSimilarity(sig1, sig2));
```

**Solutions:**
1. **Lower threshold:**
   ```javascript
   // Line 19
   return this.calculateSimilarity(signature, existingSignature) > 0.7;  // Was 0.8
   ```

2. **Improve venue normalization:**
   ```javascript
   // scraper/utils/normalizer.js
   static normalizeVenue(venue) {
     return venue
       .toLowerCase()
       .replace(/the |at |arena|stadium/gi, '')
       .trim();
   }
   ```

---

## Backup & Recovery

### What to Backup

**Critical files:**
- `package.json` - Dependencies
- `scraper/sources/*.js` - Custom scrapers
- `api/server.js` - API configuration
- `.env` - Environment variables (if used)
- `data/events.json` - Event data (optional, regenerates)

**Not critical:**
- `node_modules/` - Can reinstall
- `data/events.json` - Regenerates on scrape

### Backup Strategy

#### Option 1: Git Repository

```bash
# Commit changes regularly
git add .
git commit -m "Backup: $(date +%Y-%m-%d)"
git push origin main

# Create monthly tags
git tag backup-2026-02
git push --tags
```

#### Option 2: Automated Backups (Heroku)

```bash
# Heroku Postgres (if using database)
heroku pg:backups:schedule --at '02:00 America/Chicago'
heroku pg:backups:download
```

#### Option 3: Manual Backups

```bash
# Create backup archive
tar -czf backup-$(date +%Y-%m-%d).tar.gz \
  package.json \
  scraper/ \
  api/ \
  public/ \
  docs/

# Store on cloud (Dropbox, Google Drive, etc.)
```

### Recovery Procedures

**Scenario 1: Server crashed, need to redeploy**

```bash
# Clone from git
git clone https://github.com/your-repo/birmingham-events.git
cd birmingham-events

# Install dependencies
npm install

# Set environment variables
heroku config:set TICKETMASTER_API_KEY=your_key

# Deploy
git push heroku main

# Run initial scrape
heroku run npm run scrape
```

**Scenario 2: Data corruption (events.json)**

```bash
# Simply re-run scraper
npm run scrape

# Data regenerates from sources
```

**Scenario 3: Lost API key**

1. Get new Ticketmaster API key from https://developer.ticketmaster.com/
2. Update in `scraper/sources/ticketmaster.js`
3. Or set as environment variable:
   ```bash
   heroku config:set TICKETMASTER_API_KEY=new_key
   ```

---

## Performance Optimization

### Current Performance

- **Scrape time:** 10-30 seconds
- **API response:** <50ms
- **Page load:** <1 second
- **Memory:** ~50MB

### Optimization Strategies

#### 1. Reduce Scrape Time

**Parallel scraping:**
```javascript
// scraper/index.js
// Instead of sequential:
for (const { name, scraper } of this.scrapers) {
  const events = await scraper.scrape();
}

// Do parallel:
const promises = this.scrapers.map(({ name, scraper }) =>
  scraper.scrape().catch(err => {
    console.error(`Error with ${name}:`, err.message);
    return [];
  })
);
const results = await Promise.all(promises);
```

**Benefits:** Scrape time reduced from 30s to 10s.

#### 2. Add API Response Caching

```javascript
// api/server.js
const cache = {};
const CACHE_DURATION = 60000; // 1 minute

app.get('/api/events', (req, res) => {
  const now = Date.now();

  if (cache.events && (now - cache.eventsTime) < CACHE_DURATION) {
    return res.json(cache.events);
  }

  // Fetch fresh data
  const events = await scraper.getEvents();
  cache.events = events;
  cache.eventsTime = now;

  res.json(events);
});
```

#### 3. Compress API Responses

```bash
npm install compression
```

```javascript
// api/server.js
const compression = require('compression');
app.use(compression());
```

**Benefits:** Reduce response size by 70%.

#### 4. Use Database (For Scale)

**When to migrate:**
- More than 1,000 events
- High traffic (1000+ requests/day)
- Need complex queries

**Migration:**
```bash
# Install PostgreSQL
npm install pg

# Create schema
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500),
  date DATE,
  time TIME,
  ...
);

# Migrate data
const events = require('./data/events.json');
events.allEvents.forEach(async event => {
  await db.query('INSERT INTO events VALUES ($1, $2, ...)', [event.id, event.title, ...]);
});
```

---

## Security

### Current Security

✓ No authentication (public read-only API)
✓ No user data stored
✓ CORS enabled (all origins)
✓ HTTPS (automatic on hosting platforms)

### Production Security Checklist

#### 1. Add Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
// api/server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

#### 2. Restrict CORS (Production)

```javascript
// api/server.js
const cors = require('cors');

app.use(cors({
  origin: 'https://birminghamevents.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

#### 3. Add Helmet (Security Headers)

```bash
npm install helmet
```

```javascript
// api/server.js
const helmet = require('helmet');
app.use(helmet());
```

#### 4. Protect Admin Endpoints

```javascript
// api/server.js
function requireAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/scrape', requireAuth, async (req, res) => {
  // Only authenticated requests can trigger scrape
});
```

#### 5. Environment Variables

**Never commit:**
- API keys
- Database credentials
- Admin passwords

**Use `.env` file (gitignored):**
```bash
# .env
TICKETMASTER_API_KEY=your_key_here
ADMIN_API_KEY=random_secure_key
DATABASE_URL=postgres://...
```

**Load in app:**
```bash
npm install dotenv
```

```javascript
// api/server.js
require('dotenv').config();
const apiKey = process.env.TICKETMASTER_API_KEY;
```

---

## Support Contacts

### Internal
- **Primary Developer:** Ashton Rosen
- **Repository:** C:\Users\ashton.rosen\birmingham-events\

### External Resources
- **Heroku Support:** https://help.heroku.com/
- **Node.js Docs:** https://nodejs.org/docs/
- **Cheerio Docs:** https://cheerio.js.org/
- **Express Docs:** https://expressjs.com/

### Emergency Contacts

**If site is down and you can't fix it:**
1. Check hosting platform status page
2. Review error logs
3. Restart server
4. Roll back to previous version
5. Contact hosting support

---

**Last Updated:** February 4, 2026
**Version:** 1.0.0
