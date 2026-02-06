# Birmingham Events Scraper Service

Standalone background scraper service that runs on Render.com with no timeout limits.

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Vercel (Frontend + API)                         │
│ - Serves website                                 │
│ - Reads from Blob storage                       │
│ - Fast, edge-cached                             │
└─────────────────────────────────────────────────┘
                     ↑
                     │ (reads events)
                     │
        ┌────────────┴────────────┐
        │  Vercel Blob Storage    │
        │  (shared data store)    │
        └────────────┬────────────┘
                     │ (writes events)
                     ↓
┌─────────────────────────────────────────────────┐
│ Render (This Service)                           │
│ - Scrapes 19 sources (no timeout)              │
│ - Runs every 6 hours (cron)                    │
│ - Saves to Blob storage                         │
│ - Puppeteer works perfectly                    │
└─────────────────────────────────────────────────┘
```

## Why Separate Service?

- **No Timeout Limits** - Vercel serverless has 10-60s limits, Render has none
- **Better for Puppeteer** - Traditional servers handle Chrome better
- **Cleaner Architecture** - Background jobs separate from frontend
- **Free Tier Available** - Render free tier is perfect for scheduled jobs

## Features

✅ Scrapes 19 event sources (breweries, venues, aggregators)
✅ Uses Puppeteer for JavaScript-rendered sites
✅ Normalizes and deduplicates events
✅ Saves to Vercel Blob storage
✅ Runs automatically every 6 hours
✅ Detailed logging
✅ No timeout limits

## Deployment to Render

### Prerequisites

1. **GitHub Account** - Code must be in a GitHub repository
2. **Render Account** - Sign up at https://render.com (free)
3. **Vercel Blob Token** - From Vercel dashboard (already have this)

### Step 1: Push to GitHub

If not already done:

```bash
cd "C:\Users\ashton.rosen\Documents\Folders to Save\ClaudeCode\Projects\Bham Event Scraper\birmingham-events"
git add .
git commit -m "Add standalone scraper service for Render"
git push origin main
```

### Step 2: Create Render Service

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click "New +" button
   - Select "Cron Job"

2. **Connect GitHub Repository:**
   - Select your `birmingham-events` repository
   - Click "Connect"

3. **Configure the Service:**
   - **Name:** `birmingham-events-scraper`
   - **Runtime:** `Node`
   - **Root Directory:** `scraper-service`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Schedule:** `0 */6 * * *` (every 6 hours)
   - **Plan:** Free

4. **Add Environment Variable:**
   - Click "Environment" tab
   - Click "Add Environment Variable"
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** `vercel_blob_rw_VpwRQWMr9hfbkC3J_J2tbsWmTQgdJycQMOG7XZZgNaLtuAk`
   - Click "Save Changes"

5. **Deploy:**
   - Click "Create Cron Job"
   - Wait 2-3 minutes for first deployment
   - Check logs for "✅ SCRAPE SUCCESSFUL"

### Step 3: Test the Scraper

**Option A: Trigger Manual Run**

In Render Dashboard:
1. Go to your cron job
2. Click "Trigger Run" button
3. Watch the logs in real-time

**Option B: Wait for Scheduled Run**

The scraper will run automatically:
- 12:00 AM UTC
- 6:00 AM UTC
- 12:00 PM UTC
- 6:00 PM UTC

### Step 4: Verify Events on Site

After scraper runs (check Render logs for "✅ SCRAPE SUCCESSFUL"):

1. **Check Vercel site health:**
   ```
   https://birmingham-events.vercel.app/api/health
   ```
   Should show: `"eventsLoaded": true, "eventCount": 150+`

2. **Visit your site:**
   ```
   https://birmingham-events.vercel.app/
   ```
   Should display events with Moon River design!

## Monitoring

### Check Scraper Logs

1. Go to Render Dashboard
2. Select "birmingham-events-scraper"
3. Click "Logs" tab
4. View real-time or historical logs

### Check Execution History

1. Go to Render Dashboard
2. Select your cron job
3. See "Last Run" status
4. View execution history

### Email Notifications (Optional)

Render can send email notifications on failures:
1. Go to cron job settings
2. Enable "Notify on Failure"
3. Enter your email

## Troubleshooting

### Issue: "BLOB_READ_WRITE_TOKEN not set"

**Fix:**
- Go to Render Dashboard → Environment tab
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Click "Save Changes"
- Trigger a new run

### Issue: Scraper failing on specific source

**Fix:**
- Check Render logs for specific error
- Source errors are non-fatal (other sources still work)
- Partial results are always saved

### Issue: Events not showing on Vercel site

**Fix:**
1. Verify scraper completed successfully in Render logs
2. Check Vercel Blob storage exists in Vercel dashboard
3. Check Vercel site `/api/health` endpoint
4. Wait 1-2 minutes for cache to update

## Schedule Configuration

Current schedule: **Every 6 hours** (`0 */6 * * *`)

To change the schedule, update `render.yaml` and redeploy:

**Every 4 hours:**
```yaml
schedule: "0 */4 * * *"
```

**Every 12 hours:**
```yaml
schedule: "0 */12 * * *"
```

**Daily at 6am UTC:**
```yaml
schedule: "0 6 * * *"
```

**Twice daily (6am and 6pm UTC):**
```yaml
schedule: "0 6,18 * * *"
```

## Local Development

To test the scraper locally:

```bash
cd scraper-service

# Install dependencies
npm install

# Set environment variable
export BLOB_READ_WRITE_TOKEN="your_token_here"

# Run scraper
npm start
```

## Cost

**Render Free Tier:**
- ✅ Unlimited cron jobs
- ✅ 750 hours/month free compute
- ✅ Perfect for this use case
- ✅ $0/month

**Vercel (unchanged):**
- ✅ Blob storage free tier (generous limits)
- ✅ $0/month for this traffic

**Total: $0/month**

## Architecture Benefits

✅ **No Timeout Issues** - Scraper can run as long as needed
✅ **Better Performance** - Puppeteer runs on traditional server
✅ **Cleaner Code** - Separation of concerns
✅ **Easier Debugging** - Full logs, can SSH if needed
✅ **Scalable** - Can add more sources without worry
✅ **Reliable** - Native cron scheduling

## Support

If you encounter issues:
1. Check Render logs for specific errors
2. Verify environment variables are set
3. Test locally with `npm start`
4. Check Vercel Blob storage connectivity

---

**Ready to deploy?** Follow the steps in "Deployment to Render" above!
