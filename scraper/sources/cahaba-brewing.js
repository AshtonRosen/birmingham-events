const ical = require('node-ical');

/**
 * Cahaba Brewing Scraper (iCal format)
 * Uses their public Google Calendar iCal feeds
 */
class CahabaBrewingScraper {
  constructor() {
    this.baseUrl = 'https://cahababrewing.com';

    // Their three public calendars (iCal URLs)
    this.calendars = [
      {
        url: 'https://calendar.google.com/calendar/ical/cahababrewing.com_3klg8osefbctleqqlh503j6k04%40group.calendar.google.com/public/basic.ics',
        name: 'Main Events'
      },
      {
        url: 'https://calendar.google.com/calendar/ical/cahababrewing.com_0km3pm41co70kdgsvja36vgfac%40group.calendar.google.com/public/basic.ics',
        name: 'Food Trucks'
      },
      {
        url: 'https://calendar.google.com/calendar/ical/cahababrewing.com_6avc1uqlo55iabbuu4h5c4aqd8%40group.calendar.google.com/public/basic.ics',
        name: 'Live Music'
      }
    ];
  }

  async scrape() {
    try {
      console.log('Scraping Cahaba Brewing events from iCal feeds...');
      const events = [];

      // Get current date for filtering
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 90); // Next 90 days

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
    try {
      const data = await ical.fromURL(calendar.url);
      const events = [];

      for (const k in data) {
        const event = data[k];

        // Only process VEVENT types
        if (event.type !== 'VEVENT') continue;

        // Get event start date
        const eventStart = event.start;
        if (!eventStart) continue;

        // Filter by date range
        if (eventStart < startTime || eventStart > endTime) continue;

        const parsedEvent = this.parseEvent(event, calendar.name);
        if (parsedEvent && parsedEvent.name) {
          events.push(parsedEvent);
        }
      }

      return events;
    } catch (error) {
      console.error(`Error parsing ${calendar.name} iCal:`, error.message);
      return [];
    }
  }

  parseEvent(icalEvent, calendarType) {
    try {
      const title = icalEvent.summary || 'Cahaba Event';

      // Parse date/time
      const startDate = icalEvent.start;
      const endDate = icalEvent.end;

      let dateText = '';
      let timeText = '';

      if (startDate) {
        dateText = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Check if it's an all-day event
        if (icalEvent.start.getHours() !== 0 || icalEvent.start.getMinutes() !== 0) {
          const startTime = startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });

          if (endDate) {
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

      const description = icalEvent.description || `${calendarType} at Cahaba Brewing`;

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
        url: `${this.baseUrl}/taproom/calendar/`,
        link: `${this.baseUrl}/taproom/calendar/`
      };
    } catch (error) {
      console.error('Error parsing Cahaba event:', error.message);
      return null;
    }
  }
}

module.exports = CahabaBrewingScraper;
