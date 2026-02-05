# Deployment Checklist

## ✅ Pre-Launch Checklist

### 1. Get More Events (5 minutes)

- [ ] Sign up at https://developer.ticketmaster.com/
- [ ] Create app and get API key
- [ ] Edit `scraper/sources/ticketmaster.js` line 11
- [ ] Replace `YOUR_API_KEY_HERE` with actual key
- [ ] Test: `npm run scrape` (should get 50+ events)
- [ ] Verify: Check `data/events.json` has content

### 2. Test Locally (2 minutes)

- [ ] Run: `npm start`
- [ ] Open: http://localhost:3000
- [ ] Verify events display correctly
- [ ] Test search functionality
- [ ] Test category filter
- [ ] Check API: http://localhost:3000/api/events

### 3. Choose Hosting Platform

**Option A: Heroku (Recommended)**
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

heroku login
heroku create birmingham-events
git init
git add .
git commit -m "Initial deployment"
heroku git:remote -a birmingham-events
git push heroku main
heroku run npm run scrape
heroku open
```

**Option B: Railway**
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Connect birmingham-events repo
4. Set environment variable: `TICKETMASTER_API_KEY`
5. Deploy automatically

**Option C: Render**
1. Go to https://render.com
2. "New Web Service"
3. Connect GitHub repo
4. Build: `npm install`
5. Start: `npm start`
6. Deploy

### 4. Configure Environment Variables

On your hosting platform, set:

```
TICKETMASTER_API_KEY=your_key_here
PORT=3000
NODE_ENV=production
```

### 5. Set Up Custom Domain (Optional)

- [ ] Register domain (e.g., birminghamevents.com)
- [ ] Add DNS records pointing to hosting platform
- [ ] Enable SSL/HTTPS (usually automatic on modern hosts)
- [ ] Update any hardcoded URLs if needed

### 6. Initial Data Population

```bash
# On hosting platform (e.g., Heroku)
heroku run npm run scrape

# Or Railway/Render
# Use their console/shell to run: npm run scrape
```

### 7. Monitoring Setup

- [ ] Sign up for free monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Add your deployed URL for uptime checks
- [ ] Set up email/SMS alerts for downtime
- [ ] Monitor API response times

### 8. Analytics (Optional)

Add to `public/index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 9. Social Media Setup

Create accounts:
- [ ] Twitter: @BirminghamEvents
- [ ] Facebook page: Birmingham Events
- [ ] Instagram: @birminghamevents

Share link when launching!

### 10. Legal Pages (Recommended)

Create these pages (can be simple text):

**Privacy Policy** (`public/privacy.html`):
```
We don't collect personal data.
Events are aggregated from public sources.
We use cookies for analytics only.
```

**Terms of Service** (`public/terms.html`):
```
Event information provided as-is.
We link to official sources.
Not responsible for event changes/cancellations.
```

**About** (`public/about.html`):
```
Birmingham Events aggregates local happenings.
Data from Ticketmaster, BJCC, and other sources.
Built by [Your Name] for the Birmingham community.
Contact: [Your Email]
```

Add links in footer of `public/index.html`.

## 🚀 Launch Day

### Pre-Launch (Morning)

- [ ] Run fresh scrape: `npm run scrape`
- [ ] Verify all pages load
- [ ] Test on mobile device
- [ ] Check all API endpoints
- [ ] Ensure HTTPS works

### Launch (Afternoon)

- [ ] Share on personal social media
- [ ] Post in Birmingham subreddit: r/Birmingham
- [ ] Share in local Facebook groups
- [ ] Email to local news (AL.com, Birmingham Business Journal)
- [ ] Submit to Birmingham business directories

### Post-Launch (Evening)

- [ ] Monitor for errors (check hosting logs)
- [ ] Respond to feedback
- [ ] Fix any bugs reported
- [ ] Thank early users

## 📊 Week 1 Tasks

- [ ] Monitor analytics (page views, popular events)
- [ ] Gather user feedback
- [ ] Fix any bugs discovered
- [ ] Add more event sources if needed
- [ ] Adjust scraping frequency if needed

## 🎯 Month 1 Goals

- [ ] 1,000+ page views
- [ ] 100+ unique visitors
- [ ] 50+ events aggregated
- [ ] 3+ new event sources added
- [ ] Featured in local media (stretch goal)

## 🔧 Maintenance Tasks

### Daily (Automated)
- ✅ Scraper runs at 6 AM
- ✅ Data automatically refreshes
- ✅ API serves updated events

### Weekly (Manual - 5 minutes)
- [ ] Check error logs
- [ ] Verify scraper is running
- [ ] Review user feedback
- [ ] Update event sources if needed

### Monthly (Manual - 30 minutes)
- [ ] Review analytics
- [ ] Update dependencies: `npm update`
- [ ] Add new event sources
- [ ] Improve design based on feedback

## 💰 Cost Tracking

Current costs:
- Hosting: $0-7/month (free tier or Heroku Hobby)
- Domain: $12/year (optional)
- Ticketmaster API: $0 (free tier)
- Total: **$0-19/month**

## 🎉 Success Indicators

You'll know it's successful when:
- [ ] People are using it daily
- [ ] Local venues ask to be included
- [ ] Media coverage mentions it
- [ ] Other cities ask for their own version
- [ ] Community says "thank you"

## 🆘 Troubleshooting

### Site is down
1. Check hosting platform status
2. Check error logs
3. Restart dyno/service
4. Check if domain DNS is correct

### No events showing
1. SSH into server: `heroku run bash`
2. Run: `npm run scrape`
3. Check: `cat data/events.json`
4. Review scraper error logs

### Scraper failing
1. Check if source sites changed HTML
2. Update selectors in scraper files
3. Test locally first
4. Deploy updates

## 📞 Support

If you need help:
1. Check README.md and PROJECT_SUMMARY.md
2. Review error logs on hosting platform
3. Test locally to isolate issues
4. Update scrapers if sites changed

## ✨ You're Ready!

This checklist ensures a smooth launch. The tool is **already production-ready** - you just need to:

1. ✅ Add Ticketmaster API key
2. ✅ Deploy to hosting
3. ✅ Run initial scrape
4. ✅ Share with Birmingham community

Good luck with the launch! 🎉
