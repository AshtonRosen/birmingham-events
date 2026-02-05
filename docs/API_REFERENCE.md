# API Reference Guide

Complete reference for the Birmingham Events API.

---

## Base URL

```
Local: http://localhost:3000/api
Production: https://your-app.herokuapp.com/api
```

---

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null
}
```

Or on error:

```json
{
  "success": false,
  "data": null,
  "error": "Error message"
}
```

---

## Event Object Schema

```typescript
interface Event {
  id: string;                    // Unique event identifier
  title: string;                 // Event title
  description: string;           // Event description
  date: string;                  // ISO date (YYYY-MM-DD)
  time: string | null;           // Time (HH:mm) or null
  endDate: string | null;        // End date if multi-day
  endTime: string | null;        // End time if specified

  location: {
    venue: string;               // Venue name
    address: string;             // Street address
    city: string;                // City (usually "Birmingham")
    state: string;               // State (usually "AL")
    zipCode: string;             // ZIP code
  };

  category: string;              // Event category

  price: {
    min: number | null;          // Minimum price
    max: number | null;          // Maximum price
    currency: string;            // Currency code (USD)
    isFree: boolean;             // True if free event
  };

  image: string;                 // Image URL
  url: string;                   // Primary ticket URL
  source: string;                // Primary source

  // Optional fields (for merged events)
  alternateUrls?: Array<{
    source: string;
    url: string;
  }>;
  sources?: string[];            // All sources that listed this event
  scrapedAt: string;             // ISO timestamp
}
```

---

## Endpoints

### 1. Get All Events

Retrieve complete event dataset with metadata.

```http
GET /api/events
```

**Parameters:** None

**Response:**
```json
{
  "metadata": {
    "lastUpdated": "2026-02-04T21:47:07.799Z",
    "totalEvents": 121,
    "dateRange": {
      "earliest": "2026-02-05",
      "latest": "2026-06-30"
    },
    "sources": ["ticketmaster", "bjcc", "eventbrite", "inbirmingham", "bhmstr", "eventim"],
    "scrapingResults": {
      "scraped": {
        "ticketmaster": 85,
        "bjcc": 12,
        "eventbrite": 32,
        "inbirmingham": 0,
        "bhmstr": 0,
        "eventim": 0
      },
      "normalized": 129,
      "deduplicated": 8,
      "final": 121,
      "timestamp": "2026-02-04T21:46:59.071Z"
    }
  },
  "eventsByDate": {
    "2026-02-05": [
      {
        "id": "bjcc-kamicon-20260205",
        "title": "Kami-Con",
        "description": "Annual anime convention",
        "date": "2026-02-05",
        "time": "10:00",
        "endDate": "2026-02-08",
        "endTime": null,
        "location": {
          "venue": "BJCC",
          "address": "2100 Richard Arrington Jr Blvd N",
          "city": "Birmingham",
          "state": "AL",
          "zipCode": "35203"
        },
        "category": "Convention",
        "price": {
          "min": null,
          "max": null,
          "currency": "USD",
          "isFree": false
        },
        "image": "https://bjcc.org/images/kamicon.jpg",
        "url": "https://bjcc.org/events/kamicon",
        "source": "bjcc",
        "scrapedAt": "2026-02-04T21:47:05.123Z"
      }
    ],
    "2026-02-06": [ /* more events */ ]
  },
  "allEvents": [ /* flat array of all events */ ]
}
```

**Use Cases:**
- Full data export
- Initial app data load
- Analytics and reporting

**Example:**
```bash
curl http://localhost:3000/api/events
```

---

### 2. Get Events By Date (Grouped)

Retrieve events grouped by date with metadata.

```http
GET /api/events/by-date
```

**Parameters:** None

**Response:**
```json
{
  "metadata": {
    "lastUpdated": "2026-02-04T21:47:07.799Z",
    "totalEvents": 121,
    "dateRange": {
      "earliest": "2026-02-05",
      "latest": "2026-06-30"
    },
    "sources": ["ticketmaster", "bjcc", "eventbrite"]
  },
  "events": {
    "2026-02-05": [ /* events array */ ],
    "2026-02-06": [ /* events array */ ],
    "2026-02-07": [ /* events array */ ]
  }
}
```

**Use Cases:**
- Calendar view
- Events organized by day
- Faster than /api/events (no allEvents array)

**Example:**
```bash
curl http://localhost:3000/api/events/by-date
```

---

### 3. Get Events for Specific Date

Retrieve all events for a single date.

```http
GET /api/events/date/:date
```

**URL Parameters:**
- `date` (string, required): Date in YYYY-MM-DD format

**Response:**
```json
{
  "date": "2026-02-15",
  "count": 5,
  "events": [
    {
      "id": "ticketmaster-concert-20260215",
      "title": "Concert Name",
      "date": "2026-02-15",
      "time": "19:30",
      "location": {
        "venue": "Legacy Arena",
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
      "image": "https://ticketmaster.com/image.jpg",
      "url": "https://ticketmaster.com/event/123",
      "source": "ticketmaster",
      "scrapedAt": "2026-02-04T21:47:05.456Z"
    }
  ]
}
```

**Error Response (no events):**
```json
{
  "date": "2026-12-25",
  "count": 0,
  "events": []
}
```

**Use Cases:**
- Daily event listing
- "What's happening on [date]"
- Date-specific widgets

**Examples:**
```bash
# Get Valentine's Day events
curl http://localhost:3000/api/events/date/2026-02-14

# Get today's events (dynamically)
DATE=$(date +%Y-%m-%d)
curl http://localhost:3000/api/events/date/$DATE
```

---

### 4. Get Upcoming Events

Retrieve only upcoming events (today and future).

```http
GET /api/events/upcoming
```

**Parameters:** None

**Response:**
```json
{
  "count": 85,
  "events": {
    "2026-02-05": [ /* today's events */ ],
    "2026-02-06": [ /* tomorrow's events */ ],
    "2026-02-07": [ /* future events */ ]
  }
}
```

**Notes:**
- Automatically filters out past events
- "Today" is based on server time
- Events are grouped by date

**Use Cases:**
- Homepage "What's Coming Up"
- Mobile app event feed
- Email newsletters

**Example:**
```bash
curl http://localhost:3000/api/events/upcoming
```

**JavaScript Example:**
```javascript
fetch('http://localhost:3000/api/events/upcoming')
  .then(res => res.json())
  .then(data => {
    console.log(`${data.count} upcoming events`);
    Object.entries(data.events).forEach(([date, events]) => {
      console.log(`${date}: ${events.length} events`);
    });
  });
```

---

### 5. Search Events

Search events by keyword across multiple fields.

```http
GET /api/events/search?q=keyword
```

**Query Parameters:**
- `q` (string, required): Search query (minimum 1 character)

**Search Fields:**
- Event title (primary)
- Description
- Venue name
- Category

**Response:**
```json
{
  "query": "symphony",
  "count": 3,
  "events": [
    {
      "id": "ticketmaster-symphony-20260220",
      "title": "Alabama Symphony Orchestra",
      "description": "Classical music performance...",
      "date": "2026-02-20",
      "time": "19:30",
      "location": {
        "venue": "Legacy Arena",
        "address": "2100 Richard Arrington Jr Blvd N",
        "city": "Birmingham",
        "state": "AL",
        "zipCode": "35203"
      },
      "category": "Music",
      "price": {
        "min": 25,
        "max": 75,
        "currency": "USD",
        "isFree": false
      },
      "image": "https://ticketmaster.com/aso.jpg",
      "url": "https://ticketmaster.com/event/aso-123",
      "source": "ticketmaster",
      "scrapedAt": "2026-02-04T21:47:06.789Z"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "Search query required (q parameter)"
}
```

**Notes:**
- Case-insensitive search
- Partial word matching
- No fuzzy matching (exact substring match)
- Results not sorted by relevance (chronological)

**Use Cases:**
- Search bar functionality
- "Find concerts near me"
- Category-specific search

**Examples:**
```bash
# Search for concerts
curl "http://localhost:3000/api/events/search?q=concert"

# Search for free events
curl "http://localhost:3000/api/events/search?q=free"

# Search for venue
curl "http://localhost:3000/api/events/search?q=bjcc"

# URL encoding for spaces
curl "http://localhost:3000/api/events/search?q=food%20festival"
```

**JavaScript Example:**
```javascript
async function searchEvents(query) {
  const response = await fetch(
    `http://localhost:3000/api/events/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.events;
}

// Usage
searchEvents('jazz').then(events => {
  console.log(`Found ${events.length} jazz events`);
});
```

---

### 6. Get Metadata

Retrieve metadata about the event database.

```http
GET /api/metadata
```

**Parameters:** None

**Response:**
```json
{
  "lastUpdated": "2026-02-04T21:47:07.799Z",
  "totalEvents": 121,
  "dateRange": {
    "earliest": "2026-02-05",
    "latest": "2026-06-30"
  },
  "sources": ["ticketmaster", "bjcc", "eventbrite", "inbirmingham", "bhmstr", "eventim"],
  "scrapingResults": {
    "scraped": {
      "ticketmaster": 85,
      "bjcc": 12,
      "eventbrite": 32,
      "inbirmingham": 0,
      "bhmstr": 0,
      "eventim": 0
    },
    "normalized": 129,
    "deduplicated": 8,
    "final": 121,
    "timestamp": "2026-02-04T21:46:59.071Z"
  }
}
```

**Use Cases:**
- Display "last updated" time
- Health check (is data fresh?)
- Analytics (source performance)
- Debug (how many events from each source)

**Example:**
```bash
curl http://localhost:3000/api/metadata
```

**JavaScript Example:**
```javascript
fetch('http://localhost:3000/api/metadata')
  .then(res => res.json())
  .then(meta => {
    const lastUpdate = new Date(meta.lastUpdated);
    const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 24) {
      console.warn('Data is stale (>24 hours old)');
    }

    console.log(`${meta.totalEvents} events from ${meta.sources.length} sources`);
  });
```

---

### 7. Trigger Manual Scrape

Manually trigger an immediate event scrape.

```http
POST /api/scrape
```

**Parameters:** None

**Request Body:** None (empty POST)

**Response:**
```json
{
  "message": "Scraping started",
  "status": "in_progress"
}
```

**Notes:**
- Scraping runs in background (non-blocking)
- Takes 10-30 seconds to complete
- Check `/api/metadata` for `lastUpdated` to confirm completion
- Only one scrape can run at a time (concurrent requests are ignored)

**Use Cases:**
- Admin dashboard "Refresh Data" button
- Webhook from external source (new event posted)
- Manual data refresh when needed

**Examples:**

**cURL:**
```bash
curl -X POST http://localhost:3000/api/scrape
```

**JavaScript (fetch):**
```javascript
async function triggerScrape() {
  const response = await fetch('http://localhost:3000/api/scrape', {
    method: 'POST'
  });
  const result = await response.json();
  console.log(result.message); // "Scraping started"

  // Wait 30 seconds then check if complete
  setTimeout(async () => {
    const meta = await fetch('http://localhost:3000/api/metadata').then(r => r.json());
    console.log('Last updated:', meta.lastUpdated);
  }, 30000);
}
```

**jQuery:**
```javascript
$.post('http://localhost:3000/api/scrape', function(data) {
  alert('Scraping started!');
});
```

---

## Rate Limiting

**Current:** No rate limiting implemented.

**Recommended for Production:**
```javascript
// Install: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## CORS (Cross-Origin Resource Sharing)

**Current:** All origins allowed

```javascript
// In api/server.js
app.use(cors()); // Allows all origins
```

**For Production (restrict to your domain):**
```javascript
app.use(cors({
  origin: 'https://birminghamevents.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

---

## Error Handling

All endpoints handle errors gracefully:

**Common Errors:**

| Code | Message | Cause |
|------|---------|-------|
| 404 | No events found | No data in events.json (run scraper) |
| 400 | Search query required | Missing `q` parameter in /search |
| 500 | Internal server error | Server crash, check logs |

**Example Error Response:**
```json
{
  "error": "No events found. Run scraper first."
}
```

---

## Response Times

**Typical Response Times:**
- `/api/events`: 50-100ms (large response)
- `/api/events/by-date`: 30-50ms (medium response)
- `/api/events/date/:date`: 10-20ms (small response)
- `/api/events/upcoming`: 30-50ms (medium response)
- `/api/events/search`: 20-40ms (varies by results)
- `/api/metadata`: 5-10ms (tiny response)
- `/api/scrape`: 2-5ms (async, non-blocking)

---

## Caching

**Current Implementation:**
- Events loaded into memory on server startup
- No cache expiration (data is refreshed by scraper, not API)
- No CDN caching

**Recommended Caching Headers:**
```javascript
app.get('/api/events', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
  res.json(cachedEvents);
});
```

---

## Webhooks (Future Enhancement)

Not currently implemented. Potential webhook events:

- `event.created` - New event added
- `event.updated` - Event details changed
- `event.deleted` - Event removed
- `scrape.started` - Scraping began
- `scrape.completed` - Scraping finished

---

## Authentication (Future Enhancement)

Not currently implemented. For admin endpoints, consider:

```javascript
// Simple API key auth
app.post('/api/scrape', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... scraping logic
});
```

---

## Testing the API

### Using cURL

```bash
# Test all endpoints
curl http://localhost:3000/api/events
curl http://localhost:3000/api/events/by-date
curl http://localhost:3000/api/events/date/2026-02-15
curl http://localhost:3000/api/events/upcoming
curl "http://localhost:3000/api/events/search?q=concert"
curl http://localhost:3000/api/metadata
curl -X POST http://localhost:3000/api/scrape
```

### Using Postman

1. Import collection:
   - New Collection → "Birmingham Events API"
   - Add requests for each endpoint
   - Save for team collaboration

2. Environment variables:
   - `base_url`: `http://localhost:3000/api`
   - Use `{{base_url}}/events` in requests

### Using JavaScript

```javascript
// Complete API client example
class BirminghamEventsAPI {
  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  async getAllEvents() {
    const res = await fetch(`${this.baseUrl}/events`);
    return res.json();
  }

  async getEventsByDate() {
    const res = await fetch(`${this.baseUrl}/events/by-date`);
    return res.json();
  }

  async getEventsForDate(date) {
    const res = await fetch(`${this.baseUrl}/events/date/${date}`);
    return res.json();
  }

  async getUpcomingEvents() {
    const res = await fetch(`${this.baseUrl}/events/upcoming`);
    return res.json();
  }

  async searchEvents(query) {
    const res = await fetch(
      `${this.baseUrl}/events/search?q=${encodeURIComponent(query)}`
    );
    return res.json();
  }

  async getMetadata() {
    const res = await fetch(`${this.baseUrl}/metadata`);
    return res.json();
  }

  async triggerScrape() {
    const res = await fetch(`${this.baseUrl}/scrape`, { method: 'POST' });
    return res.json();
  }
}

// Usage
const api = new BirminghamEventsAPI();

api.getUpcomingEvents().then(data => {
  console.log(`${data.count} upcoming events`);
});

api.searchEvents('jazz').then(data => {
  console.log(`Found ${data.count} jazz events`);
});
```

---

## API Version History

### v1.0.0 (Current)
- Initial release
- 7 endpoints
- JSON responses
- No authentication
- No rate limiting
- CORS enabled (all origins)

---

**Last Updated:** February 4, 2026
