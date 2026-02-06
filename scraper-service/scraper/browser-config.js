/**
 * Browser Configuration for Puppeteer
 * Handles both local development and Vercel serverless deployment
 */

let chromium;
let puppeteer;

// Try to load serverless chromium (for Vercel)
try {
  chromium = require('@sparticuz/chromium');
} catch (e) {
  chromium = null;
}

// Load puppeteer or puppeteer-core
try {
  puppeteer = chromium ? require('puppeteer-core') : require('puppeteer');
} catch (e) {
  puppeteer = require('puppeteer');
}

/**
 * Get browser launch configuration
 * Returns different config for local vs serverless (Vercel)
 */
async function getBrowserConfig() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

  if (isProduction && chromium) {
    // Vercel serverless configuration with optimizations
    const executablePath = await chromium.executablePath();

    return {
      args: [
        ...chromium.args,
        '--single-process', // Critical for Vercel to avoid spawn ETXTBSY
        '--no-zygote', // Prevents forking issues
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      // Add timeout to prevent hanging
      timeout: 30000
    };
  } else {
    // Local development configuration
    return {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };
  }
}

/**
 * Launch browser with correct configuration
 */
async function launchBrowser() {
  const config = await getBrowserConfig();
  return await puppeteer.launch(config);
}

module.exports = {
  launchBrowser,
  getBrowserConfig,
  puppeteer
};
