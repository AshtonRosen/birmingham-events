const express = require('express');
const cors = require('cors');
const path = require('path');
const EventScraper = require('../scraper/index');
const { put, head } = require('@vercel/blob');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const scraper = new EventScraper();
let cachedEvents = null;
let lastFetchTime = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Vercel Blob storage URL for events
const BLOB_EVENTS_URL = 'events/birmingham-events.json';

/**
 * Load events from Vercel Blob storage or fallback to scraping
 */
async function loadEvents() {
  try {
    // Check if we have valid cached events in memory
    if (cachedEvents && lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      console.log(`Using in-memory cache (${cachedEvents?.allEvents?.length || 0} events)`);
      return;
    }

    console.log('Fetching events from Vercel Blob storage...');

    // Try to fetch from Vercel Blob
    const blobUrl = process.env.BLOB_READ_WRITE_TOKEN
      ? `https://blob.vercel-storage.com/${BLOB_EVENTS_URL}`
      : null;

    if (blobUrl) {
      const response = await fetch(blobUrl);
      if (response.ok) {
        cachedEvents = await response.json();
        lastFetchTime = Date.now();
        console.log(`Loaded ${cachedEvents?.allEvents?.length || 0} events from Blob storage`);
        return;
      }
    }

    // Fallback: try to load from local file (development mode ONLY)
    // Don't try on Vercel as it doesn't have persistent file system
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    if (!isProduction) {
      console.log('Development mode - attempting to load from local file...');
      cachedEvents = await scraper.getEvents();
      lastFetchTime = Date.now();
      console.log(`Loaded ${cachedEvents?.allEvents?.length || 0} events from local file`);
    } else {
      console.log('Production mode - no events in Blob storage yet. Run /api/scrape to populate.');
      cachedEvents = null;
    }
  } catch (error) {
    console.error('Error loading events:', error.message);
    cachedEvents = null;
  }
}

/**
 * Save events to Vercel Blob storage
 */
async function saveEventsToBlob(events) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('No BLOB_READ_WRITE_TOKEN found, skipping blob upload');
      return;
    }

    const blob = await put(BLOB_EVENTS_URL, JSON.stringify(events), {
      access: 'public',
      addRandomSuffix: false
    });

    console.log(`Events saved to Blob storage: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error('Error saving to Blob storage:', error.message);
  }
}

// ====================
// API ENDPOINTS
// ====================

/**
 * GET /api/events
 * Get all events
 */
app.get('/api/events', async (req, res) => {
  try {
    if (!cachedEvents) {
      await loadEvents();
    }

    if (!cachedEvents) {
      return res.status(404).json({
        error: 'No events found. Please visit /api/scrape to populate events.'
      });
    }

    res.json(cachedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/events/by-date
 * Get events grouped by date
 */
app.get('/api/events/by-date', async (req, res) => {
  try {
    if (!cachedEvents) {
      await loadEvents();
    }

    if (!cachedEvents) {
      return res.status(404).json({
        error: 'No events found. Please visit /api/scrape to populate events.'
      });
    }

    res.json({
      metadata: cachedEvents.metadata,
      events: cachedEvents.eventsByDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/events/date/:date
 * Get events for a specific date (YYYY-MM-DD)
 */
app.get('/api/events/date/:date', async (req, res) => {
  try {
    if (!cachedEvents) {
      await loadEvents();
    }

    if (!cachedEvents) {
      return res.status(404).json({
        error: 'No events found. Please visit /api/scrape to populate events.'
      });
    }

    const date = req.params.date;
    const events = cachedEvents.eventsByDate[date] || [];

    res.json({
      date,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/events/upcoming
 * Get upcoming events (from today forward)
 */
app.get('/api/events/upcoming', async (req, res) => {
  try {
    if (!cachedEvents) {
      await loadEvents();
    }

    if (!cachedEvents) {
      return res.status(404).json({
        error: 'No events found. Please visit /api/scrape to populate events.'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const upcomingEvents = {};

    Object.entries(cachedEvents.eventsByDate).forEach(([date, events]) => {
      if (date >= today) {
        upcomingEvents[date] = events;
      }
    });

    res.json({
      count: Object.values(upcomingEvents).flat().length,
      events: upcomingEvents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/events/search
 * Search events by keyword
 */
app.get('/api/events/search', async (req, res) => {
  try {
    if (!cachedEvents) {
      await loadEvents();
    }

    if (!cachedEvents) {
      return res.status(404).json({
        error: 'No events found. Please visit /api/scrape to populate events.'
      });
    }

    const query = (req.query.q || '').toLowerCase();
    if (!query) {
      return res.status(400).json({ error: 'Search query required (q parameter)' });
    }

    const results = cachedEvents.allEvents.filter(event => {
      return event.title.toLowerCase().includes(query) ||
             event.description.toLowerCase().includes(query) ||
             event.location.venue.toLowerCase().includes(query) ||
             event.category.toLowerCase().includes(query);
    });

    res.json({
      query,
      count: results.length,
      events: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scrape
 * Trigger scrape via cron job (requires CRON_SECRET for authentication)
 */
app.post('/api/scrape', async (req, res) => {
  try {
    // Authentication check
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid CRON_SECRET required'
      });
    }

    console.log('Cron scrape triggered');

    // Send immediate response
    res.json({
      message: 'Scraping started',
      status: 'in_progress',
      note: 'Running in background. Check logs for completion.'
    });

    // Run scrape (continues after response sent)
    scraper.scrapeAll()
      .then(async (events) => {
        // Save to Vercel Blob
        await saveEventsToBlob(events);

        // Update cache
        cachedEvents = events;
        lastFetchTime = Date.now();

        console.log(`Scrape complete: ${events.allEvents.length} events saved to Blob storage`);
      })
      .catch(error => {
        console.error('Scrape failed:', error.message);
      });

  } catch (error) {
    console.error('Manual scrape failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scrape
 * Trigger manual scrape via GET (for easy browser access)
 */
app.get('/api/scrape', async (req, res) => {
  try {
    console.log('Manual scrape triggered via GET');

    // Send loading page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scraping Birmingham Events</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #F5F2E8 0%, #FAF7F0 100%);
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(59, 156, 156, 0.15);
          }
          h1 {
            color: #3B9C9C;
            margin-bottom: 20px;
          }
          p {
            color: #8B6F47;
            font-size: 1.1em;
          }
          .loader {
            border: 3px solid #F5F2E8;
            border-top: 3px solid #3B9C9C;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 30px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #3B9C9C;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
          }
          a:hover {
            background: #2C7777;
          }
        </style>
        <script>
          setTimeout(() => {
            window.location.href = '/';
          }, 60000); // Redirect after 60 seconds
        </script>
      </head>
      <body>
        <div class="container">
          <h1>Scraping Birmingham Events</h1>
          <div class="loader"></div>
          <p>Scraping from 19 sources...</p>
          <p>This will take 30-60 seconds.</p>
          <p>You'll be redirected automatically, or click below:</p>
          <a href="/">Back to Events</a>
        </div>
      </body>
      </html>
    `);

    // Run scrape in background
    scraper.scrapeAll()
      .then(async (events) => {
        await scraper.saveEvents(events);
        await saveEventsToBlob(events);
        cachedEvents = events;
        lastFetchTime = Date.now();
        console.log('Manual scrape complete');
      })
      .catch(error => {
        console.error('Manual scrape failed:', error);
      });

  } catch (error) {
    console.error('Manual scrape failed:', error);
  }
});

/**
 * GET /api/metadata
 * Get metadata about the event database
 */
app.get('/api/metadata', async (req, res) => {
  try {
    if (!cachedEvents) {
      await loadEvents();
    }

    if (!cachedEvents) {
      return res.status(404).json({
        error: 'No events found. Please visit /api/scrape to populate events.'
      });
    }

    res.json(cachedEvents.metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 * Health check and version info
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0-blob-storage',
    features: {
      blobStorage: !!process.env.BLOB_READ_WRITE_TOKEN,
      puppeteer: true,
      caching: true
    },
    timestamp: new Date().toISOString(),
    eventsLoaded: !!cachedEvents,
    eventCount: cachedEvents?.allEvents?.length || 0,
    blobTokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN
  });
});

/**
 * GET /api/test-blob
 * Test Blob storage connectivity
 */
app.get('/api/test-blob', async (req, res) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'BLOB_READ_WRITE_TOKEN environment variable not found',
        message: 'Please set this in Vercel dashboard under Environment Variables'
      });
    }

    // Try to save a test file
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Blob storage is working!'
    };

    const blob = await put('test/connectivity-test.json', JSON.stringify(testData), {
      access: 'public',
      addRandomSuffix: false
    });

    res.json({
      success: true,
      message: 'Blob storage is working correctly',
      blobUrl: blob.url,
      tokenPresent: true
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: 'Failed to connect to Blob storage',
      tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN
    });
  }
});

// ====================
// STARTUP
// ====================

// Load events on startup
loadEvents();

// Export for Vercel serverless
module.exports = app;

// Start server if running locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nBirmingham Events API running on http://localhost:${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/api/events\n`);
  });
}
