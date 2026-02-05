const axios = require('axios');

/**
 * Cahaba Brewing Scraper (Google Calendar API)
 * Uses their public Google Calendars directly
 */
class CahabaBrewingScraper {
  constructor() {
    this.baseUrl = 'https://cahababrewing.com';
    // Google Calendar API endpoint
    this.apiBase = 'https://www.googleapis.com/calendar/v3/calendars';
    // API key from their website
    this.apiKey = 'AIzaSyAaWFYZZZy1oZMRqU6dj68_q4hMVgiDDT3c';

    // Their three public calendars
    this.calendars = [
      {
        id: 'cahababrewing.com_3klg8osefbctleqqlh503j6k04@group.calendar.google.com',
        name: 'Main Events'
      },
      {
        id: 'cahababrewing.com_0km3pm41co70kdgsvja36vgfac@group.calendar.google.com',
        name: 'Food Trucks'
      },
      {
        id: 'cahababrewing.com_6avc1uqlo55iabbuu4h5c4aqd8@group.calendar.google.com',
        name: 'Live Music'
      }
    ];
  }

  async scrape() {
    try {
      console.log('Scraping Cahaba Brewing events from Google Calendar...');
      const events = [];

      // Get events from next 60 days
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 60);

      for (const calendar of this.calendars) {
        try {
          const calendarEvents = await this.fetchCalendarEvents(calendar, now, future);
          events.push(...calendarEvents);
        } catch (error) {
          console.error(`Error fetching ${calendar.name}:`, error.message);
        }
      }

      console.log(`Found ${events.length} Cahaba Brewing events`);
      return events;
    } catch (error) {
      console.error('Error scraping Cahaba Brewing:', error.message);
      return [];
    }
  }

  async fetchCalendarEvents(calendar, startTime, endTime) {
    const url = `${this.apiBase}/${encodeURIComponent(calendar.id)}/events`;

    const params = {
      key: this.apiKey,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50
    };

    const response = await axios.get(url, {
      params,
      timeout: 15000
    });

    const events = [];

    if (response.data && response.data.items) {
      for (const item of response.data.items) {
        const event = this.parseEvent(item, calendar.name);
        if (event && event.name) {
          events.push(event);
        }
      }
    }

    return events;
  }

  parseEvent(gcalEvent, calendarType) {
    try {
      const title = gcalEvent.summary || 'Cahaba Event';

      // Parse date/time
      const start = gcalEvent.start?.dateTime || gcalEvent.start?.date;
      const end = gcalEvent.end?.dateTime || gcalEvent.end?.date;

      let dateText = '';
      let timeText = '';

      if (start) {
        const startDate = new Date(start);
        dateText = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        if (gcalEvent.start?.dateTime) {
          const startTime = startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });

          if (end) {
            const endDate = new Date(end);
            const endTime = endDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            });
            timeText = `${startTime} - ${endTime}`;
          } else {
            timeText = startTime;
          }
        }
      }

      const description = gcalEvent.description || `${calendarType} at Cahaba Brewing`;

      // Determine category based on calendar type
      let category = 'Food & Drink';
      if (calendarType === 'Live Music') {
        category = 'Music';
      }

      const venue = 'Cahaba Brewing';

      return {
        name: title,
        title: title,
        description: description,
        date: dateText,
        time: timeText,
        venue: venue,
        location: venue,
        address: '4500 5th Ave S',
        city: 'Birmingham',
        state: 'AL',
        zipCode: '35222',
        category: category,
        image: '',
        imageUrl: '',
        url: gcalEvent.htmlLink || `${this.baseUrl}/taproom/calendar/`,
        link: gcalEvent.htmlLink || `${this.baseUrl}/taproom/calendar/`
      };
    } catch (error) {
      console.error('Error parsing Cahaba event:', error.message);
      return null;
    }
  }
}

module.exports = CahabaBrewingScraper;
