(async () => {
  'use strict';

  const search = document.getElementById('search');
  const genre = document.getElementById('genre');
  const reset = document.getElementById('reset');
  const articles = [
    ...document.querySelectorAll('#stories article')
  ];
  const empty = document.getElementById('empty');

  const activeFilters = document.getElementById('active-filters');
  const activeTagButton = document.getElementById('active-tag');

  let activeTag = '';
  let indexPromise;
  let revision = 0;
  const grid = document.getElementById('stories');
  const searchStatus = document.getElementById('search-status');
  const normalize = value => value.normalize('NFC').toLocaleLowerCase('de');
  const decodeText = value => {
    const field = document.createElement('textarea');
    field.innerHTML = value;
    return field.value.replace(/\s+/g, ' ').trim();
  };

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(grid.dataset.searchIndex)
        .then(response => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.json();
        })
        .then(entries => {
          const index = new Map(entries.map(entry => [entry.url, decodeText(entry.content)]));
          if (articles.some(article => !index.has(article.dataset.url))) {
            throw new Error('Incomplete search index');
          }
          return index;
        })
        .catch(error => { indexPromise = null; throw error; });
    }
    return indexPromise;
  }

  function excerpt(text, terms) {
    const normalized = normalize(text);
    const matches = terms.map(term => ({ position: normalized.indexOf(term), length: term.length }))
      .filter(match => match.position >= 0);
    if (!matches.length) return '';
    const first = Math.min(...matches.map(match => match.position));
    const matchLength = Math.max(...matches.filter(match => match.position === first).map(match => match.length));
    let start = Math.max(0, first - 30);
    if (start) {
      const boundary = text.indexOf(' ', start);
      if (boundary >= 0 && boundary < first) start = boundary + 1;
    }
    const end = Math.min(text.length, start + Math.max(110, first - start + matchLength));
    return (start ? '… ' : '') + text.slice(start, end).trim() + (end < text.length ? ' …' : '');
  }

  function highlightExcerpt(preview, text, terms) {
    preview.replaceChildren();
    if (!text) return;
    const content = text.normalize('NFC');
    const escapedTerms = [...new Set(terms)]
      .sort((a, b) => b.length - a.length)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(escapedTerms.join('|'), 'giu');
    const fragment = document.createDocumentFragment();
    let position = 0;
    for (const match of content.matchAll(pattern)) {
      fragment.appendChild(document.createTextNode(content.slice(position, match.index)));
      const highlight = document.createElement('mark');
      highlight.textContent = match[0];
      fragment.appendChild(highlight);
      position = match.index + match[0].length;
    }
    fragment.appendChild(document.createTextNode(content.slice(position)));
    preview.appendChild(fragment);
  }

  const filterKeys = ['q', 'genre', 'tag'];

  function restoreFiltersFromUrl() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const params = filterKeys.some(key => fragment.has(key))
      ? fragment : new URLSearchParams(window.location.search);
    search.value = params.get('q') || '';
    genre.value = params.get('genre') || '';
    activeTag = params.get('tag') || '';
  }

  function syncFiltersToUrl(mode = 'push') {
    const url = new URL(window.location.href);
    const fragment = new URLSearchParams();
    const values = { q: search.value.trim(), genre: genre.value, tag: activeTag };
    Object.entries(values).forEach(([key, value]) => {
      url.searchParams.delete(key);
      if (value) fragment.set(key, value);
    });
    const previousFragment = new URLSearchParams(url.hash.slice(1));
    if (fragment.size || filterKeys.some(key => previousFragment.has(key))) {
      url.hash = fragment.toString();
    }
    if (url.href !== window.location.href) {
      window.history[mode + 'State'](null, '', url.pathname + url.search + url.hash);
    }
    lastRestoredUrl = window.location.href;
  }

  async function filterStories() {
    const currentRevision = ++revision;
    const query = normalize(search.value).trim();
    const terms = query.split(/\s+/).filter(Boolean);
    let index = new Map();
    let failed = false;
    if (terms.length) {
      searchStatus.textContent = 'Texte werden durchsucht …';
      grid.setAttribute('aria-busy', 'true');
      try { index = await loadIndex(); }
      catch (error) { failed = true; }
    }
    if (currentRevision !== revision) return;
    grid.removeAttribute('aria-busy');
    let visible = 0;
    const results = articles.map((article, order) => {
      const title = normalize(article.dataset.title);
      const storyGenre = article.dataset.genre;
      const tags = article.dataset.tags.split(',');
      const metadata = normalize([title, storyGenre, article.dataset.description || '', ...tags].join(' '));
      const content = index.get(article.dataset.url) || '';
      const fullText = metadata + ' ' + normalize(content);
      const matchesSearch = terms.every(term => fullText.includes(term));
      const show = matchesSearch && (!genre.value || storyGenre === genre.value) &&
        (!activeTag || tags.includes(activeTag));
      article.hidden = !show;
      const preview = article.querySelector('.search-excerpt');
      highlightExcerpt(preview, show && terms.length ? excerpt(content, terms) : '', terms);
      preview.hidden = !preview.textContent;
      if (show) visible++;
      const score = terms.reduce((sum, term) => sum + (title.includes(term) ? 10 : metadata.includes(term) ? 3 : 1), 0);
      return {article, order, score};
    });
    results.sort((a, b) => terms.length ? b.score - a.score || a.order - b.order : a.order - b.order);
    const focusedElement = document.activeElement;
    results.forEach(result => grid.appendChild(result.article));
    if (focusedElement && grid.contains(focusedElement)) focusedElement.focus();
    empty.hidden = visible > 0;
    searchStatus.textContent = failed
      ? 'Die Volltextsuche ist gerade nicht verfügbar. Es werden nur Titel, Beschreibungen und Schlagwörter durchsucht. Bitte erneut suchen.'
      : visible + (visible === 1 ? ' Text gefunden.' : ' Texte gefunden.');

    // Aktiven Tag anzeigen
    activeFilters.hidden = !activeTag;
    activeTagButton.textContent =
      activeTag ? `#${activeTag} ×` : '';

    // Gewählten Tag optisch hervorheben
    document.querySelectorAll('.tag').forEach(button => {
      const selected = button.dataset.filterTag === activeTag;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  // Suchfeld
  search.addEventListener('input', () => {
    syncFiltersToUrl('replace');
    filterStories();
  });

  // Genre-Auswahl
  genre.addEventListener('change', () => {
    syncFiltersToUrl();
    filterStories();
  });

  // Tags anklicken
  document.querySelectorAll('.tag').forEach(button => {
    button.addEventListener('click', () => {
      const clickedTag = button.dataset.filterTag;

      activeTag = activeTag === clickedTag
        ? ''
        : clickedTag;

      syncFiltersToUrl();
      filterStories();
    });
  });

  // Einzelnen Tag-Filter entfernen
  activeTagButton.addEventListener('click', () => {
    activeTag = '';
    search.focus();
    syncFiltersToUrl();
    filterStories();
  });

  // Alle Filter zurücksetzen
  reset.addEventListener('click', () => {
    search.value = '';
    genre.value = '';
    activeTag = '';
    syncFiltersToUrl();
    filterStories();
  });

  // Support browser history, pasted fragments and legacy query links.
  let lastRestoredUrl;
  function restoreAndFilter() {
    if (lastRestoredUrl === window.location.href) return;
    restoreFiltersFromUrl();
    syncFiltersToUrl('replace');
    lastRestoredUrl = window.location.href;
    return filterStories();
  }
  window.addEventListener('popstate', restoreAndFilter);
  window.addEventListener('hashchange', restoreAndFilter);

  // Move to page landmarks without replacing the fragment that stores filters.
  document.querySelectorAll('.skip[href="#inhalt"], .back-to-top[href="#seitenanfang"]')
    .forEach(link => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      link.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.scrollIntoView();
      });
    });

  // Reveal interactive filters only after the initial results are ready.
  try {
    await restoreAndFilter();
    document.querySelector('.story-filters').hidden = false;
    document.querySelectorAll('#stories .story-tags').forEach(tags => { tags.hidden = false; });
    searchStatus.hidden = false;
  } catch (error) {
    // Keep the static overview usable if initialization fails partway through.
    articles.forEach(article => { article.hidden = false; });
    activeFilters.hidden = true;
    empty.hidden = true;
    grid.removeAttribute('aria-busy');
    console.error('Story filters could not be initialized.', error);
  }
})();
