const API = 'https://api.tvmaze.com';
const form = document.querySelector('#search-form');
const input = document.querySelector('#show-search');
const resultsList = document.querySelector('#search-results');
const hint = document.querySelector('#search-hint');
const notice = document.querySelector('#notice');
const showPanel = document.querySelector('#show-panel');
const summary = document.querySelector('#show-summary');
const episodeList = document.querySelector('#episode-list');
const episodeCount = document.querySelector('#episode-count');
const seasonFilter = document.querySelector('#season-filter');

let matches = [];
let activeIndex = -1;
let debounceTimer;
let searchController;
let episodeController;
let lastEpisodes = [];

function setNotice(message = '', kind = '') {
  notice.textContent = message;
  notice.className = `notice ${kind}`.trim();
  notice.hidden = !message;
}

function cleanText(html = '') {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

function yearOf(show) {
  const start = show.premiered?.slice(0, 4) || 'Year unknown';
  const end = show.ended?.slice(0, 4) || (show.status === 'Running' ? 'Present' : '');
  return end ? `${start}–${end}` : start;
}

function imageUrl(image) {
  return image?.medium || image?.original || '';
}

function openResults() {
  resultsList.hidden = matches.length === 0;
  input.setAttribute('aria-expanded', String(!resultsList.hidden));
}

function renderResults() {
  resultsList.replaceChildren();
  matches.slice(0, 7).forEach((match, index) => {
    const show = match.show;
    const item = document.createElement('li');
    item.setAttribute('role', 'option');
    item.id = `show-option-${index}`;
    item.setAttribute('aria-selected', String(index === activeIndex));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';
    const src = imageUrl(show.image);
    if (src) {
      const image = document.createElement('img');
      image.className = 'result-image';
      image.src = src;
      image.alt = '';
      image.loading = 'lazy';
      button.append(image);
    } else {
      const empty = document.createElement('span');
      empty.className = 'result-image empty';
      empty.textContent = 'NO ART';
      button.append(empty);
    }
    const copy = document.createElement('span');
    copy.className = 'result-copy';
    const name = document.createElement('span');
    name.className = 'result-name';
    name.textContent = show.name;
    const meta = document.createElement('span');
    meta.className = 'result-meta';
    meta.textContent = `${yearOf(show)}  ·  ${show.network?.name || show.webChannel?.name || 'Network unknown'}  ·  TVMAZE ID ${show.id}`;
    copy.append(name, meta);
    const arrow = document.createElement('span');
    arrow.className = 'result-arrow';
    arrow.textContent = '↗';
    button.append(copy, arrow);
    button.addEventListener('click', () => loadShow(show.id));
    item.append(button);
    resultsList.append(item);
  });
  openResults();
}

async function searchShows(query) {
  searchController?.abort();
  searchController = new AbortController();
  const controller = searchController;
  setNotice('Searching the TVmaze catalogue…', 'loading');
  try {
    const response = await fetch(`${API}/search/shows?q=${encodeURIComponent(query)}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`TVmaze returned ${response.status}.`);
    matches = await response.json();
    activeIndex = matches.length ? 0 : -1;
    renderResults();
    setNotice(matches.length ? '' : `No matches for “${query}”. Try another title.`);
    hint.textContent = matches.length ? `${matches.length} matching shows. Choose the correct version; names can refer to different shows.` : 'Try a shorter or alternate title.';
  } catch (error) {
    if (error.name === 'AbortError') return;
    matches = [];
    renderResults();
    setNotice('The show search could not be loaded. Check your connection and try again.', 'error');
  }
}

function renderShow(show) {
  summary.replaceChildren();
  const posterUrl = imageUrl(show.image);
  if (posterUrl) {
    const poster = document.createElement('img');
    poster.className = 'poster';
    poster.src = posterUrl;
    poster.alt = `${show.name} poster`;
    summary.append(poster);
  } else {
    const poster = document.createElement('div');
    poster.className = 'poster empty';
    poster.textContent = 'NO POSTER';
    summary.append(poster);
  }
  const info = document.createElement('div');
  info.className = 'show-info';
  const label = document.createElement('p');
  label.className = 'eyebrow';
  label.textContent = `TVMAZE SHOW ID  ${show.id}`;
  const title = document.createElement('h2');
  title.textContent = show.name;
  const meta = document.createElement('div');
  meta.className = 'show-meta';
  [yearOf(show), show.network?.name || show.webChannel?.name, show.genres?.slice(0, 2).join(' / '), show.status].filter(Boolean).forEach(text => {
    const span = document.createElement('span');
    span.textContent = text;
    meta.append(span);
  });
  const description = document.createElement('p');
  description.className = 'show-summary-text';
  description.textContent = cleanText(show.summary) || 'No show description is available.';
  const link = document.createElement('a');
  link.className = 'tvmaze-link';
  link.href = show.url || `https://www.tvmaze.com/shows/${show.id}`;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = 'MORE ON TVMAZE ↗';
  info.append(label, title, meta, description, link);
  summary.append(info);
}

function renderEpisodes() {
  const season = seasonFilter.value;
  const visible = lastEpisodes.filter(episode => season === 'all' || String(episode.season) === season);
  episodeCount.textContent = `${visible.length}`;
  episodeList.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'notice';
    empty.textContent = 'No episodes are listed for this season yet.';
    episodeList.append(empty);
    return;
  }
  visible.forEach(episode => {
    const card = document.createElement('article');
    card.className = 'episode-card';
    const number = document.createElement('div');
    number.className = 'episode-number';
    number.textContent = `S${String(episode.season).padStart(2, '0')} · E${String(episode.number ?? '—').padStart(2, '0')}`;
    const main = document.createElement('div');
    main.className = 'episode-main';
    const title = document.createElement('h3');
    title.textContent = episode.name || 'Untitled episode';
    const description = document.createElement('p');
    description.textContent = cleanText(episode.summary) || 'No episode description is available.';
    main.append(title, description);
    const date = document.createElement('div');
    date.className = 'episode-date';
    date.textContent = episode.airdate ? new Date(`${episode.airdate}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Air date unknown';
    const runtime = document.createElement('span');
    runtime.className = 'episode-runtime';
    runtime.textContent = episode.runtime ? `${episode.runtime} min` : '';
    date.append(runtime);
    card.append(number, main, date);
    episodeList.append(card);
  });
}

async function loadShow(showId) {
  searchController?.abort();
  episodeController?.abort();
  episodeController = new AbortController();
  const controller = episodeController;
  matches = [];
  resultsList.replaceChildren();
  openResults();
  showPanel.hidden = false;
  setNotice('Loading the selected show and its episode guide…', 'loading');
  episodeList.replaceChildren();
  try {
    const [showResponse, episodesResponse] = await Promise.all([
      fetch(`${API}/shows/${encodeURIComponent(showId)}`, { signal: controller.signal }),
      fetch(`${API}/shows/${encodeURIComponent(showId)}/episodes`, { signal: controller.signal })
    ]);
    if (!showResponse.ok || !episodesResponse.ok) throw new Error('TVmaze could not return this show right now.');
    const [show, episodes] = await Promise.all([showResponse.json(), episodesResponse.json()]);
    renderShow(show);
    lastEpisodes = episodes;
    const seasons = [...new Set(episodes.map(episode => episode.season))].sort((a, b) => a - b);
    seasonFilter.replaceChildren(new Option('All seasons', 'all'));
    seasons.forEach(season => seasonFilter.add(new Option(`Season ${season}`, String(season))));
    seasonFilter.value = 'all';
    renderEpisodes();
    setNotice('');
    showPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    if (error.name === 'AbortError') return;
    setNotice('The episode guide could not be loaded. Please try again in a moment.', 'error');
  }
}

input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  searchController?.abort();
  episodeController?.abort();
  showPanel.hidden = true;
  matches = [];
  activeIndex = -1;
  resultsList.replaceChildren();
  openResults();
  const query = input.value.trim();
  if (query.length < 2) {
    setNotice('');
    hint.textContent = 'Type at least 2 letters. Use ↑ ↓ to choose a result, then press Enter.';
    return;
  }
  debounceTimer = setTimeout(() => searchShows(query), 300);
});

input.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown' && matches.length) {
    event.preventDefault();
    activeIndex = (activeIndex + 1) % Math.min(matches.length, 7);
    renderResults();
    document.querySelector(`#show-option-${activeIndex} button`)?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'ArrowUp' && matches.length) {
    event.preventDefault();
    activeIndex = (activeIndex - 1 + Math.min(matches.length, 7)) % Math.min(matches.length, 7);
    renderResults();
    document.querySelector(`#show-option-${activeIndex} button`)?.scrollIntoView({ block: 'nearest' });
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (matches.length && activeIndex >= 0) loadShow(matches[activeIndex].show.id);
    else if (input.value.trim().length >= 2) {
      clearTimeout(debounceTimer);
      searchShows(input.value.trim());
    }
  } else if (event.key === 'Escape') {
    resultsList.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  }
});

form.addEventListener('submit', event => event.preventDefault());
seasonFilter.addEventListener('change', renderEpisodes);
document.addEventListener('click', event => {
  if (!form.contains(event.target)) {
    resultsList.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  }
});
