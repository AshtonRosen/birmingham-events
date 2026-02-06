/**
 * Birmingham Events Scraper Service
 * Runs as a standalone service on Render with no timeout limits
 * Saves events to Vercel Blob storage for frontend consumption
 */

const { put } = require('@vercel/blob');
const EventScraper = require('./scraper/index');

// Configuration
const BLOB_EVENTS_URL = 'events/birmingham-events.json';

/**
 * Save events to Vercel Blob storage
 */
async function saveEventsToBlob(events) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable not set');
    }

    console.log('Saving events to Vercel Blob storage...');

    const blob = await put(BLOB_EVENTS_URL, JSON.stringify(events), {
      access: 'public',
      addRandomSuffix: false
    });

    console.log(`✅ Events saved to Blob storage: ${blob.url}`);
    console.log(`   Total events: ${events.allEvents.length}`);
    console.log(`   Date range: ${events.metadata.dateRange.earliest} to ${events.metadata.dateRange.latest}`);

    return blob.url;
  } catch (error) {
    console.error('❌ Error saving to Blob storage:', error.message);
    throw error;
  }
}

/**
 * Main scraping function
 */
async function runScrape() {
  console.log('\n=================================================');
  console.log('🚀 Birmingham Events Scraper Service');
  console.log('=================================================');
  console.log(`Started at: ${new Date().toLocaleString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Blob Token Present: ${!!process.env.BLOB_READ_WRITE_TOKEN}`);
  console.log('=================================================\n');

  try {
    // Create scraper instance
    const scraper = new EventScraper();

    // Run scrape (no timeout limits!)
    console.log('📥 Starting scrape of all sources...\n');
    const events = await scraper.scrapeAll();

    console.log('\n📤 Scraping complete! Summary:');
    console.log(`   Total events scraped: ${events.allEvents.length}`);
    console.log(`   Sources: ${events.metadata.sources.length}`);
    console.log(`   Date range: ${events.metadata.dateRange.earliest} to ${events.metadata.dateRange.latest}`);

    // Save to Vercel Blob
    const blobUrl = await saveEventsToBlob(events);

    console.log('\n=================================================');
    console.log('✅ SCRAPE SUCCESSFUL');
    console.log('=================================================');
    console.log(`Completed at: ${new Date().toLocaleString()}`);
    console.log(`Blob URL: ${blobUrl}`);
    console.log(`Events saved: ${events.allEvents.length}`);
    console.log('=================================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n=================================================');
    console.error('❌ SCRAPE FAILED');
    console.error('=================================================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('=================================================\n');

    process.exit(1);
  }
}

// Run the scrape
runScrape();
