const form = document.querySelector('#date-range');
const fromInput = document.querySelector('#from-date');
const toInput = document.querySelector('#to-date');
const button = document.querySelector('#show-ads');
const error = document.querySelector('#error');
const summary = document.querySelector('#summary');
const results = document.querySelector('#results');
const webmcpStatus = document.querySelector('#webmcp-status');
let jobAds = [];

// Adapted from job-ad's validate_date / is_leap_year. No timezone conversion.
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

function showError(message) {
  error.textContent = message;
  results.replaceChildren();
  summary.textContent = 'No results shown.';
}

// The one operation used by both the form and the WebMCP callback.
function filterJobAds(fromDate, toDate) {
  if (!validDate(fromDate) || !validDate(toDate)) {
    throw new Error('Enter valid From and To dates in YYYY-MM-DD format.');
  }
  if (fromDate > toDate) throw new Error('From date must be on or before To date.');

  const matches = jobAds.filter(ad => {
    const date = ad.publication_date.slice(0, 10);
    return date >= fromDate && date <= toDate;
  });

  fromInput.value = fromDate;
  toInput.value = toDate;
  error.textContent = '';
  results.replaceChildren();
  for (const ad of matches) {
    const item = document.createElement('li');
    const heading = document.createElement('h2');
    heading.textContent = ad.headline || ad.id || 'Job ad';
    item.append(heading);
    for (const text of [ad.employer, ad.workplace_address, `Published ${ad.publication_date.slice(0, 10)} · ID ${ad.id || 'unavailable'}`]) {
      if (!text) continue;
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      item.append(paragraph);
    }
    results.append(item);
  }
  summary.textContent = `${matches.length} job ads · ${fromDate} to ${toDate}`;
  return { from_date: fromDate, to_date: toDate, total: matches.length, job_ads: matches };
}

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    filterJobAds(fromInput.value, toInput.value);
  } catch (cause) {
    showError(cause.message);
  }
});

async function start() {
  try {
    const response = await fetch('./job-ads.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.some(ad =>
      !ad || typeof ad !== 'object' ||
      typeof ad.publication_date !== 'string' ||
      !validDate(ad.publication_date.slice(0, 10))
    )) throw new Error('Expected a compact JSON array with valid publication_date values.');
    jobAds = data;
    button.disabled = false;
    summary.textContent = `${jobAds.length} sample ads loaded. Choose a date range and show job ads.`;
  } catch (cause) {
    showError(`Could not load job-ads.json: ${cause.message}`);
    webmcpStatus.textContent = 'WebMCP tool not registered: sample data unavailable.';
    return;
  }

  if (typeof document.modelContext?.registerTool !== 'function') {
    webmcpStatus.textContent = 'WebMCP unavailable in this browser. Date filtering still works.';
    return;
  }
  try {
    await document.modelContext.registerTool({
      name: 'get_job_ads',
      description: 'Return and show job ads from a small static sample within an inclusive publication-date range. Updates the visible date fields and results only; never modifies job-ad data. Dates use YYYY-MM-DD as recorded, without timezone conversion.',
      inputSchema: {
        type: 'object',
        properties: {
          from_date: { type: 'string', format: 'date', description: 'Inclusive first publication date, YYYY-MM-DD.' },
          to_date: { type: 'string', format: 'date', description: 'Inclusive last publication date, YYYY-MM-DD.' }
        },
        required: ['from_date', 'to_date'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (args = {}) => {
        try {
          return JSON.stringify(filterJobAds(args?.from_date, args?.to_date));
        } catch (cause) {
          showError(cause.message);
          return JSON.stringify({ error: cause.message });
        }
      }
    });
    webmcpStatus.textContent = 'WebMCP ready: get_job_ads registered.';
  } catch (cause) {
    webmcpStatus.textContent = `WebMCP registration failed: ${cause.message}. Date filtering still works.`;
  }
}

start();
