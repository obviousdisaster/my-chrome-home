'use strict';

const DEFAULT_SETTINGS = {
  accentColor:        '#58a6ff',
  layoutWidth:        'boxed',
  quoteCategory:      'All',
  showQuotes:         true,
  wallpaperSource:    'bing',
  solidColor:         '#0d1117',
  customWallpaperUrl: '',
  nasaApiKey:         '',
  showClock:          true,
  showDate:           true,
  showGreeting:       true,
  showWeather:        true,
  showIntention:      true,
  showHistory:        true,
  showSounds:         true,
  showCredit:         true,
};

const EL = id => document.getElementById(id);

async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  return Object.assign({}, DEFAULT_SETTINGS, settings);
}

async function saveSettings(next) {
  const prev = await loadSettings();
  if (prev.wallpaperSource !== next.wallpaperSource) {
    chrome.storage.local.remove('wpCache');
  }
  try {
    await chrome.storage.sync.set({ settings: next });
    showSaved();
  } catch (err) {
    showSaved(err.message?.includes('QUOTA') ? 'Sync quota exceeded — settings saved locally only' : `Save failed: ${err.message}`);
    chrome.storage.local.set({ settings: next });
  }
}

function showSaved(msg = 'Saved') {
  const el = EL('save-status');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function collect() {
  return {
    accentColor:        EL('opt-accent').value,
    layoutWidth:        EL('opt-layout-width').value,
    quoteCategory:      EL('opt-quote-category').value,
    showQuotes:         EL('opt-show-quotes').checked,
    wallpaperSource:    EL('opt-wallpaper-source').value,
    solidColor:         EL('opt-solid-color').value,
    customWallpaperUrl: EL('opt-custom-url').value.trim(),
    nasaApiKey:         EL('opt-nasa-key').value.trim(),
    showClock:          EL('opt-show-clock').checked,
    showDate:           EL('opt-show-date').checked,
    showGreeting:       EL('opt-show-greeting').checked,
    showWeather:        EL('opt-show-weather').checked,
    showIntention:      EL('opt-show-intention').checked,
    showHistory:        EL('opt-show-history').checked,
    showSounds:         EL('opt-show-sounds').checked,
    showCredit:         EL('opt-show-credit').checked,
  };
}

function populate(s) {
  EL('opt-accent').value            = s.accentColor;
  EL('opt-layout-width').value      = s.layoutWidth;
  EL('opt-quote-category').value    = s.quoteCategory;
  EL('opt-show-quotes').checked     = s.showQuotes;
  EL('opt-wallpaper-source').value  = s.wallpaperSource;
  EL('opt-solid-color').value       = s.solidColor;
  EL('opt-custom-url').value        = s.customWallpaperUrl;
  EL('opt-nasa-key').value          = s.nasaApiKey;
  EL('opt-show-clock').checked      = s.showClock;
  EL('opt-show-date').checked       = s.showDate;
  EL('opt-show-greeting').checked   = s.showGreeting;
  EL('opt-show-weather').checked    = s.showWeather;
  EL('opt-show-intention').checked  = s.showIntention;
  EL('opt-show-history').checked    = s.showHistory;
  EL('opt-show-sounds').checked     = s.showSounds;
  EL('opt-show-credit').checked     = s.showCredit;
  updateSourceRows(s.wallpaperSource);
  applyAccentPreview(s.accentColor);
}

function updateSourceRows(src) {
  EL('opt-nasa-row').classList.toggle('hidden',   src !== 'nasa');
  EL('opt-solid-row').classList.toggle('hidden',  src !== 'solid');
  EL('opt-custom-row').classList.toggle('hidden', src !== 'custom');
}

function applyAccentPreview(color) {
  document.documentElement.style.setProperty('--accent', color);
}

async function init() {
  const s = await loadSettings();
  populate(s);

  EL('opt-accent').addEventListener('input', () => {
    applyAccentPreview(EL('opt-accent').value);
    saveSettings(collect());
  });

  EL('opt-wallpaper-source').addEventListener('change', () => {
    updateSourceRows(EL('opt-wallpaper-source').value);
    saveSettings(collect());
  });

  const autoSave = () => saveSettings(collect());

  [
    'opt-layout-width', 'opt-quote-category',
    'opt-solid-color', 'opt-custom-url', 'opt-nasa-key',
    'opt-show-clock',  'opt-show-date',   'opt-show-greeting',
    'opt-show-weather','opt-show-intention','opt-show-history',
    'opt-show-quotes', 'opt-show-sounds', 'opt-show-credit',
  ].forEach(id => EL(id).addEventListener('change', autoSave));
}

init();
