# Code Examples & Use Cases

Practical examples for common scenarios using the Birmingham Events API.

---

## Table of Contents

1. [JavaScript Examples](#javascript-examples)
2. [Python Examples](#python-examples)
3. [React Examples](#react-examples)
4. [Custom Scraper Examples](#custom-scraper-examples)
5. [Integration Examples](#integration-examples)

---

## JavaScript Examples

### Basic Event Display

```javascript
// Fetch and display upcoming events
async function displayUpcomingEvents() {
  const response = await fetch('http://localhost:3000/api/events/upcoming');
  const data = await response.json();

  Object.entries(data.events).forEach(([date, events]) => {
    console.log(`\n${date} (${events.length} events):`);
    events.forEach(event => {
      console.log(`  - ${event.title} at ${event.location.venue}`);
    });
  });
}

displayUpcomingEvents();
```

**Output:**
```
2026-02-05 (3 events):
  - Kami-Con at BJCC
  - Jazz Night at WorkPlay
  - Food Truck Festival at Railroad Park

2026-02-06 (2 events):
  - Alabama Symphony Orchestra at Legacy Arena
  - Comedy Show at Iron City
```

---

### Event Filter by Category

```javascript
async function getEventsByCategory(category) {
  const response = await fetch('http://localhost:3000/api/events');
  const data = await response.json();

  const filtered = data.allEvents.filter(event =>
    event.category.toLowerCase() === category.toLowerCase()
  );

  return filtered;
}

// Usage
getEventsByCategory('Music').then(events => {
  console.log(`Found ${events.length} music events`);
  events.forEach(e => console.log(`  - ${e.title} on ${e.date}`));
});
```

---

### Free Events Finder

```javascript
async function findFreeEvents() {
  const response = await fetch('http://localhost:3000/api/events');
  const data = await response.json();

  const freeEvents = data.allEvents.filter(event =>
    event.price.isFree || event.price.min === 0
  );

  return freeEvents;
}

// Display free events
findFreeEvents().then(events => {
  console.log(`\n🎉 ${events.length} FREE EVENTS:\n`);
  events.forEach(event => {
    console.log(`${event.title}`);
    console.log(`  📅 ${event.date} ${event.time || ''}`);
    console.log(`  📍 ${event.location.venue}`);
    console.log(`  🔗 ${event.url}\n`);
  });
});
```

---

### Weekend Events Finder

```javascript
function isWeekend(dateString) {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

async function getWeekendEvents() {
  const response = await fetch('http://localhost:3000/api/events/upcoming');
  const data = await response.json();

  const weekendEvents = {};

  Object.entries(data.events).forEach(([date, events]) => {
    if (isWeekend(date)) {
      weekendEvents[date] = events;
    }
  });

  return weekendEvents;
}

// Usage
getWeekendEvents().then(events => {
  console.log('🎊 Weekend Events:');
  Object.entries(events).forEach(([date, eventList]) => {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`\n${dayName}, ${date}: ${eventList.length} events`);
  });
});
```

---

### Price Range Filter

```javascript
async function getEventsByPriceRange(minPrice, maxPrice) {
  const response = await fetch('http://localhost:3000/api/events');
  const data = await response.json();

  const filtered = data.allEvents.filter(event => {
    if (event.price.min === null) return false;
    return event.price.min >= minPrice && event.price.min <= maxPrice;
  });

  return filtered;
}

// Find affordable events ($0-$30)
getEventsByPriceRange(0, 30).then(events => {
  console.log(`Found ${events.length} events under $30`);
  events.forEach(e => {
    const price = e.price.isFree ? 'FREE' : `$${e.price.min}-$${e.price.max}`;
    console.log(`  ${e.title}: ${price}`);
  });
});
```

---

### Create Calendar Export (iCal)

```javascript
function generateICalEvent(event) {
  const startDate = event.date.replace(/-/g, '');
  const startTime = event.time ? event.time.replace(':', '') + '00' : '120000';

  return `BEGIN:VEVENT
SUMMARY:${event.title}
LOCATION:${event.location.venue}, ${event.location.city}, ${event.location.state}
DESCRIPTION:${event.description}\\n\\nTickets: ${event.url}
DTSTART:${startDate}T${startTime}
URL:${event.url}
END:VEVENT`;
}

async function exportToCalendar(eventIds) {
  const response = await fetch('http://localhost:3000/api/events');
  const data = await response.json();

  const selectedEvents = data.allEvents.filter(e => eventIds.includes(e.id));

  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Birmingham Events//EN
CALSCALE:GREGORIAN
${selectedEvents.map(generateICalEvent).join('\n')}
END:VCALENDAR`;

  return ical;
}

// Usage
exportToCalendar(['bjcc-kamicon-20260205']).then(ical => {
  // Save to file or download
  console.log(ical);
});
```

---

### Real-time Event Updates (Polling)

```javascript
class EventMonitor {
  constructor(updateInterval = 60000) { // 1 minute
    this.updateInterval = updateInterval;
    this.lastUpdate = null;
    this.callbacks = [];
  }

  async checkForUpdates() {
    const meta = await fetch('http://localhost:3000/api/metadata').then(r => r.json());

    if (!this.lastUpdate || meta.lastUpdated !== this.lastUpdate) {
      console.log('New events detected!');
      this.lastUpdate = meta.lastUpdate;

      // Notify all callbacks
      this.callbacks.forEach(callback => callback(meta));
    }
  }

  start() {
    this.checkForUpdates(); // Check immediately
    this.interval = setInterval(() => this.checkForUpdates(), this.updateInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  onUpdate(callback) {
    this.callbacks.push(callback);
  }
}

// Usage
const monitor = new EventMonitor();
monitor.onUpdate(meta => {
  console.log(`Data refreshed! ${meta.totalEvents} events available`);
  // Reload events in UI
});
monitor.start();
```

---

## Python Examples

### Fetch and Display Events

```python
import requests
from datetime import datetime

def get_upcoming_events():
    response = requests.get('http://localhost:3000/api/events/upcoming')
    data = response.json()
    return data['events']

def display_events():
    events = get_upcoming_events()

    for date, event_list in events.items():
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        day_name = date_obj.strftime('%A, %B %d, %Y')

        print(f"\n{day_name} ({len(event_list)} events):")
        for event in event_list:
            venue = event['location']['venue']
            print(f"  - {event['title']} at {venue}")

if __name__ == '__main__':
    display_events()
```

---

### Search and Filter

```python
import requests

def search_events(query):
    response = requests.get(
        f'http://localhost:3000/api/events/search',
        params={'q': query}
    )
    return response.json()

def filter_by_venue(venue_name):
    response = requests.get('http://localhost:3000/api/events')
    data = response.json()

    filtered = [
        event for event in data['allEvents']
        if venue_name.lower() in event['location']['venue'].lower()
    ]

    return filtered

# Usage
concerts = search_events('concert')
print(f"Found {concerts['count']} concerts")

bjcc_events = filter_by_venue('BJCC')
print(f"Found {len(bjcc_events)} events at BJCC")
```

---

### Export to CSV

```python
import requests
import csv

def export_events_to_csv(filename='events.csv'):
    response = requests.get('http://localhost:3000/api/events')
    data = response.json()

    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['title', 'date', 'time', 'venue', 'category', 'price_min', 'price_max', 'url']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for event in data['allEvents']:
            writer.writerow({
                'title': event['title'],
                'date': event['date'],
                'time': event.get('time', ''),
                'venue': event['location']['venue'],
                'category': event['category'],
                'price_min': event['price'].get('min', ''),
                'price_max': event['price'].get('max', ''),
                'url': event['url']
            })

    print(f"Exported {len(data['allEvents'])} events to {filename}")

# Usage
export_events_to_csv()
```

---

### Send Email Digest

```python
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

def get_this_week_events():
    response = requests.get('http://localhost:3000/api/events/upcoming')
    data = response.json()

    # Get events for next 7 days
    today = datetime.now()
    week_end = today + timedelta(days=7)

    week_events = []
    for date_str, events in data['events'].items():
        event_date = datetime.strptime(date_str, '%Y-%m-%d')
        if today <= event_date <= week_end:
            week_events.extend(events)

    return week_events

def send_weekly_digest(to_email):
    events = get_this_week_events()

    html = "<h1>This Week in Birmingham</h1>"
    html += f"<p>{len(events)} events happening this week:</p><ul>"

    for event in events[:10]:  # Top 10 events
        html += f"<li><strong>{event['title']}</strong><br>"
        html += f"{event['date']} at {event['location']['venue']}<br>"
        html += f"<a href='{event['url']}'>Get Tickets</a></li>"

    html += "</ul>"

    msg = MIMEMultipart('alternative')
    msg['Subject'] = "This Week in Birmingham Events"
    msg['From'] = "events@birminghamevents.com"
    msg['To'] = to_email

    msg.attach(MIMEText(html, 'html'))

    # Send email (configure SMTP server)
    # smtp = smtplib.SMTP('smtp.gmail.com', 587)
    # smtp.sendmail(msg['From'], msg['To'], msg.as_string())

    print(f"Email digest sent to {to_email}")

# Usage
send_weekly_digest('user@example.com')
```

---

## React Examples

### Simple Event List Component

```jsx
import React, { useState, useEffect } from 'react';

function EventList() {
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/events/upcoming')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading events...</div>;

  return (
    <div className="event-list">
      {Object.entries(events).map(([date, eventList]) => (
        <div key={date} className="date-section">
          <h2>{new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}</h2>
          <div className="events">
            {eventList.map(event => (
              <div key={event.id} className="event-card">
                <h3>{event.title}</h3>
                <p>{event.location.venue}</p>
                <p>{event.time}</p>
                <a href={event.url} target="_blank" rel="noopener noreferrer">
                  Get Tickets
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventList;
```

---

### Search Component with Debounce

```jsx
import React, { useState, useEffect } from 'react';

function EventSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`http://localhost:3000/api/events/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.events);
          setLoading(false);
        });
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search events..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {loading && <div>Searching...</div>}

      {results.length > 0 && (
        <div className="search-results">
          <p>Found {results.length} results</p>
          {results.map(event => (
            <div key={event.id} className="result-item">
              <h4>{event.title}</h4>
              <p>{event.date} at {event.location.venue}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventSearch;
```

---

### Custom Hook for Events

```jsx
import { useState, useEffect } from 'react';

function useEvents(endpoint = 'upcoming') {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/api/events/${endpoint}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [endpoint]);

  return { events, loading, error };
}

// Usage in component
function App() {
  const { events, loading, error } = useEvents('upcoming');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Upcoming Events</h1>
      {/* Render events */}
    </div>
  );
}
```

---

## Custom Scraper Examples

### Adding Alabama Theatre Scraper

```javascript
// scraper/sources/alabama-theatre.js
const axios = require('axios');
const cheerio = require('cheerio');

class AlabamaTheatreScraper {
  constructor() {
    this.baseUrl = 'https://alabamatheatre.com/events/';
  }

  async scrape() {
    try {
      console.log('Scraping Alabama Theatre events...');

      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const events = [];

      // Look for event items (inspect site to find correct selectors)
      $('.event-item, article[class*="event"]').each((i, elem) => {
        const event = this.parseEvent($, $(elem));
        if (event.name) {
          events.push(event);
        }
      });

      console.log(`Found ${events.length} Alabama Theatre events`);
      return events;
    } catch (error) {
      console.error('Error scraping Alabama Theatre:', error.message);
      return [];
    }
  }

  parseEvent($, element) {
    const title = element.find('h2, h3, .event-title').first().text().trim();
    const url = element.find('a').first().attr('href') || '';
    const fullUrl = url ? (url.startsWith('http') ? url : `https://alabamatheatre.com${url}`) : '';

    const date = element.find('.event-date, time').first().text().trim() ||
                 element.find('time').attr('datetime') || '';
    const time = element.find('.event-time').first().text().trim();
    const description = element.find('.event-description, p').first().text().trim();
    const image = element.find('img').first().attr('src') || '';

    return {
      name: title,
      title: title,
      description: description,
      date: date,
      time: time,
      venue: 'Alabama Theatre',
      location: 'Alabama Theatre',
      address: '1817 3rd Ave N',
      city: 'Birmingham',
      state: 'AL',
      zipCode: '35203',
      category: 'Arts',
      image: image ? (image.startsWith('http') ? image : `https://alabamatheatre.com${image}`) : '',
      imageUrl: image ? (image.startsWith('http') ? image : `https://alabamatheatre.com${image}`) : '',
      url: fullUrl,
      link: fullUrl
    };
  }
}

module.exports = AlabamaTheatreScraper;
```

Then register it in `scraper/index.js`:

```javascript
const AlabamaTheatreScraper = require('./sources/alabama-theatre');

this.scrapers = [
  // ... existing scrapers
  { name: 'alabama-theatre', scraper: new AlabamaTheatreScraper() }
];
```

---

## Integration Examples

### Slack Bot Integration

```javascript
// Post daily events to Slack
const axios = require('axios');

async function postToSlack() {
  const response = await axios.get('http://localhost:3000/api/events/upcoming');
  const events = response.data.events;

  // Get today's events
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events[today] || [];

  if (todayEvents.length === 0) {
    console.log('No events today');
    return;
  }

  const message = {
    text: `🎉 *${todayEvents.length} Events Happening Today in Birmingham!*`,
    attachments: todayEvents.slice(0, 5).map(event => ({
      title: event.title,
      title_link: event.url,
      text: `${event.location.venue} • ${event.time || 'Time TBA'}`,
      color: '#667eea'
    }))
  };

  // Post to Slack webhook
  await axios.post('YOUR_SLACK_WEBHOOK_URL', message);
  console.log('Posted to Slack');
}

// Run daily at 9 AM
const cron = require('node-cron');
cron.schedule('0 9 * * *', postToSlack);
```

---

### Twitter Bot Integration

```javascript
// Tweet about new events
const Twit = require('twit');

const T = new Twit({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

async function tweetUpcomingEvent() {
  const response = await fetch('http://localhost:3000/api/events/upcoming');
  const data = await response.json();

  // Get a random upcoming event
  const allUpcoming = Object.values(data.events).flat();
  const randomEvent = allUpcoming[Math.floor(Math.random() * allUpcoming.length)];

  const tweet = `🎪 ${randomEvent.title}
📅 ${randomEvent.date}
📍 ${randomEvent.location.venue}
🎟️ ${randomEvent.url}

#BirminghamAL #BirminghamEvents`;

  T.post('statuses/update', { status: tweet }, (err, data, response) => {
    if (err) {
      console.error('Twitter error:', err);
    } else {
      console.log('Tweeted!');
    }
  });
}

// Tweet 3 times per day
const cron = require('node-cron');
cron.schedule('0 9,14,19 * * *', tweetUpcomingEvent);
```

---

**Last Updated:** February 4, 2026
