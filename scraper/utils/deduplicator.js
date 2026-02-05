/**
 * Deduplicate events from multiple sources
 */
class EventDeduplicator {
  /**
   * Remove duplicate events based on similarity scoring
   * @param {Array} events - Array of normalized events
   * @returns {Array} Deduplicated events
   */
  static deduplicate(events) {
    const unique = [];
    const seen = new Set();

    events.forEach(event => {
      const signature = this.generateSignature(event);

      // Check if we've seen a similar event
      const isDuplicate = Array.from(seen).some(existingSignature => {
        return this.calculateSimilarity(signature, existingSignature) > 0.8;
      });

      if (!isDuplicate) {
        seen.add(signature);
        unique.push(event);
      }
    });

    return unique;
  }

  /**
   * Generate signature for event
   */
  static generateSignature(event) {
    const title = this.normalizeString(event.title);
    const date = event.date || '';
    const venue = this.normalizeString(event.location.venue);
    return `${title}|${date}|${venue}`;
  }

  /**
   * Normalize string for comparison
   */
  static normalizeString(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate similarity between two signatures (0-1)
   */
  static calculateSimilarity(sig1, sig2) {
    const [title1, date1, venue1] = sig1.split('|');
    const [title2, date2, venue2] = sig2.split('|');

    // Date must match exactly
    if (date1 !== date2) return 0;

    // Calculate title and venue similarity
    const titleSim = this.stringSimilarity(title1, title2);
    const venueSim = this.stringSimilarity(venue1, venue2);

    // Weighted average (title is more important)
    return (titleSim * 0.7) + (venueSim * 0.3);
  }

  /**
   * Calculate string similarity using Jaccard index
   */
  static stringSimilarity(str1, str2) {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Merge duplicate events (keep most complete record)
   */
  static mergeDuplicates(events) {
    const groups = this.groupSimilarEvents(events);

    return groups.map(group => {
      if (group.length === 1) return group[0];

      // Merge by taking non-null/non-empty values from all events
      return this.mergeEventGroup(group);
    });
  }

  /**
   * Group similar events together
   */
  static groupSimilarEvents(events) {
    const groups = [];

    events.forEach(event => {
      const signature = this.generateSignature(event);
      let addedToGroup = false;

      for (const group of groups) {
        const groupSignature = this.generateSignature(group[0]);
        if (this.calculateSimilarity(signature, groupSignature) > 0.8) {
          group.push(event);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push([event]);
      }
    });

    return groups;
  }

  /**
   * Merge a group of similar events into one complete record
   */
  static mergeEventGroup(group) {
    const merged = { ...group[0] };

    // Prefer events with more complete data
    group.forEach(event => {
      // Take longest description
      if (event.description && event.description.length > merged.description.length) {
        merged.description = event.description;
      }

      // Take first valid image
      if (event.image && !merged.image) {
        merged.image = event.image;
      }

      // Take most specific price info
      if (event.price && event.price.min !== null && merged.price.min === null) {
        merged.price = event.price;
      }

      // Take most complete location
      if (event.location.address && !merged.location.address) {
        merged.location.address = event.location.address;
      }

      // Collect all source URLs
      if (event.url && event.url !== merged.url) {
        merged.alternateUrls = merged.alternateUrls || [];
        merged.alternateUrls.push({ source: event.source, url: event.url });
      }
    });

    // Mark as merged
    merged.sources = group.map(e => e.source);

    return merged;
  }
}

module.exports = EventDeduplicator;
