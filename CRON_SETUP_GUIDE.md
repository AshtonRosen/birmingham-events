# Cron Job Setup Guide for Birmingham Events Scraper

This guide will help you set up automated event scraping using cron-job.org (free, no timeout limits).

## Overview

**Problem:** Vercel serverless functions have strict timeout limits (10-60 seconds)
**Solution:** Use external cron job service to trigger scraping every 6 hours
**Result:** Unlimited execution time, reliable scraping, automatic updates

---

## Part 1: Set Up Vercel Environment Variables

### 1.1 Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your `birmingham-events` project
3. Click "Settings" in the top navigation

### 1.2 Add BLOB_READ_WRITE_TOKEN

1. Click "Environment Variables" in left sidebar
2. Click "Add New" button
3. Enter:
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** `vercel_blob_rw_VpwRQWMr9hfbkC3J_J2tbsWmTQgdJycQMOG7XZZgNaLtuAk`
   - **Environments:** Check all three boxes (Production, Preview, Development)
4. Click "Save"

### 1.3 Create CRON_SECRET

This secret authenticates your cron job so random people can't trigger scrapes.

1. Generate a secure random string (option 1 or 2):

   **Option 1 - Use this command:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   **Option 2 - Use online generator:**
   Visit https://www.random.org/passwords/?num=1&len=32&format=plain&rnd=new

2. Copy the generated string (example: `a7f8e9c2b4d1f3e5a8b9c0d2e4f6a8b9c0d2e4f6a8b9c0d2e4f6a8b9c0d2e4f6`)

3. Back in Vercel Environment Variables:
   - Click "Add New"
   - **Key:** `CRON_SECRET`
   - **Value:** Paste your generated secret
   - **Environments:** Check all three boxes
   - Click "Save"

### 1.4 Redeploy

1. Go to "Deployments" tab
2. Click the three dots (⋯) on the latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache"
5. Click "Redeploy" button
6. Wait 2-3 minutes for deployment to complete

---

## Part 2: Test the Setup

### 2.1 Test Health Check

Visit: `https://birmingham-events.vercel.app/api/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "2.0.0-blob-storage",
  "features": {
    "blobStorage": true,
    "puppeteer": true,
    "caching": true
  },
  "blobTokenPresent": true,
  "eventsLoaded": false,
  "eventCount": 0
}
```

✅ **Check:** `blobTokenPresent` should be `true`

### 2.2 Test Blob Storage

Visit: `https://birmingham-events.vercel.app/api/test-blob`

**Expected Response:**
```json
{
  "success": true,
  "message": "Blob storage is working correctly",
  "blobUrl": "https://...",
  "tokenPresent": true
}
```

✅ **If this fails,** your BLOB_READ_WRITE_TOKEN isn't set correctly. Go back to Part 1.2.

### 2.3 Test Scrape Endpoint (Manual Test)

Use PowerShell or Command Prompt:

```powershell
# Replace YOUR_CRON_SECRET with your actual secret from step 1.3
curl -X POST https://birmingham-events.vercel.app/api/scrape `
  -H "Authorization: Bearer YOUR_CRON_SECRET" `
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "message": "Scraping started",
  "status": "in_progress"
}
```

**Check Logs:** Go to Vercel Dashboard → Your Project → Logs tab and watch for:
- "Cron scrape triggered"
- Individual scraper messages
- "Scrape complete: X events saved to Blob storage"

---

## Part 3: Set Up Cron-Job.org

### 3.1 Create Account

1. Visit https://cron-job.org/en/signup
2. Sign up with your email
3. Verify your email address
4. Log in

### 3.2 Create Cron Job

1. Click "Create cronjob" button

2. **Basic Settings:**
   - **Title:** `Birmingham Events Scraper`
   - **Address (URL):** `https://birmingham-events.vercel.app/api/scrape`

3. **Schedule Settings:**
   - **Execution:** Select "Every 6 hours"
   - Or custom: `0 */6 * * *` (runs at 12am, 6am, 12pm, 6pm)

4. **Request Settings:**
   - **Request Method:** `POST`
   - Click "Headers" section
   - Click "Add header"
   - **Name:** `Authorization`
   - **Value:** `Bearer YOUR_CRON_SECRET` (replace with your actual secret)
   - **Name:** `Content-Type`
   - **Value:** `application/json`

5. **Notification Settings (Optional):**
   - Enable "Notify me about execution failures"
   - Enter your email

6. Click "Create cronjob"

### 3.3 Test the Cron Job

1. In your cron job list, find "Birmingham Events Scraper"
2. Click the "Run" icon (▶️) on the right side
3. Wait 10 seconds
4. Check "Last execution" column - should show "200 OK"

### 3.4 Verify Events Were Saved

1. Wait 1-2 minutes after cron job runs
2. Visit: `https://birmingham-events.vercel.app/api/health`
3. Check:
   - `"eventsLoaded": true`
   - `"eventCount": 150` (or similar number)

4. Visit your site: `https://birmingham-events.vercel.app/`
5. You should see events displayed with Moon River design!

---

## Part 4: Monitoring & Maintenance

### 4.1 Check Cron Job Status

- Log into cron-job.org anytime
- View execution history
- See success/failure rate
- Get email notifications on failures

### 4.2 Check Vercel Logs

1. Vercel Dashboard → Your Project → Logs
2. Filter by "api/scrape"
3. Look for:
   - ✅ "Scrape complete: X events saved"
   - ❌ Any error messages

### 4.3 Recommended Schedule

**Option 1 (Recommended):** Every 6 hours
- `0 */6 * * *`
- Runs: 12am, 6am, 12pm, 6pm
- 4 scrapes per day
- Good balance of freshness vs API usage

**Option 2 (More frequent):** Every 4 hours
- `0 */4 * * *`
- 6 scrapes per day
- More API calls but fresher data

**Option 3 (Less frequent):** Every 12 hours
- `0 */12 * * *`
- 2 scrapes per day (12am, 12pm)
- Minimal API usage

---

## Troubleshooting

### Issue: "Unauthorized" error

**Cause:** CRON_SECRET mismatch

**Fix:**
1. Verify CRON_SECRET in Vercel Dashboard matches your cron job header
2. Make sure header format is: `Bearer YOUR_SECRET` (with space after "Bearer")
3. Redeploy after changing environment variables

### Issue: "BLOB_READ_WRITE_TOKEN not found"

**Cause:** Token not set in Vercel Dashboard

**Fix:**
1. Go back to Part 1.2
2. Make sure token is set for all three environments
3. Redeploy

### Issue: Cron job shows "500 Internal Server Error"

**Cause:** Scraping error or timeout

**Fix:**
1. Check Vercel logs for specific error
2. Scraper might have encountered an issue
3. Partial results should still be saved
4. Next cron run will retry

### Issue: Events not updating

**Cause:** Cron job not running or failing

**Fix:**
1. Check cron-job.org execution history
2. Look for red X's (failures)
3. Manually trigger a test run
4. Check Vercel logs for errors

---

## Summary

Once set up, your system will:

✅ **Automatically scrape** 19 event sources every 6 hours
✅ **Save to Blob storage** - persistent across all users
✅ **No timeout issues** - cron-job.org has no limits
✅ **Monitor execution** - email notifications on failures
✅ **Serve fast** - events cached for 1 hour in-memory

**Total Setup Time:** 15-20 minutes
**Monthly Cost:** $0 (100% free)
**Maintenance:** Check logs occasionally for issues

---

## Quick Reference

**Environment Variables Needed:**
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob storage token
- `CRON_SECRET` - Random secure string for authentication

**Cron Job Settings:**
- **URL:** `https://birmingham-events.vercel.app/api/scrape`
- **Method:** POST
- **Header:** `Authorization: Bearer YOUR_CRON_SECRET`
- **Schedule:** `0 */6 * * *` (every 6 hours)

**Test Endpoints:**
- Health: `/api/health`
- Blob Test: `/api/test-blob`
- Scrape: `/api/scrape` (POST with auth header)

**Useful Links:**
- Vercel Dashboard: https://vercel.com/dashboard
- Cron-Job.org: https://cron-job.org
- Your Site: https://birmingham-events.vercel.app
