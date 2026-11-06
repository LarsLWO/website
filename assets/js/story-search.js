(() => {
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
    const positions = terms.map(term => normalized.indexOf(term)).filter(position => position >= 0);
    if (!positions.length) return '';
    const first = Math.min(...positions);
    let start = Math.max(0, first - 65);
    if (start) {
      const boundary = text.indexOf(' ', start);
      if (boundary >= 0 && boundary < first) start = boundary + 1;
    }
    const end = Math.min(text.length, start + Math.max(210, first - start + terms[0].length));
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

  function restoreFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    search.value = params.get('q') || '';
    genre.value = params.get('genre') || '';
    activeTag = params.get('tag') || '';
  }

  function syncFiltersToUrl(mode = 'push') {
    const url = new URL(window.location.href);
    const values = { q: search.value.trim(), genre: genre.value, tag: activeTag };
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    if (url.href !== window.location.href) {
      window.history[mode + 'State'](null, '', url.pathname + url.search + url.hash);
    }
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

  // Browser navigation restores the filter state shown in the address.
  window.addEventListener('popstate', () => {
    restoreFiltersFromUrl();
    filterStories();
  });

  // Initiale Anzeige
  restoreFiltersFromUrl();
  filterStories();

})();
