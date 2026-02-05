const express = require('express');
const cors = require('cors');
const path = require('path');
const EventScraper = require('../scraper/index');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const scraper = new EventScraper();
let cachedEvents = null;

/**
 * Load events from file on startup
 */
async function loadEvents() {
  cachedEvents = await scraper.getEvents();
  console.log(`Loaded ${cachedEvents?.allEvents?.length || 0} events from cache`);
}

/**
 * Schedule daily scraping at 6 AM
 */
function scheduleDailyScraping() {
  // Run at 6:00 AM every day (adjust as needed)
  cron.schedule('0 6 * * *', async () => {
    console.log('Running scheduled scrape...');
    try {
      cachedEvents = await scraper.scrapeAll();
      console.log('Scheduled scrape complete');
    } catch (error) {
      console.error('Scheduled scrape failed:', error);
    }
  });

  console.log('Daily scraping scheduled for 6:00 AM');
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
      return res.status(404).json({ error: 'No events found. Run scraper first.' });
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
      return res.status(404).json({ error: 'No events found. Run scraper first.' });
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
      return res.status(404).json({ error: 'No events found. Run scraper first.' });
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
      return res.status(404).json({ error: 'No events found. Run scraper first.' });
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
      return res.status(404).json({ error: 'No events found. Run scraper first.' });
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
 * Trigger manual scrape
 */
app.post('/api/scrape', async (req, res) => {
  try {
    console.log('Manual scrape triggered');
    res.json({ message: 'Scraping started', status: 'in_progress' });

    // Run scrape in background
    cachedEvents = await scraper.scrapeAll();
    console.log('Manual scrape complete');
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
      return res.status(404).json({ error: 'No events found. Run scraper first.' });
    }

    res.json(cachedEvents.metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================
// STARTUP
// ====================

app.listen(PORT, async () => {
  console.log(`\n🎉 Birmingham Events API running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/events\n`);

  // Load cached events on startup
  await loadEvents();

  // Schedule daily scraping
  scheduleDailyScraping();
});
