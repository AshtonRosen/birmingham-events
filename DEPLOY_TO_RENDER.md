# 🚀 Deploy Birmingham Events Scraper to Render

**Time Required:** 10-15 minutes
**Cost:** $0 (Free tier)

---

## ✅ What I've Already Done

✅ Created standalone scraper service in `scraper-service/`
✅ Configured for Render cron job deployment
✅ Pushed everything to GitHub
✅ Included complete deployment configuration
✅ Added comprehensive README with troubleshooting

**The service is ready to deploy!** Just follow the steps below.

---

## 📋 Your Deployment Steps

### Step 1: Sign Up for Render (2 minutes)

1. Go to: https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your repositories

### Step 2: Create Cron Job (5 minutes)

1. **In Render Dashboard, click "New +"**
   - Select **"Cron Job"**

2. **Connect Your Repository:**
   - Search for: `birmingham-events`
   - Click "Connect"

3. **Configure the Service:**
   Fill in these exact values:

   | Field | Value |
   |-------|-------|
   | **Name** | `birmingham-events-scraper` |
   | **Runtime** | Node |
   | **Root Directory** | `scraper-service` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Schedule** | `0 */6 * * *` |
   | **Plan** | Free |

4. **Click "Advanced"** and verify:
   - Instance Type: Free
   - Auto-Deploy: Yes

### Step 3: Add Environment Variable (1 minute)

1. **Scroll to "Environment Variables"** section (before creating job)

2. **Click "Add Environment Variable"**
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** `vercel_blob_rw_VpwRQWMr9hfbkC3J_J2tbsWmTQgdJycQMOG7XZZgNaLtuAk`

3. **Click "Add"** to confirm

### Step 4: Create & Deploy (2 minutes)

1. **Click "Create Cron Job"** button at bottom

2. **Wait for deployment:**
   - You'll see build logs in real-time
   - Wait for "Build successful"
   - Wait for "Deploy live"
   - Total time: ~2-3 minutes

3. **First deployment will also run the scraper immediately**
   - Watch the logs!

---

## 🧪 Test the Deployment

### Watch the Logs

In the Render dashboard, you should see:

```
=================================================
🚀 Birmingham Events Scraper Service
=================================================
Started at: [timestamp]
Environment: production
Blob Token Present: true
=================================================

📥 Starting scrape of all sources...

Scraping Cahaba Brewing events from iCal feeds...
Found 15 Cahaba Brewing events

Scraping Monday Night Brewing events...
Found 8 Monday Night Brewing events

[... more sources ...]

📤 Scraping complete! Summary:
   Total events scraped: 156
   Sources: 19
   Date range: 2026-02-06 to 2026-03-15

Saving events to Vercel Blob storage...
✅ Events saved to Blob storage: https://...
   Total events: 156
   Date range: 2026-02-06 to 2026-03-15

=================================================
✅ SCRAPE SUCCESSFUL
=================================================
```

### Verify Events on Your Site

**1. Check Health:**
```
https://birmingham-events.vercel.app/api/health
```

Should show:
```json
{
  "eventsLoaded": true,
  "eventCount": 150+
}
```

**2. Visit Your Site:**
```
https://birmingham-events.vercel.app/
```

🎉 **You should see events with Moon River design!**

---

## ⏰ Automatic Schedule

Your scraper will now run automatically:

- **12:00 AM UTC** (7:00 PM EST / 6:00 PM CST)
- **6:00 AM UTC** (1:00 AM EST / 12:00 AM CST)
- **12:00 PM UTC** (7:00 AM EST / 6:00 AM CST)
- **6:00 PM UTC** (1:00 PM EST / 12:00 PM CST)

**That's 4 scrapes per day** keeping your events fresh!

---

## 🔄 Manual Trigger

To run the scraper manually anytime:

1. Go to Render Dashboard
2. Find "birmingham-events-scraper"
3. Click **"Trigger Run"** button
4. Watch logs in real-time

---

## 📊 Monitoring

### View Logs Anytime

1. Render Dashboard → `birmingham-events-scraper`
2. Click "Logs" tab
3. See real-time or historical logs

### Check Execution History

- See "Last Run" timestamp
- View success/failure status
- Check execution duration

### Email Notifications (Optional)

1. Go to your cron job settings
2. Click "Notifications"
3. Enable "Notify on Failure"
4. Enter your email

---

## 🆘 Troubleshooting

### Issue: Build fails with "Cannot find module"

**Fix:**
- Check that `Root Directory` is set to `scraper-service`
- Rebuild the service

### Issue: "BLOB_READ_WRITE_TOKEN not set"

**Fix:**
- Go to Environment tab
- Verify token is set correctly
- Click "Save Changes"
- Trigger manual run

### Issue: Some scrapers failing

**Check logs for specific errors:**
- Individual scraper failures are OK (non-fatal)
- Other sources will still work
- Partial results are always saved

### Issue: Events not showing on Vercel

**Checklist:**
1. ✅ Render logs show "✅ SCRAPE SUCCESSFUL"
2. ✅ Render logs show "Events saved to Blob storage"
3. ✅ Wait 1-2 minutes for Vercel cache
4. ✅ Check `/api/health` shows `eventsLoaded: true`

---

## 🎯 What Happens Now

**Architecture:**
```
Render Scraper → Vercel Blob Storage → Vercel Frontend
(runs every 6h)   (shared data store)    (serves users)
```

**Benefits:**
- ✅ No timeout issues (scraper can run as long as needed)
- ✅ Puppeteer works perfectly on Render
- ✅ Automatic scheduling (no cron-job.org needed)
- ✅ Free tier for both services ($0/month)
- ✅ Clean separation of concerns
- ✅ Easy monitoring and debugging

---

## 📝 Next Steps (Optional)

### Change Schedule

Edit `scraper-service/render.yaml`:

```yaml
# Every 4 hours
schedule: "0 */4 * * *"

# Daily at 6am UTC
schedule: "0 6 * * *"

# Twice daily (6am and 6pm)
schedule: "0 6,18 * * *"
```

Commit and push - Render will auto-deploy!

### Add More Scrapers

Add new scraper files to `scraper-service/scraper/sources/`
Update `scraper-service/scraper/index.js` to include them
Push to GitHub - Render will auto-deploy!

---

## 🎉 You're Done!

Once you've completed Step 4, your system is:

✅ **Automatically scraping** 19 sources every 6 hours
✅ **Saving to Blob** storage (persistent)
✅ **Serving events** on your beautiful Moon River site
✅ **100% free** (Render + Vercel free tiers)
✅ **Zero maintenance** (just check logs occasionally)

**Total setup time:** 10-15 minutes
**Monthly cost:** $0

---

**Ready? Go to Step 1:** https://render.com and create your account!

**Questions?** Check the detailed README in `scraper-service/README.md`
