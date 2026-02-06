const { parseISO, parse, isValid, format } = require('date-fns');

/**
 * Normalize event data from different sources into a standard format
 */
class EventNormalizer {
  /**
   * Standardize event object
   * @param {Object} rawEvent - Raw event data from scraper
   * @param {String} source - Source identifier (e.g., 'ticketmaster', 'bjcc')
   * @returns {Object} Normalized event object
   */
  static normalize(rawEvent, source) {
    return {
      id: this.generateId(rawEvent, source),
      title: this.cleanTitle(rawEvent.title || rawEvent.name || 'Untitled Event'),
      description: this.cleanDescription(rawEvent.description || rawEvent.excerpt || ''),
      date: this.normalizeDate(rawEvent.date || rawEvent.startDate),
      time: this.normalizeTime(rawEvent.time || rawEvent.startTime),
      endDate: rawEvent.endDate ? this.normalizeDate(rawEvent.endDate) : null,
      endTime: rawEvent.endTime ? this.normalizeTime(rawEvent.endTime) : null,
      location: {
        venue: rawEvent.venue || rawEvent.location || '',
        address: rawEvent.address || '',
        city: rawEvent.city || 'Birmingham',
        state: rawEvent.state || 'AL',
        zipCode: rawEvent.zipCode || ''
      },
      category: rawEvent.category || rawEvent.type || 'General',
      price: this.normalizePrice(rawEvent.price),
      image: rawEvent.image || rawEvent.imageUrl || '',
      url: rawEvent.url || rawEvent.link || '',
      source: source,
      scrapedAt: new Date().toISOString()
    };
  }

  /**
   * Generate unique ID from event data
   */
  static generateId(event, source) {
    const title = (event.title || event.name || '').toLowerCase().replace(/\s+/g, '-');
    const date = (event.date || event.startDate || '').replace(/[^0-9]/g, '');
    return `${source}-${title}-${date}`.substring(0, 100);
  }

  /**
   * Clean and trim title
   */
  static cleanTitle(title) {
    return title.trim().replace(/\s+/g, ' ');
  }

  /**
   * Clean description and limit length
   */
  static cleanDescription(description) {
    return description.trim().replace(/\s+/g, ' ').substring(0, 500);
  }

  /**
   * Normalize date to ISO 8601 format (YYYY-MM-DD)
   */
  static normalizeDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Handle ISO date strings
      if (dateStr.includes('T') || dateStr.includes('Z')) {
        const date = parseISO(dateStr);
        return isValid(date) ? format(date, 'yyyy-MM-dd') : null;
      }

      // Handle relative day names (Monday, Tuesday, etc.)
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const lowerStr = dateStr.toLowerCase();

      for (let i = 0; i < dayNames.length; i++) {
        if (lowerStr.includes(dayNames[i])) {
          // Calculate next occurrence of this day
          const today = new Date();
          const currentDay = today.getDay();
          const targetDay = i;
          let daysUntil = targetDay - currentDay;

          if (daysUntil <= 0) {
            daysUntil += 7; // Next week
          }

          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysUntil);
          return format(targetDate, 'yyyy-MM-dd');
        }
      }

      // Extract date patterns from text
      const datePatterns = [
        // "January 15, 2024" or "Jan 15, 2024" or "Feb 15, 2026"
        /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]+(\d{1,2})[,\s]+(\d{4})/i,
        // "15 January 2024" or "15 Feb 2026"
        /(\d{1,2})[,\s]+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]+(\d{4})/i,
        // "2024-01-15"
        /(\d{4})-(\d{2})-(\d{2})/,
        // "01/15/2024"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/
      ];

      for (const pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
          // Try to parse the matched portion
          const matchedStr = match[0];
          const formats = [
            'MMMM dd, yyyy',
            'MMMM d, yyyy',
            'MMM dd, yyyy',
            'MMM d, yyyy',
            'dd MMMM yyyy',
            'd MMMM yyyy',
            'dd MMM yyyy',
            'd MMM yyyy',
            'yyyy-MM-dd',
            'MM/dd/yyyy',
            'M/d/yyyy'
          ];

          for (const fmt of formats) {
            try {
              const date = parse(matchedStr, fmt, new Date());
              if (isValid(date)) {
                return format(date, 'yyyy-MM-dd');
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error parsing date: ${dateStr}`, error.message);
      return null;
    }
  }

  /**
   * Normalize time to HH:mm format
   */
  static normalizeTime(timeStr) {
    if (!timeStr) return null;

    try {
      // Remove extra whitespace
      timeStr = timeStr.trim();

      // Handle 12-hour format with AM/PM
      const time12Match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
      if (time12Match) {
        let hours = parseInt(time12Match[1]);
        const minutes = time12Match[2] || '00';
        const period = time12Match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${String(hours).padStart(2, '0')}:${minutes}`;
      }

      // Handle 24-hour format
      const time24Match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (time24Match) {
        const hours = parseInt(time24Match[1]);
        const minutes = time24Match[2];
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      }

      return null;
    } catch (error) {
      console.error(`Error parsing time: ${timeStr}`, error.message);
      return null;
    }
  }

  /**
   * Normalize price information
   */
  static normalizePrice(priceStr) {
    if (!priceStr) return { min: null, max: null, currency: 'USD', isFree: false };

    // Check for free events
    if (/free|no charge|complimentary/i.test(priceStr)) {
      return { min: 0, max: 0, currency: 'USD', isFree: true };
    }

    try {
      // Extract numeric values
      const numbers = priceStr.match(/\d+\.?\d*/g);
      if (!numbers || numbers.length === 0) {
        return { min: null, max: null, currency: 'USD', isFree: false };
      }

      const prices = numbers.map(n => parseFloat(n));
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: 'USD',
        isFree: false
      };
    } catch (error) {
      return { min: null, max: null, currency: 'USD', isFree: false };
    }
  }

  /**
   * Group events by date
   */
  static groupByDate(events) {
    const grouped = {};

    events.forEach(event => {
      const date = event.date;
      if (!date) return;

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    // Sort events within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
    });

    return grouped;
  }

  /**
   * Sort dates in ascending order
   */
  static sortDates(groupedEvents) {
    return Object.keys(groupedEvents)
      .sort((a, b) => a.localeCompare(b))
      .reduce((sorted, date) => {
        sorted[date] = groupedEvents[date];
        return sorted;
      }, {});
  }
}

module.exports = EventNormalizer;
