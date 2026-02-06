# Quick Start Guide - Deploy to Vercel

Everything is ready! Follow these steps to get your Birmingham Events site online in 5 minutes.

## Prerequisites

- GitHub account (free)
- Vercel account (free) - Sign up at [vercel.com](https://vercel.com)

## Step-by-Step Deployment

### Step 1: Push to GitHub

```bash
# Navigate to project directory
cd "C:/Users/ashton.rosen/Documents/Folders to Save/ClaudeCode/Projects/Bham Event Scraper/birmingham-events"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Add Birmingham Events Scraper with Moon River design"

# Create a new repository on GitHub (github.com/new)
# Then link it:
git remote add origin https://github.com/YOUR_USERNAME/birmingham-events.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Vercel

**Option A: Via Website (Easiest)**

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" (use your GitHub account)
3. Click "Import Project"
4. Select your `birmingham-events` repository
5. Click "Deploy"

That's it! Vercel will automatically:
- Detect it's a Node.js project
- Install dependencies
- Deploy to a live URL
- Set up HTTPS

**Option B: Via CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Step 3: Trigger Initial Scrape

Once deployed, visit:
```
https://your-app-name.vercel.app/api/scrape
```

This will populate the events database. Wait 30-60 seconds, then go back to the home page.

Your site is live at: `https://your-app-name.vercel.app`

## What You Get

- **Live URL**: `https://birmingham-events.vercel.app` (or custom domain)
- **Automatic HTTPS**: Secure by default
- **Global CDN**: Fast loading worldwide
- **Auto-deployments**: Every push to `main` updates the site
- **Free hosting**: No credit card required

## Scheduled Scraping

The app includes automatic daily scraping at 6 AM via node-cron. However, Vercel serverless functions don't support persistent cron jobs.

**Options:**

1. **Manual trigger**: Visit `/api/scrape` to refresh events
2. **External cron**: Use [cron-job.org](https://cron-job.org) to call your `/api/scrape` endpoint daily
3. **GitHub Actions**: Automated daily scraping (see DEPLOYMENT.md)
4. **Upgrade to Railway**: $5/month for persistent background jobs

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your domain (e.g., `birmingham-events.com`)
4. Update DNS records as instructed
5. HTTPS automatically configured

## Troubleshooting

### Deployment Failed

Check:
- All files committed to GitHub
- Node version in `package.json` is 18 or higher
- No syntax errors in code

### Site is slow to load first time

This is normal - Vercel serverless functions have a "cold start" on first request. Subsequent requests are fast.

### Events not showing

Visit `/api/scrape` to populate the database with events.

## Next Steps

1. **Test the site**: Visit your Vercel URL
2. **Trigger scrape**: Go to `/api/scrape`
3. **Share with friends**: Your Birmingham events site is live!
4. **Set up daily scraping**: Use cron-job.org or GitHub Actions

## Support

- Check logs in Vercel dashboard
- Review DEPLOYMENT.md for detailed guides
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)

---

**Estimated time to deploy: 5-10 minutes**

**Cost: FREE** (Vercel free tier is very generous)
