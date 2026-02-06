# Deployment Guide

This guide covers deploying the Birmingham Events Scraper to various hosting platforms.

## Recommended: Vercel

Vercel offers the best combination of speed, ease of deployment, and free tier for this project.

### Why Vercel?

- **Fast**: Global CDN with edge network (< 50ms latency)
- **Easy**: Zero configuration, automatic deployments
- **Free**: Generous free tier for hobby projects
- **Puppeteer Support**: Works with headless browsers
- **HTTPS**: Automatic SSL certificates
- **Git Integration**: Deploy on every push

### Quick Deploy with Vercel CLI

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Navigate to project:**
```bash
cd birmingham-events
```

4. **Deploy:**
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **birmingham-events**
- In which directory is your code located? **./
**
- Want to override settings? **N**

5. **Deploy to production:**
```bash
vercel --prod
```

Your site is now live! Vercel provides a URL like: `https://birmingham-events.vercel.app`

### Deploy with GitHub Integration (Recommended)

1. **Push code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/birmingham-events.git
git push -u origin main
```

2. **Connect to Vercel:**
- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select GitHub repository
- Click "Import"

3. **Automatic deployments:**
- Every push to `main` = production deployment
- Pull requests get preview deployments
- Zero configuration needed

### Vercel Configuration

The project includes `vercel.json` with optimal settings:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "api/server.js"
    }
  ]
}
```

### Puppeteer on Vercel

Vercel supports Puppeteer with special configuration. All scrapers should use:

```javascript
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ]
});
```

### Limitations on Vercel

- **Execution time**: Serverless functions timeout after 10s (free) / 60s (pro)
- **Memory**: 1024 MB max
- **Cold starts**: First request may be slower

**Solution for long-running scrapes:**
- Use Vercel Pro ($20/month) for 60s timeouts
- Or split scraping into multiple smaller functions
- Or use Railway for background scraping

## Alternative: Railway

Railway is great for persistent background jobs and scheduled scraping.

### Deploy to Railway

1. **Create Railway account:** [railway.app](https://railway.app)

2. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

3. **Login:**
```bash
railway login
```

4. **Initialize project:**
```bash
cd birmingham-events
railway init
```

5. **Deploy:**
```bash
railway up
```

### Railway Advantages

- Persistent processes (background jobs work)
- No execution time limits
- Built-in PostgreSQL/Redis if needed
- $5/month for 500 hours

### Railway Configuration

Add `Procfile`:
```
web: node api/server.js
```

Set environment variables in Railway dashboard:
```
PORT=3000
NODE_ENV=production
```

## Alternative: Render

Render offers a solid free tier with persistent processes.

### Deploy to Render

1. **Create Render account:** [render.com](https://render.com)

2. **Connect GitHub repository**

3. **Create new Web Service:**
- Name: birmingham-events
- Environment: Node
- Build Command: `npm install`
- Start Command: `node api/server.js`

4. **Deploy**

### Render Free Tier

- Free tier available
- Spins down after inactivity (slower cold starts)
- Great for testing

## Alternative: DigitalOcean App Platform

Good balance of control and simplicity.

### Deploy to DigitalOcean

1. **Create DigitalOcean account**

2. **Create App:**
- Go to Apps section
- Connect GitHub repository
- Select branch
- Detected as Node.js automatically

3. **Configure:**
- Name: birmingham-events
- Region: Select closest to users
- Plan: Basic ($5/month)

4. **Deploy**

### DigitalOcean Advantages

- Full control over environment
- Predictable pricing ($5/month)
- No cold starts
- Good for production apps

## Running Initial Scrape

After deployment, trigger an initial scrape to populate data:

### Option 1: Via API
Visit: `https://your-app-url.com/api/scrape`

### Option 2: Via Command (Railway/Render)
```bash
# Railway
railway run npm run scrape

# Render
render run npm run scrape
```

### Option 3: SSH (DigitalOcean/VPS)
```bash
ssh your-server
cd birmingham-events
npm run scrape
```

## Scheduled Scraping

The app includes automatic daily scraping at 6 AM via `node-cron`.

### Vercel Limitation
Vercel serverless functions don't support cron jobs. Options:

1. **Use Vercel Cron (Pro plan)**
2. **External cron service** (cron-job.org)
3. **GitHub Actions** for scheduled scraping
4. **Use Railway/Render** for built-in cron support

### GitHub Actions Example

Create `.github/workflows/scrape.yml`:

```yaml
name: Daily Event Scrape

on:
  schedule:
    - cron: '0 6 * * *' # 6 AM daily

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run scrape
      - name: Trigger Vercel deployment
        run: curl -X POST https://your-app.vercel.app/api/scrape
```

## Custom Domain

### Vercel
1. Go to project settings
2. Add domain
3. Update DNS records (Vercel provides instructions)
4. HTTPS automatic

### Railway/Render
Similar process - add custom domain in dashboard

### DNS Configuration

Point your domain to:
- **Vercel**: CNAME to `cname.vercel-dns.com`
- **Railway**: CNAME provided in dashboard
- **Render**: CNAME provided in dashboard

## Monitoring

### Vercel Analytics

Enable in project settings:
- Page views
- User analytics
- Performance metrics

### Railway/Render Logs

View logs in dashboard:
```bash
# Railway
railway logs

# Render
render logs
```

### Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

## Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| Vercel | 100GB bandwidth/month | $20/month Pro | Fast static sites, serverless |
| Railway | 500 free hours | $5/month | Background jobs, persistent |
| Render | 750 free hours/month | $7/month | Small apps, testing |
| DigitalOcean | - | $5/month | Production, control |

## Troubleshooting

### Puppeteer not working

Add these args to `puppeteer.launch()`:
```javascript
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu'
]
```

### Deployment fails

Check:
- Node version (use 18+)
- All dependencies in `package.json`
- Environment variables set correctly

### Slow cold starts (Vercel)

- Use Vercel Pro for better performance
- Or switch to Railway/Render for persistent processes

### Memory issues

Scraping 19 sources may exceed memory limits:
- Increase memory limit (paid plans)
- Split scraping into batches
- Use Railway for more memory

## Security

### API Keys

Don't commit API keys to Git:
- Use environment variables
- Add `.env` to `.gitignore`
- Set in hosting platform dashboard

### Rate Limiting

Respect source websites:
- Built-in 1s delay between scrapers
- Increase if needed
- Use official APIs when available

## Recommended Setup

For best results:

1. **Development**: Local (npm start)
2. **Staging**: Vercel (preview deployments)
3. **Production**: Vercel (fast) or Railway (persistent jobs)
4. **Scraping**: Railway cron job or GitHub Actions
5. **API**: Vercel serverless functions

This hybrid approach gives you:
- Fast global CDN for UI (Vercel)
- Reliable scheduled scraping (Railway/Actions)
- Best of both worlds

## Questions?

- Check logs in hosting platform dashboard
- Review Vercel documentation: vercel.com/docs
- Railway docs: docs.railway.app
- Open issue on GitHub
