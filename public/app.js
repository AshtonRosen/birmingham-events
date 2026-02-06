// API Configuration
const API_BASE_URL = window.location.origin;

// State
let allEvents = [];
let currentFilter = {
  category: '',
  searchQuery: ''
};

// DOM Elements
const eventsContainer = document.getElementById('eventsContainer');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const noResults = document.getElementById('noResults');
const metadata = document.getElementById('metadata');
const lastUpdated = document.getElementById('lastUpdated');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const categoryFilter = document.getElementById('categoryFilter');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  searchBtn.addEventListener('click', handleSearch);
  clearSearchBtn.addEventListener('click', handleClearSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  categoryFilter.addEventListener('change', handleCategoryFilter);
}

// Load Events from API
async function loadEvents() {
  try {
    showLoading(true);
    hideError();

    const response = await fetch(`${API_BASE_URL}/api/events/by-date`);
    if (!response.ok) throw new Error('Failed to fetch events');

    const data = await response.json();
    allEvents = data;

    renderMetadata(data.metadata);
    renderEvents(data.events);
    populateCategories(data.metadata);

    showLoading(false);
  } catch (err) {
    showError(err.message);
    showLoading(false);
  }
}

// Render Metadata
function renderMetadata(meta) {
  if (!meta) return;

  metadata.innerHTML = `
    <div class="metadata-item">
      <span class="metadata-label">Total Events</span>
      <span class="metadata-value">${meta.totalEvents || 0}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Date Range</span>
      <span class="metadata-value">${formatDateRange(meta.dateRange)}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Sources</span>
      <span class="metadata-value">${meta.sources?.length || 0}</span>
    </div>
  `;

  lastUpdated.textContent = new Date(meta.lastUpdated).toLocaleString();
}

// Render Events Grouped by Date
function renderEvents(eventsByDate) {
  if (!eventsByDate || Object.keys(eventsByDate).length === 0) {
    showNoResults(true);
    return;
  }

  showNoResults(false);
  eventsContainer.innerHTML = '';

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];

  // Only show upcoming events (today and future)
  const upcomingDates = Object.entries(eventsByDate)
    .filter(([date]) => date >= today)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

  if (upcomingDates.length === 0) {
    showNoResults(true);
    return;
  }

  upcomingDates.forEach(([date, events]) => {
    // Apply filters
    let filteredEvents = events;

    if (currentFilter.category) {
      filteredEvents = filteredEvents.filter(e =>
        e.category.toLowerCase() === currentFilter.category.toLowerCase()
      );
    }

    if (currentFilter.searchQuery) {
      const query = currentFilter.searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.location.venue.toLowerCase().includes(query)
      );
    }

    if (filteredEvents.length === 0) return;

    const section = document.createElement('div');
    section.className = 'date-section';

    const dateObj = new Date(date + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    section.innerHTML = `
      <div class="date-header">
        <h2 class="date-title">${formattedDate}</h2>
        <div class="date-day">${dayName}</div>
        <div class="event-count">${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="events-list">
        ${filteredEvents.map(event => renderEventCard(event)).join('')}
      </div>
    `;

    eventsContainer.appendChild(section);
  });

  // Check if any events were rendered
  if (eventsContainer.children.length === 0) {
    showNoResults(true);
  }
}

// Render Individual Event Card
function renderEventCard(event) {
  const imageHtml = event.image
    ? `<img src="${event.image}" alt="${event.title}" class="event-image" onerror="this.style.display='none'">`
    : `<div class="event-image placeholder">•</div>`;

  const priceText = event.price?.isFree
    ? 'FREE'
    : event.price?.min
    ? `$${event.price.min}${event.price.max && event.price.max !== event.price.min ? ` - $${event.price.max}` : ''}`
    : 'See website';

  return `
    <div class="event-card" onclick="window.open('${event.url}', '_blank')">
      ${imageHtml}
      <div class="event-details">
        <h3 class="event-title">${event.title}</h3>

        <div class="event-meta">
          ${event.time ? `<div class="event-meta-item">${event.time}</div>` : ''}
          ${event.location?.venue ? `<div class="event-meta-item">${event.location.venue}</div>` : ''}
          <div class="event-meta-item">${priceText}</div>
        </div>

        ${event.description ? `<div class="event-description">${truncateText(event.description, 200)}</div>` : ''}

        <div class="event-footer">
          <div>
            <span class="event-category">${event.category}</span>
          </div>
          <span class="event-source">via ${capitalizeFirst(event.source)}</span>
        </div>
      </div>
    </div>
  `;
}

// Populate Category Filter
function populateCategories(meta) {
  if (!allEvents.events) return;

  const categories = new Set();
  Object.values(allEvents.events).flat().forEach(event => {
    if (event.category) categories.add(event.category);
  });

  const sortedCategories = Array.from(categories).sort();

  categoryFilter.innerHTML = '<option value="">All Categories</option>' +
    sortedCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Handle Search
function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  currentFilter.searchQuery = query;
  renderEvents(allEvents.events);

  clearSearchBtn.style.display = 'inline-block';
}

// Handle Clear Search
function handleClearSearch() {
  searchInput.value = '';
  currentFilter.searchQuery = '';
  clearSearchBtn.style.display = 'none';
  renderEvents(allEvents.events);
}

// Handle Category Filter
function handleCategoryFilter() {
  currentFilter.category = categoryFilter.value;
  renderEvents(allEvents.events);
}

// Utility Functions
function showLoading(show) {
  loading.style.display = show ? 'block' : 'none';
  eventsContainer.style.display = show ? 'none' : 'block';
}

function showError(message) {
  error.textContent = `Error: ${message}`;
  error.style.display = 'block';
}

function hideError() {
  error.style.display = 'none';
}

function showNoResults(show) {
  noResults.style.display = show ? 'block' : 'none';
  eventsContainer.style.display = show ? 'none' : 'block';
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateRange(range) {
  if (!range || !range.earliest || !range.latest) return 'N/A';

  const earliest = new Date(range.earliest).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const latest = new Date(range.latest).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return `${earliest} - ${latest}`;
}
