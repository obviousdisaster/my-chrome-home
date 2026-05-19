'use strict';

// ===== Config =====

const ENGINES = {
  google:     { url: 'https://www.google.com/search?q=',  placeholder: 'Search Google...' },
  bing:       { url: 'https://www.bing.com/search?q=',    placeholder: 'Search Bing...' },
  duckduckgo: { url: 'https://duckduckgo.com/?q=',        placeholder: 'Search DuckDuckGo...' },
};

// Bangs — standard + extras not in DuckDuckGo
const BANGS = {
  // Search
  g:      { url: 'https://www.google.com/search?q=',              label: 'Google',          cat: 'Search'    },
  b:      { url: 'https://www.bing.com/search?q=',                label: 'Bing',            cat: 'Search'    },
  ddg:    { url: 'https://duckduckgo.com/?q=',                    label: 'DuckDuckGo',      cat: 'Search'    },
  // Video & Streaming
  yt:     { url: 'https://www.youtube.com/results?search_query=', label: 'YouTube',         cat: 'Video'     },
  twitch: { url: 'https://www.twitch.tv/search?term=',            label: 'Twitch',          cat: 'Video'     },
  nf:     { url: 'https://www.netflix.com/search?q=',             label: 'Netflix',         cat: 'Video'     },
  // Social
  r:      { url: 'https://www.reddit.com/search/?q=',             label: 'Reddit',          cat: 'Social'    },
  x:      { url: 'https://x.com/search?q=',                       label: 'X (Twitter)',     cat: 'Social'    },
  li:     { url: 'https://www.linkedin.com/search/results/all/?keywords=', label: 'LinkedIn', cat: 'Social' },
  pin:    { url: 'https://www.pinterest.com/search/pins/?q=',     label: 'Pinterest',       cat: 'Social'    },
  // Shopping
  a:      { url: 'https://www.amazon.com/s?k=',                   label: 'Amazon',          cat: 'Shopping'  },
  ebay:   { url: 'https://www.ebay.com/sch/i.html?_nkw=',         label: 'eBay',            cat: 'Shopping'  },
  // Developer
  gh:     { url: 'https://github.com/search?q=',                  label: 'GitHub',          cat: 'Dev'       },
  so:     { url: 'https://stackoverflow.com/search?q=',           label: 'Stack Overflow',  cat: 'Dev'       },
  mdn:    { url: 'https://developer.mozilla.org/en-US/search?q=', label: 'MDN',             cat: 'Dev'       },
  npm:    { url: 'https://www.npmjs.com/search?q=',               label: 'npm',             cat: 'Dev'       },
  pypi:   { url: 'https://pypi.org/search/?q=',                   label: 'PyPI',            cat: 'Dev'       },
  docker: { url: 'https://hub.docker.com/search?q=',              label: 'Docker Hub',      cat: 'Dev'       },
  crates: { url: 'https://crates.io/search?q=',                   label: 'crates.io',       cat: 'Dev'       },
  // Knowledge
  w:      { url: 'https://en.wikipedia.org/w/index.php?search=',  label: 'Wikipedia',       cat: 'Knowledge' },
  wa:     { url: 'https://www.wolframalpha.com/input?i=',         label: 'Wolfram Alpha',   cat: 'Knowledge' },
  wb:     { url: 'https://web.archive.org/web/*/',                label: 'Wayback Machine', cat: 'Knowledge' },
  nasa:   { url: 'https://www.nasa.gov/search/?q=',               label: 'NASA',            cat: 'Knowledge' },
  // AI  (non-standard — not in DDG)
  gpt:    { url: 'https://chatgpt.com/?q=',                       label: 'ChatGPT',         cat: 'AI'        },
  perp:   { url: 'https://www.perplexity.ai/search?q=',           label: 'Perplexity',      cat: 'AI'        },
  // Google services
  maps:   { url: 'https://www.google.com/maps/search/',           label: 'Google Maps',     cat: 'Google'    },
  img:    { url: 'https://www.google.com/search?tbm=isch&q=',     label: 'Google Images',   cat: 'Google'    },
  news:   { url: 'https://news.google.com/search?q=',             label: 'Google News',     cat: 'Google'    },
  drive:  { url: 'https://drive.google.com/drive/search?q=',      label: 'Google Drive',    cat: 'Google'    },
  // Music
  sp:     { url: 'https://open.spotify.com/search/',              label: 'Spotify',         cat: 'Music'     },
};

const DEFAULT_SETTINGS = {
  accentColor:        '#58a6ff',
  layoutWidth:        'boxed',  // 'boxed' | 'full'
  quoteCategory:      'All',
  showQuotes:         true,
  wallpaperSource:    'bing',   // 'bing' | 'nasa' | 'solid' | 'custom'
  solidColor:         '#0d1117',
  customWallpaperUrl: '',
  nasaApiKey:         'DEMO_KEY',
  showClock:          true,
  showDate:           true,
  showGreeting:       true,
  showWeather:        true,
  showIntention:      true,
  showHistory:        true,
  showSounds:         true,
  showCredit:         true,
};

// ===== State =====

let activeEngine = 'google';
let activePanel  = 'bookmarks';
let activeGroup  = 0;
let bookmarkGroups = [];
let notes = [];
let editingNoteId     = null;
let editingBookmarkId = null;
let dragSrcIdx        = -1;

let clockMode       = 'numeric'; // 'numeric' | 'word'
let weatherMode     = 'normal';  // 'normal' | 'tfw'
let lastWeatherData = null;

// ===== Utilities =====

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


function faviconUrl(url) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
  } catch {
    return '';
  }
}

function friendlyDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== Storage =====

async function loadData() {
  const data = await chrome.storage.local.get(['bookmarkGroups', 'notes']);
  bookmarkGroups = data.bookmarkGroups ?? [{ id: 'default', name: 'Favourites', bookmarks: [] }];
  notes          = data.notes          ?? [];
}

function saveBookmarks() { chrome.storage.local.set({ bookmarkGroups }); }
function saveNotes()     { chrome.storage.local.set({ notes }); }

// ===== Settings =====

async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  return Object.assign({}, DEFAULT_SETTINGS, settings);
}

function applySettings(settings) {
  document.documentElement.style.setProperty('--accent', settings.accentColor);
  document.documentElement.style.setProperty('--accent-hover', settings.accentColor);

  const app = document.getElementById('app');
  if (app) app.classList.toggle('layout-full', settings.layoutWidth === 'full');

  const toggles = {
    showClock:     'clock',
    showDate:      'date-display',
    showGreeting:  'greeting',
    showWeather:   'weather-container',
    showIntention: 'intention-bar',
    showHistory:   'history-strip',
    showQuotes:    'quote-strip',
    showSounds:    'ambient-player',
    showCredit:    'wallpaper-credit',
  };

  Object.entries(toggles).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = settings[key] ? '' : 'none';
  });

  if (!settings.showWeather) {
    applyTfwGradient(false);
  }
}

// ===== Clock & Greeting =====

function updateClock() {
  const now     = new Date();
  const h       = now.getHours();
  const m       = now.getMinutes();
  const clockEl = document.getElementById('clock');

  if (clockMode === 'word') {
    clockEl.textContent = timeToWords(h, m);
    clockEl.classList.add('word-mode');
  } else {
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    clockEl.classList.remove('word-mode');
  }

  document.getElementById('greeting').textContent =
    h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('date-display').textContent =
    now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function timeToWords(h, m) {
  const HOURS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six',
                 'seven', 'eight', 'nine', 'ten', 'eleven'];
  const MINS  = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
                 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
                 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
                 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three',
                 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven',
                 'twenty-eight', 'twenty-nine'];

  if (h === 0 && m === 0) return 'midnight';
  if (h === 12 && m === 0) return 'noon';

  const h12    = h % 12;
  const period = h < 12 ? 'in the morning'
               : h < 17 ? 'in the afternoon'
               : h < 21 ? 'in the evening'
               : 'at night';

  if (m === 0)  return `${HOURS[h12]} o'clock ${period}`;
  if (m === 15) return `quarter past ${HOURS[h12]} ${period}`;
  if (m === 30) return `half past ${HOURS[h12]} ${period}`;
  if (m === 45) {
    if (h === 23) return 'quarter to midnight';
    if (h === 11) return 'quarter to noon';
    return `quarter to ${HOURS[(h12 + 1) % 12]} ${period}`;
  }
  if (m < 30)   return `${MINS[m]} minutes past ${HOURS[h12]} ${period}`;
  return `${MINS[60 - m]} minutes to ${HOURS[(h12 + 1) % 12]} ${period}`;
}

function initClockModeBtn() {
  const btn = document.getElementById('clock-mode-btn');
  const LABELS = { numeric: 'Numeric', word: 'Words' };
  btn.textContent = LABELS[clockMode];
  btn.addEventListener('click', () => {
    clockMode = clockMode === 'numeric' ? 'word' : 'numeric';
    btn.textContent = LABELS[clockMode];
    chrome.storage.local.set({ clockMode });
    updateClock();
  });
}

// ===== Weather =====

const WEATHER_CACHE_MS = 10 * 60 * 1000;

const WMO_DESC = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail',
};

function weatherEmoji(code) {
  if (code === 0)                   return '☀';
  if (code === 1)                   return '🌤';
  if (code === 2)                   return '⛅';
  if (code === 3)                   return '☁';
  if (code === 45 || code === 48)   return '🌫';
  if (code >= 51 && code <= 55)     return '🌦';
  if (code >= 61 && code <= 67)     return '🌧';
  if (code >= 71 && code <= 77)     return '❄';
  if (code >= 80 && code <= 82)     return '🌧';
  if (code === 85 || code === 86)   return '🌨';
  if (code >= 95)                   return '⛈';
  return '🌡';
}

const WEATHER_MODES = ['normal', 'tfw'];
const WEATHER_MODE_LABELS = { normal: 'Normal', tfw: 'TFW' };

// ===== TFW Phrase Banks =====
// Each key is an array — add as many phrases as you like and one is picked at random.
const TFW_PHRASES = {
  // Condition-based
  thunderstorm:  ["STAY THE HELL INSIDE","FUCKING THUNDER STRIKE","THUNDER AND LIGHTNING, VERY VERY FRIGHTENING","IT'S LIKE ZEUS IS TAKING A PISSING CONTEST","THE GODS ARE HAVING A FIGHT CLUB MATCH RIGHT ABOVE US"],
  snow_baltic:   ["IT'S PROPER BALTIC"],         // snow when below -5°C
  snow:          ["IT'S SNOWING", "BRAIN FUCKING FREEZE","IT'S DOING THE WHITE STUFF","SNOWMAGEDDON","THE BEAST FROM THE EAST IS HERE","IT'S SNOWING LIKE IT'S 1996"],
  showers:       ["IT'S PISSING DOWN","SHOWERING LIKE A BASTARD","IT'S RAINING CATS AND DOGS","IT'S RAINING LIKE A COW PISSING ON A FLAT ROCK"],
  rain_cold:     ["COLD AND WET. LOVELY.", "CHILLY AND WET, LOVELY."],       // rain when below 5°C
  rain:          ["IT'S RAINING","RAIN, RAIN PLEASE GO AWAY","IT'S PISSING IT DOWN","THE SKY'S TAKING THE PISS","ABSOLUTELY HAMMERING IT","IT'S CHUCKING IT DOWN LIKE IT OWES ME MONEY"],
  drizzle:       ["IT'S A BIT DRIZZLY","MEH... DON'T EVEN ASK"],
  fog:           ["CAN'T SEE SHIT","FOG SO THICK YOU COULD CUT IT WITH A KNIFE","JACK THE RIPPER WEATHER","IT'S LIKE THE WORLD IS WRAPPED IN A DUVET"],
  // Temperature bands (clear or cloudy)
  arctic:        ["IT'S FUCKING ARCTIC", "ABSOLUTELY FREEZING"],         // below -10°C
  freezing:      ["IT'S BLOODY FREEZING","FREEZING MY BOLLOCKS OFF","FREEZE THE BACKSIDE OFF A POLAR BEAR"],        // -10 to 0°C
  very_cold:     ["IT'S VERY COLD"],              // 0 to 5°C
  cold:          ["IT'S PRETTY COLD"],            // 5 to 10°C
  chilly:        ["A BIT CHILLY"],                // 10 to 15°C
  ok:            ["NOT BAD, ACTUALLY", "It's not too bad"],           // 15 to 18°C
  nice:          ["QUITE NICE", "Not bad, actually"],                  // 18 to 22°C
  warm:          ["PRETTY WARM", "It's quite warm"],                 // 22 to 26°C
  hot:           ["IT'S HOT","It's so hot I'm melting"],                    // 26 to 30°C
  very_hot:      ["IT'S VERY HOT","Sweating like a whores twat"],               // 30 to 35°C
  roasting:      ["IT'S FUCKING ROASTING"],       // above 35°C
};

function tfwDescription(code, temp) {
  if (code >= 95)                               return pick(TFW_PHRASES.thunderstorm);
  if (code >= 85 || (code >= 71 && code <= 77)) return pick(temp < -5 ? TFW_PHRASES.snow_baltic : TFW_PHRASES.snow);
  if (code >= 80 && code <= 82)                 return pick(TFW_PHRASES.showers);
  if (code >= 61 && code <= 67)                 return pick(temp < 5 ? TFW_PHRASES.rain_cold : TFW_PHRASES.rain);
  if (code >= 51 && code <= 55)                 return pick(TFW_PHRASES.drizzle);
  if (code === 45 || code === 48)               return pick(TFW_PHRASES.fog);
  if (temp < -10) return pick(TFW_PHRASES.arctic);
  if (temp < 0)   return pick(TFW_PHRASES.freezing);
  if (temp < 5)   return pick(TFW_PHRASES.very_cold);
  if (temp < 10)  return pick(TFW_PHRASES.cold);
  if (temp < 15)  return pick(TFW_PHRASES.chilly);
  if (temp < 18)  return pick(TFW_PHRASES.ok);
  if (temp < 22)  return pick(TFW_PHRASES.nice);
  if (temp < 26)  return pick(TFW_PHRASES.warm);
  if (temp < 30)  return pick(TFW_PHRASES.hot);
  if (temp < 35)  return pick(TFW_PHRASES.very_hot);
  return pick(TFW_PHRASES.roasting);
}

function tfwBgColor(temp) {
  if (temp < -10) return '#0d1b2a';
  if (temp < 0)   return '#1a3a5c';
  if (temp < 5)   return '#1e4976';
  if (temp < 10)  return '#1a5c7a';
  if (temp < 15)  return '#1a5c4a';
  if (temp < 18)  return '#2d5a27';
  if (temp < 22)  return '#4a7c59';
  if (temp < 26)  return '#8b5a00';
  if (temp < 30)  return '#a03000';
  if (temp < 35)  return '#b01500';
  return '#8b0000';
}

function applyTfwGradient(active, temp) {
  const el = document.getElementById('header-right');
  if (!el) return;
  if (active) {
    const color = tfwBgColor(temp);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    el.style.background = `linear-gradient(90deg, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0.9) 100%)`;
  } else {
    el.style.background = '';
  }
}

function applyWeatherDisplay(payload) {
  if (!payload) return;
  const container = document.getElementById('weather-container');
  if (container && container.style.display === 'none') return;

  const code   = payload.weather.current.weather_code;
  const temp   = Math.round(payload.weather.current.temperature_2m);
  const city   = payload.city || '';
  const widget = document.getElementById('weather-widget');

  widget.classList.remove('tfw-compact');

  const refreshBtn = document.getElementById('weather-refresh-btn');

  if (weatherMode === 'tfw') {
    widget.classList.add('tfw-compact');
    document.getElementById('weather-icon').textContent = '';
    document.getElementById('weather-temp').textContent = `${temp}°C`;
    document.getElementById('weather-desc').textContent = tfwDescription(code, temp);
    if (refreshBtn) refreshBtn.style.display = '';
    applyTfwGradient(true, temp);

  } else { // normal
    const desc = WMO_DESC[code] ?? 'Unknown';
    document.getElementById('weather-icon').textContent = weatherEmoji(code);
    document.getElementById('weather-temp').textContent = `${temp}°C`;
    document.getElementById('weather-desc').textContent = city ? `${desc} · ${city}` : desc;
    if (refreshBtn) refreshBtn.style.display = 'none';
    applyTfwGradient(false, temp);
  }
}

function renderWeather(payload) {
  lastWeatherData = payload;
  applyWeatherDisplay(payload);
}

async function fetchAndCacheWeather(lat, lon) {
  const [weatherRes, geoRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`),
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`),
  ]);
  const weather = await weatherRes.json();
  const geo     = await geoRes.json();
  const city    = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || '';
  const payload = { weather, city };
  chrome.storage.local.set({ wCache: payload, wCacheTime: Date.now() });
  return payload;
}

async function loadWeather() {
  const widget = document.getElementById('weather-widget');

  // Serve from cache if fresh
  const { wCache, wCacheTime } = await chrome.storage.local.get(['wCache', 'wCacheTime']);
  if (wCache && wCacheTime && Date.now() - wCacheTime < WEATHER_CACHE_MS) {
    renderWeather(wCache);
    return;
  }

  if (!navigator.geolocation) {
    widget.textContent = 'Geolocation unavailable';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const payload = await fetchAndCacheWeather(pos.coords.latitude, pos.coords.longitude);
        renderWeather(payload);
      } catch {
        widget.textContent = 'Weather unavailable';
      }
    },
    () => { widget.textContent = 'Location blocked'; },
    { timeout: 8000 },
  );
}

function initWeatherToggle() {
  const btn = document.getElementById('weather-mode-btn');
  btn.textContent = WEATHER_MODE_LABELS[weatherMode];
  btn.addEventListener('click', () => {
    const idx = WEATHER_MODES.indexOf(weatherMode);
    weatherMode = WEATHER_MODES[(idx + 1) % WEATHER_MODES.length];
    btn.textContent = WEATHER_MODE_LABELS[weatherMode];
    chrome.storage.local.set({ weatherMode });
    applyWeatherDisplay(lastWeatherData);
  });

  document.getElementById('weather-refresh-btn').addEventListener('click', () => {
    applyWeatherDisplay(lastWeatherData);
  });
}

// ===== Search =====

function initSearch() {
  document.querySelectorAll('.engine-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeEngine = tab.dataset.engine;
      document.querySelectorAll('.engine-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('search-input').placeholder = ENGINES[activeEngine].placeholder;
    });
  });

  document.getElementById('search-form').addEventListener('submit', e => {
    e.preventDefault();
    const raw = document.getElementById('search-input').value.trim();
    if (!raw) return;

    // Bang detection: !bang query  OR  query !bang
    const bangStart = raw.match(/^!(\w+)\s+([\s\S]+)$/);
    const bangEnd   = raw.match(/^([\s\S]+)\s+!(\w+)$/);
    const bangOnly  = raw.match(/^!(\w+)$/);

    const bangKey = bangStart?.[1] || bangEnd?.[2] || bangOnly?.[1];
    const bangQ   = bangStart?.[2] || bangEnd?.[1] || '';

    if (bangKey && BANGS[bangKey.toLowerCase()]) {
      window.location.href = BANGS[bangKey.toLowerCase()].url + encodeURIComponent(bangQ);
      return;
    }

    if (/^https?:\/\//i.test(raw)) {
      window.location.href = raw;
    } else if (/^[\w.-]+\.\w{2,}$/.test(raw) && !raw.includes(' ')) {
      window.location.href = `https://${raw}`;
    } else {
      window.location.href = ENGINES[activeEngine].url + encodeURIComponent(raw);
    }
  });
}

function initBangHelp() {
  document.getElementById('bang-help-btn').addEventListener('click', () => {
    // Build table grouped by category
    const container = document.getElementById('bang-table');
    if (container.children.length) { openModal('modal-bangs'); return; }

    const cats = {};
    Object.entries(BANGS).forEach(([k, v]) => {
      if (!cats[v.cat]) cats[v.cat] = [];
      cats[v.cat].push({ bang: k, label: v.label });
    });

    Object.entries(cats).forEach(([cat, items]) => {
      const section = document.createElement('div');
      section.className = 'bang-section';
      const heading = document.createElement('div');
      heading.className = 'bang-cat-heading';
      heading.textContent = cat;
      section.appendChild(heading);
      const grid = document.createElement('div');
      grid.className = 'bang-grid';
      items.forEach(({ bang, label }) => {
        const row = document.createElement('div');
        row.className = 'bang-row';
        const code = document.createElement('code');
        code.textContent = `!${bang}`;
        const span = document.createElement('span');
        span.textContent = label;
        row.append(code, span);
        grid.appendChild(row);
      });
      section.appendChild(grid);
      container.appendChild(section);
    });

    openModal('modal-bangs');
  });
  document.getElementById('close-bangs').addEventListener('click', () => closeModal('modal-bangs'));
}

// ===== Daily Intention =====

async function loadIntention() {
  const today = new Date().toISOString().slice(0, 10);
  const { intention } = await chrome.storage.sync.get('intention');
  const input = document.getElementById('intention-input');
  if (intention && intention.date === today) {
    input.value = intention.text;
  } else {
    chrome.storage.sync.remove('intention');
    input.value = '';
  }
}

function initIntention() {
  const input = document.getElementById('intention-input');
  input.addEventListener('input', () => {
    const today = new Date().toISOString().slice(0, 10);
    chrome.storage.sync.set({ intention: { date: today, text: input.value } });
  });
}

// ===== This Day in History =====

let historyEvents = [];
let historyIdx    = 0;

async function loadHistory() {
  const today = new Date().toISOString().slice(0, 10);
  const { histCache } = await chrome.storage.local.get('histCache');

  if (histCache && histCache.date === today) {
    historyEvents = histCache.events;
    showHistoryEvent();
    return;
  }

  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();

  try {
    const res  = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`);
    const data = await res.json();
    const events = data.events ?? [];
    for (let i = events.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [events[i], events[j]] = [events[j], events[i]];
    }
    historyEvents = events;
    chrome.storage.local.set({ histCache: { date: today, events } });
    showHistoryEvent();
  } catch {
    document.getElementById('history-text').textContent = 'History unavailable';
  }
}

function showHistoryEvent() {
  if (!historyEvents.length) return;
  const ev = historyEvents[historyIdx % historyEvents.length];
  document.getElementById('history-year').textContent = ev.year ? String(ev.year) : '';
  document.getElementById('history-text').textContent = ev.text ?? '';
}

function initHistory() {
  document.getElementById('history-next').addEventListener('click', () => {
    historyIdx = (historyIdx + 1) % Math.max(historyEvents.length, 1);
    showHistoryEvent();
  });
}

// ===== Quote of the Day =====

let quoteList = [];
let quoteIdx  = 0;

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadQuotes(category) {
  try {
    const res      = await fetch(chrome.runtime.getURL('quotes.json'));
    const all      = await res.json();
    const filtered = (!category || category === 'All')
      ? all
      : all.filter(q => q.tags && q.tags.includes(category));
    const seed = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''), 10);
    quoteList  = seededShuffle(filtered.length ? filtered : all, seed);
    quoteIdx   = 0;
    showQuote();
  } catch {
    const el = document.getElementById('quote-text');
    if (el) el.textContent = 'Quote unavailable';
  }
}

function showQuote() {
  if (!quoteList.length) return;
  const q = quoteList[quoteIdx % quoteList.length];
  document.getElementById('quote-text').textContent   = `"${q.content}"`;
  document.getElementById('quote-author').textContent = q.author;
}

function initQuotes() {
  document.getElementById('quote-next').addEventListener('click', () => {
    quoteIdx = (quoteIdx + 1) % Math.max(quoteList.length, 1);
    showQuote();
  });
}

// ===== Ambient Sounds =====

let audioCtx = null;
let ambSrc   = null;
let ambGain  = null;
let ambLFO   = null;

function makeNoiseBuffer(ctx, type) {
  const len  = ctx.sampleRate * 2;
  const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * w) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

function stopSound() {
  if (ambSrc)  { try { ambSrc.stop(); } catch {} ambSrc = null; }
  if (ambLFO)  { try { ambLFO.stop(); } catch {} ambLFO = null; }
  if (audioCtx){ audioCtx.close(); audioCtx = null; }
  ambGain = null;
}

function startSound(type, volume) {
  stopSound();
  audioCtx = new AudioContext();
  ambGain  = audioCtx.createGain();
  ambGain.gain.value = volume;
  ambGain.connect(audioCtx.destination);

  function noiseSource(noiseType) {
    const src = audioCtx.createBufferSource();
    src.buffer = makeNoiseBuffer(audioCtx, noiseType);
    src.loop   = true;
    return src;
  }

  if (type === 'rain') {
    ambSrc = noiseSource('white');
    const f = audioCtx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.8;
    ambSrc.connect(f); f.connect(ambGain);

  } else if (type === 'ocean') {
    ambSrc = noiseSource('pink');
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 400;
    ambSrc.connect(f); f.connect(ambGain);
    ambLFO = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
    lfoG.gain.value = volume * 0.35;
    ambLFO.frequency.value = 0.12;
    ambLFO.connect(lfoG); lfoG.connect(ambGain.gain);
    ambLFO.start();

  } else if (type === 'fire') {
    ambSrc = noiseSource('brown');
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 800;
    ambSrc.connect(f); f.connect(ambGain);

  } else {
    // white / brown / pink — direct
    ambSrc = noiseSource(type === 'white' ? 'white' : type === 'brown' ? 'brown' : 'pink');
    ambSrc.connect(ambGain);
  }

  ambSrc.start();
}

function initAmbient() {
  const panel   = document.getElementById('ambient-panel');
  const playBtn = document.getElementById('ambient-play-btn');
  const volEl   = document.getElementById('ambient-volume');
  let playing   = false;

  document.getElementById('ambient-btn').addEventListener('click', () => {
    panel.classList.toggle('hidden');
  });
  document.getElementById('ambient-close').addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  playBtn.addEventListener('click', () => {
    if (playing) {
      stopSound();
      playing = false;
      playBtn.textContent = '▶ Play';
    } else {
      startSound(document.getElementById('ambient-type').value, parseFloat(volEl.value));
      playing = true;
      playBtn.textContent = '⏹ Stop';
    }
  });

  volEl.addEventListener('input', () => {
    if (ambGain) ambGain.gain.value = parseFloat(volEl.value);
  });

  document.getElementById('ambient-type').addEventListener('change', () => {
    if (playing) startSound(document.getElementById('ambient-type').value, parseFloat(volEl.value));
  });
}

// ===== Google Tasks =====

const TASKS_API = 'https://www.googleapis.com/tasks/v1';
let tasksLoaded = false;

function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, token => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message ?? 'No token'));
      } else {
        resolve(token);
      }
    });
  });
}

async function tasksApiFetch(path, init = {}) {
  const token = await getAuthToken(false);
  const res = await fetch(`${TASKS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (res.status === 401) {
    await new Promise(r => chrome.identity.removeCachedAuthToken({ token }, r));
    throw new Error('auth-expired');
  }
  return res;
}

async function loadGoogleTasks() {
  if (tasksLoaded) return;
  const container = document.getElementById('tasks-list');
  container.innerHTML = '<div class="empty-state">Loading…</div>';
  try {
    await getAuthToken(false);
    await fetchAndRenderTasks();
  } catch {
    showTasksSignIn();
  }
}

async function fetchAndRenderTasks() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '<div class="empty-state">Loading…</div>';
  tasksLoaded = false;
  try {
    const listsRes  = await tasksApiFetch('/users/@me/lists?maxResults=100');
    const listsData = await listsRes.json();
    const lists     = listsData.items ?? [];

    const taskArrays = await Promise.all(
      lists.map(list =>
        tasksApiFetch(`/lists/${list.id}/tasks?showCompleted=false&showHidden=false&maxResults=100`)
          .then(r => r.json())
          .then(d => (d.items ?? []).map(t => ({ ...t, listTitle: list.title, listId: list.id })))
      )
    );

    const tasks = taskArrays.flat().filter(t => t.title?.trim() && t.status !== 'completed');
    renderTasksAgenda(tasks);
    tasksLoaded = true;
  } catch (err) {
    if (err.message === 'auth-expired') {
      showTasksSignIn();
    } else {
      container.innerHTML = '<div class="empty-state">Could not load tasks.</div>';
    }
  }
}

function renderTasksAgenda(tasks) {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';

  if (tasks.length === 0) {
    container.innerHTML = "<div class=\"empty-state\">No tasks — you're all caught up.</div>";
    return;
  }

  const today        = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow     = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const thisWeekEnd  = new Date(today); thisWeekEnd.setDate(today.getDate() + 7);

  const buckets = [
    { label: 'Overdue',   cls: 'tasks-heading-danger', tasks: [] },
    { label: 'Today',     cls: 'tasks-heading-today',  tasks: [] },
    { label: 'Tomorrow',  cls: '',                     tasks: [] },
    { label: 'This Week', cls: '',                     tasks: [] },
    { label: 'Later',     cls: '',                     tasks: [] },
    { label: 'No Date',   cls: '',                     tasks: [] },
  ];

  tasks.forEach(task => {
    if (!task.due) { buckets[5].tasks.push(task); return; }
    const dueDay = new Date(task.due); dueDay.setHours(0, 0, 0, 0);
    if      (dueDay < today)                          buckets[0].tasks.push(task);
    else if (dueDay.getTime() === today.getTime())    buckets[1].tasks.push(task);
    else if (dueDay.getTime() === tomorrow.getTime()) buckets[2].tasks.push(task);
    else if (dueDay < thisWeekEnd)                    buckets[3].tasks.push(task);
    else                                              buckets[4].tasks.push(task);
  });

  buckets.forEach(({ label, cls, tasks: bt }) => {
    if (!bt.length) return;
    const section = document.createElement('div');
    section.className = 'tasks-section';

    const heading = document.createElement('div');
    heading.className = `tasks-section-heading${cls ? ` ${cls}` : ''}`;
    heading.textContent = label;
    section.appendChild(heading);

    bt.forEach(task => section.appendChild(buildTaskItem(task)));
    container.appendChild(section);
  });
}

function buildTaskItem(task) {
  const item = document.createElement('div');
  item.className = 'task-item';

  const checkbox = document.createElement('button');
  checkbox.className = 'task-checkbox';
  checkbox.title = 'Mark complete';
  checkbox.addEventListener('click', () => completeTask(task, item));

  const body = document.createElement('div');
  body.className = 'task-body';

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title;
  body.appendChild(title);

  if (task.notes) {
    const notes = document.createElement('div');
    notes.className = 'task-notes';
    notes.textContent = task.notes;
    body.appendChild(notes);
  }

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  if (task.due) {
    const dueSpan = document.createElement('span');
    dueSpan.className = 'task-due';
    dueSpan.textContent = new Date(task.due).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    meta.appendChild(dueSpan);
  }

  const listTag = document.createElement('span');
  listTag.className = 'task-list-name';
  listTag.textContent = task.listTitle;
  meta.appendChild(listTag);

  body.appendChild(meta);
  item.append(checkbox, body);
  return item;
}

async function completeTask(task, itemEl) {
  itemEl.classList.add('task-completing');
  try {
    await tasksApiFetch(`/lists/${task.listId}/tasks/${task.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    setTimeout(() => {
      const section = itemEl.closest('.tasks-section');
      itemEl.remove();
      if (section && !section.querySelector('.task-item')) section.remove();
    }, 380);
  } catch {
    itemEl.classList.remove('task-completing');
  }
}

function showTasksSignIn() {
  const container = document.getElementById('tasks-list');
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'tasks-signin';

  const msg = document.createElement('p');
  msg.textContent = 'Connect your Google account to see your tasks.';

  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.textContent = 'Sign in with Google';
  btn.addEventListener('click', async () => {
    btn.textContent = 'Signing in…';
    btn.disabled = true;
    try {
      await getAuthToken(true);
      await fetchAndRenderTasks();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Sign in with Google';
      container.innerHTML = `<div class="empty-state">Sign-in failed: ${err.message}</div>`;
    }
  });

  wrap.append(msg, btn);
  container.appendChild(wrap);
}

function initTasks() {
  document.getElementById('tasks-refresh-btn').addEventListener('click', () => {
    tasksLoaded = false;
    fetchAndRenderTasks();
  });
}

// ===== Toolbar =====

function initToolbar() {
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// ===== Panel navigation =====

function initPanels() {
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activePanel = tab.dataset.panel;
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${activePanel}`).classList.add('active');
      if (activePanel === 'recent') loadRecentTabs();
      if (activePanel === 'tasks')  loadGoogleTasks();
    });
  });
}

// ===== Bookmarks =====

function renderGroupTabs() {
  const container = document.getElementById('bookmark-group-tabs');
  container.innerHTML = '';
  bookmarkGroups.forEach((group, idx) => {
    const btn = document.createElement('button');
    btn.className = 'group-tab' + (idx === activeGroup ? ' active' : '');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = group.name;
    btn.appendChild(nameSpan);

    if (bookmarkGroups.length > 1) {
      const del = document.createElement('button');
      del.className = 'group-tab-delete';
      del.textContent = '×';
      del.title = 'Delete group';
      del.addEventListener('click', ev => { ev.stopPropagation(); deleteGroup(idx); });
      btn.appendChild(del);
    }

    btn.addEventListener('click', () => {
      activeGroup = idx;
      renderGroupTabs();
      renderBookmarks();
    });
    container.appendChild(btn);
  });
}

function renderBookmarks() {
  const grid  = document.getElementById('bookmarks-grid');
  const group = bookmarkGroups[activeGroup];
  grid.innerHTML = '';

  if (!group || group.bookmarks.length === 0) {
    grid.innerHTML = '<div class="empty-state">No bookmarks yet — add one below.</div>';
    return;
  }

  group.bookmarks.forEach((bm, idx) => {
    const a = document.createElement('a');
    a.className  = 'bookmark-card';
    a.href       = bm.url;
    a.title      = bm.url;
    a.target     = '_blank';
    a.rel        = 'noopener noreferrer';
    a.draggable  = true;

    // ---- Drag to reorder ----
    a.addEventListener('dragstart', e => {
      dragSrcIdx = idx;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', bm.url);
      setTimeout(() => a.classList.add('dragging'), 0);
    });

    a.addEventListener('dragend', () => {
      a.classList.remove('dragging');
      grid.querySelectorAll('.bookmark-card').forEach(c => c.classList.remove('drag-left', 'drag-right'));
    });

    a.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      grid.querySelectorAll('.bookmark-card').forEach(c => c.classList.remove('drag-left', 'drag-right'));
      const rect = a.getBoundingClientRect();
      a.classList.add(e.clientX < rect.left + rect.width / 2 ? 'drag-left' : 'drag-right');
    });

    a.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcIdx === idx) return;
      const bms = bookmarkGroups[activeGroup].bookmarks;
      const rect = a.getBoundingClientRect();
      const [moved] = bms.splice(dragSrcIdx, 1);
      let insertAt = e.clientX < rect.left + rect.width / 2 ? idx : idx + 1;
      if (dragSrcIdx < idx) insertAt--;
      bms.splice(insertAt, 0, moved);
      saveBookmarks();
      renderBookmarks();
    });

    const img = document.createElement('img');
    img.src   = faviconUrl(bm.url);
    img.alt   = '';
    img.addEventListener('error', () => { img.style.display = 'none'; });

    const span = document.createElement('span');
    span.className   = 'bookmark-card-title';
    span.textContent = bm.title || (() => { try { return new URL(bm.url).hostname.replace('www.',''); } catch { return bm.url; } })();

    const editBtn = document.createElement('button');
    editBtn.className   = 'bookmark-edit';
    editBtn.textContent = '✎';
    editBtn.title       = 'Edit';
    editBtn.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); openEditBookmark(bm.id); });

    const del = document.createElement('button');
    del.className   = 'bookmark-delete';
    del.textContent = '×';
    del.title       = 'Remove';
    del.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); deleteBookmark(bm.id); });

    a.append(img, span, editBtn, del);
    grid.appendChild(a);
  });
}

function deleteBookmark(id) {
  bookmarkGroups[activeGroup].bookmarks = bookmarkGroups[activeGroup].bookmarks.filter(b => b.id !== id);
  saveBookmarks();
  renderBookmarks();
}

function deleteGroup(idx) {
  if (!confirm(`Delete group "${bookmarkGroups[idx].name}" and all its bookmarks?`)) return;
  bookmarkGroups.splice(idx, 1);
  if (activeGroup >= bookmarkGroups.length) activeGroup = bookmarkGroups.length - 1;
  saveBookmarks();
  renderGroupTabs();
  renderBookmarks();
}

function openAddBookmark() {
  editingBookmarkId = null;
  document.querySelector('#modal-add-bookmark h2').textContent        = 'Add Bookmark';
  document.getElementById('confirm-bookmark').textContent             = 'Add';
  document.getElementById('bookmark-url').value                       = '';
  document.getElementById('bookmark-title').value                     = '';
  openModal('modal-add-bookmark');
  setTimeout(() => document.getElementById('bookmark-url').focus(), 40);
}

function openEditBookmark(id) {
  const bm = bookmarkGroups[activeGroup].bookmarks.find(b => b.id === id);
  if (!bm) return;
  editingBookmarkId = id;
  document.querySelector('#modal-add-bookmark h2').textContent        = 'Edit Bookmark';
  document.getElementById('confirm-bookmark').textContent             = 'Save';
  document.getElementById('bookmark-url').value                       = bm.url;
  document.getElementById('bookmark-title').value                     = bm.title;
  openModal('modal-add-bookmark');
  setTimeout(() => document.getElementById('bookmark-title').focus(), 40);
}

function initBookmarks() {
  document.getElementById('add-bookmark-btn').addEventListener('click', openAddBookmark);
  document.getElementById('add-group-btn').addEventListener('click',    () => openModal('modal-add-group'));

  document.getElementById('confirm-bookmark').addEventListener('click', () => {
    let url   = document.getElementById('bookmark-url').value.trim();
    const title = document.getElementById('bookmark-title').value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    if (editingBookmarkId) {
      const bm = bookmarkGroups[activeGroup].bookmarks.find(b => b.id === editingBookmarkId);
      if (bm) { bm.url = url; bm.title = title; }
    } else {
      bookmarkGroups[activeGroup].bookmarks.push({ id: uid(), url, title });
    }
    saveBookmarks();
    renderBookmarks();
    closeModal('modal-add-bookmark');
    editingBookmarkId = null;
  });

  document.getElementById('cancel-bookmark').addEventListener('click', () => {
    editingBookmarkId = null;
    closeModal('modal-add-bookmark');
  });

  // Enter key submits bookmark modal
  document.getElementById('bookmark-url').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('confirm-bookmark').click();
  });

  document.getElementById('confirm-group').addEventListener('click', () => {
    const name = document.getElementById('group-name').value.trim();
    if (!name) return;
    bookmarkGroups.push({ id: uid(), name, bookmarks: [] });
    activeGroup = bookmarkGroups.length - 1;
    saveBookmarks();
    renderGroupTabs();
    renderBookmarks();
    closeModal('modal-add-group');
    document.getElementById('group-name').value = '';
  });

  document.getElementById('cancel-group').addEventListener('click', () => closeModal('modal-add-group'));

  document.getElementById('group-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('confirm-group').click();
  });
}

// ===== Notes =====

function renderNotes() {
  const list = document.getElementById('notes-list');
  list.innerHTML = '';

  if (notes.length === 0) {
    list.innerHTML = '<div class="empty-state">No notes yet — create one below.</div>';
    return;
  }

  // Sort by last updated, newest first
  const sorted = [...notes].sort((a, b) => new Date(b.updated) - new Date(a.updated));
  sorted.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    const titleEl = document.createElement('div');
    titleEl.className   = 'note-card-title';
    titleEl.textContent = note.title || 'Untitled';

    const previewEl = document.createElement('div');
    previewEl.className   = 'note-card-preview';
    previewEl.textContent = note.content;

    const dateEl = document.createElement('div');
    dateEl.className   = 'note-card-date';
    dateEl.textContent = friendlyDate(note.updated);

    card.append(titleEl, previewEl, dateEl);
    card.addEventListener('click', () => openNoteEditor(note.id));
    list.appendChild(card);
  });
}

function openNoteEditor(noteId) {
  const note = noteId ? notes.find(n => n.id === noteId) : null;
  editingNoteId = noteId || null;
  document.getElementById('note-title-input').value   = note?.title   ?? '';
  document.getElementById('note-content-input').value = note?.content ?? '';
  document.getElementById('delete-note-btn').style.display = note ? 'block' : 'none';
  openModal('modal-note');
  setTimeout(() => {
    const el = document.getElementById(note ? 'note-content-input' : 'note-title-input');
    el.focus();
    if (note) el.setSelectionRange(el.value.length, el.value.length);
  }, 40);
}

function saveCurrentNote() {
  const title   = document.getElementById('note-title-input').value.trim();
  const content = document.getElementById('note-content-input').value;
  const now     = new Date().toISOString();
  if (editingNoteId) {
    const note = notes.find(n => n.id === editingNoteId);
    if (note) { note.title = title; note.content = content; note.updated = now; }
  } else {
    notes.unshift({ id: uid(), title, content, created: now, updated: now });
  }
  saveNotes();
  renderNotes();
  closeModal('modal-note');
}

function initNotes() {
  document.getElementById('add-note-btn').addEventListener('click', () => openNoteEditor(null));
  document.getElementById('save-note').addEventListener('click', saveCurrentNote);
  document.getElementById('cancel-note').addEventListener('click', () => closeModal('modal-note'));

  document.getElementById('delete-note-btn').addEventListener('click', () => {
    if (!editingNoteId || !confirm('Delete this note?')) return;
    notes = notes.filter(n => n.id !== editingNoteId);
    saveNotes();
    renderNotes();
    closeModal('modal-note');
  });

  // Ctrl+S saves note
  document.getElementById('note-content-input').addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveCurrentNote(); }
  });
}

// ===== Recent Tabs =====

async function loadRecentTabs() {
  const list = document.getElementById('recent-list');
  list.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
    list.innerHTML = '';
    const tabs = sessions
      .map(s => s.tab || s.window?.tabs?.[0])
      .filter(t => t && t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'));

    if (tabs.length === 0) {
      list.innerHTML = '<div class="empty-state">No recently closed tabs.</div>';
      return;
    }

    tabs.forEach(tab => {
      const a = document.createElement('a');
      a.className = 'recent-item';
      a.href   = tab.url;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';

      const img = document.createElement('img');
      img.src = faviconUrl(tab.url);
      img.alt = '';
      img.addEventListener('error', () => { img.style.display = 'none'; });

      const info = document.createElement('div');
      info.className = 'recent-item-info';
      const titleEl = document.createElement('div');
      titleEl.className   = 'recent-item-title';
      titleEl.textContent = tab.title || tab.url;

      const urlEl = document.createElement('div');
      urlEl.className   = 'recent-item-url';
      urlEl.textContent = tab.url;

      info.append(titleEl, urlEl);

      a.append(img, info);
      list.appendChild(a);
    });
  } catch (err) {
    list.innerHTML = '<div class="empty-state">Could not load recent tabs.</div>';
  }
}


// ===== Wallpaper =====

const BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US';
const NASA_API = 'https://api.nasa.gov/planetary/apod';

async function fetchNasaWallpaper(apiKey) {
  const key = encodeURIComponent(apiKey || 'DEMO_KEY');
  // APOD is sometimes a video; walk back up to 5 days to find a still image
  for (let daysBack = 0; daysBack < 5; daysBack++) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    const date = d.toISOString().slice(0, 10);
    const res  = await fetch(`${NASA_API}?api_key=${key}&date=${date}`);
    const data = await res.json();
    if (data.code >= 400) throw new Error(data.msg || `NASA API error ${data.code}`);
    if (data.error)       throw new Error(data.error.message || 'NASA API error');
    if (data.media_type === 'image') {
      return { url: data.hdurl || data.url, copyright: data.title || '' };
    }
    // media_type === 'video' — try the previous day
  }
  throw new Error('No APOD image found in the last 5 days');
}

async function loadWallpaper(settings) {
  const today = new Date().toISOString().slice(0, 10);
  const src   = settings.wallpaperSource;
  const bg    = document.getElementById('wallpaper-bg');

  if (src === 'solid') {
    bg.style.backgroundImage = '';
    bg.style.backgroundColor = settings.solidColor;
    return;
  }

  if (src === 'custom') {
    try {
      const parsed = new URL(settings.customWallpaperUrl);
      if (!['https:', 'http:'].includes(parsed.protocol)) return;
      applyWallpaper(parsed.href, '');
    } catch {}
    return;
  }

  const { wpCache } = await chrome.storage.local.get('wpCache');
  if (wpCache && wpCache.date === today && wpCache.source === src) {
    applyWallpaper(wpCache.url, wpCache.copyright);
    return;
  }

  try {
    let url, copyright;
    if (src === 'nasa') {
      const r = await fetchNasaWallpaper(settings.nasaApiKey || 'DEMO_KEY');
      url = r.url; copyright = r.copyright;
    } else {
      const res  = await fetch(BING_API);
      const data = await res.json();
      const img  = data.images[0];
      url = `https://www.bing.com${img.urlbase}_1920x1080.jpg`;
      copyright = img.copyright;
    }
    chrome.storage.local.set({ wpCache: { date: today, url, copyright, source: src } });
    applyWallpaper(url, copyright);
  } catch (err) {
    if (src === 'nasa') {
      document.getElementById('wallpaper-credit').textContent =
        `NASA image unavailable: ${err.message}`;
    }
  }
}

function applyWallpaper(url, copyright) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return;
    document.getElementById('wallpaper-bg').style.backgroundImage = `url(${JSON.stringify(parsed.href)})`;
  } catch { return; }
  if (copyright) {
    document.getElementById('wallpaper-credit').textContent = copyright;
  }
}

// ===== Modal helpers =====

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
}

function initModals() {
  document.getElementById('modal-backdrop').addEventListener('click', closeAllModals);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('modal-backdrop').classList.add('hidden');
}

// ===== Init =====

async function init() {
  const settings = await loadSettings();
  applySettings(settings);

  const { clockMode: ck, weatherMode: wm } = await chrome.storage.local.get(['clockMode', 'weatherMode']);
  clockMode   = ck  === 'word'  ? 'word'  : 'numeric';
  weatherMode = wm  === 'tfw'   ? 'tfw'   : 'normal';

  updateClock();
  setInterval(updateClock, 1000);

  await loadData();

  initSearch();
  initBangHelp();
  initPanels();
  initBookmarks();
  initNotes();
  initModals();
  initIntention();
  initHistory();
  initAmbient();
  initToolbar();
  initClockModeBtn();
  initWeatherToggle();
  initTasks();
  initQuotes();

  renderGroupTabs();
  renderBookmarks();
  renderNotes();

  loadWeather();
  loadWallpaper(settings);
  loadIntention();
  loadHistory();
  loadQuotes(settings.quoteCategory);
}

init();
