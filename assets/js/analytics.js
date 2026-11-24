(() => {
  'use strict';

  const websiteId = document.currentScript?.dataset.websiteId;
  const storageKey = 'umami.disabled';
  const controls = document.querySelector('[data-analytics-preference]');
  const button = controls?.querySelector('button');
  const status = controls?.querySelector('[role="status"]');
  let disabled = true;
  let storageAvailable = true;
  let storageWriteFailed = false;
  let trackerLoaded = false;

  function readPreference() {
    if (storageWriteFailed) {
      disabled = true;
      storageAvailable = false;
      return;
    }
    try {
      disabled = Boolean(window.localStorage.getItem(storageKey));
      storageAvailable = true;
    } catch {
      // If the preference cannot be read, do not start analytics.
      disabled = true;
      storageAvailable = false;
    }
  }

  // Also guards custom events and already open tabs after an opt-out.
  window.umamiBeforeSend = (_type, payload) => {
    readPreference();
    return websiteId && !disabled ? payload : false;
  };

  function loadTracker() {
    if (!websiteId || disabled || trackerLoaded) return;
    trackerLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://cloud.umami.is/script.js';
    script.defer = true;
    script.dataset.websiteId = websiteId;
    script.dataset.excludeSearch = 'true';
    script.dataset.excludeHash = 'true';
    script.dataset.beforeSend = 'umamiBeforeSend';
    document.head.appendChild(script);
  }

  function render(message) {
    if (!controls) return;
    controls.hidden = false;
    button.disabled = !websiteId;
    button.textContent = disabled ? 'Statistik wieder zulassen' : 'Statistik deaktivieren';
    status.textContent = message || (!websiteId
      ? 'Die statistische Auswertung ist auf dieser Website ausgeschaltet.'
      : !storageAvailable
        ? 'Der Browser-Speicher ist nicht zugänglich. Die Statistik bleibt auf dieser Seite deaktiviert. Deine Einstellung kann nicht dauerhaft gespeichert werden.'
        : disabled
          ? 'Die statistische Auswertung ist für diesen Browser deaktiviert.'
          : 'Die statistische Auswertung ist zugelassen. Browser-Erweiterungen können sie zusätzlich blockieren.');
  }

  button?.addEventListener('click', () => {
    const nextDisabled = !disabled;
    try {
      if (nextDisabled) window.localStorage.setItem(storageKey, '1');
      else window.localStorage.removeItem(storageKey);
    } catch {
      disabled = true;
      storageAvailable = false;
      // Keep the current page disabled even if a write fails but reads still work.
      storageWriteFailed = true;
      render('Die Einstellung konnte nicht gespeichert werden. Die Statistik bleibt auf dieser Seite deaktiviert. Bitte erlaube den Website-Speicher und lade die Seite neu, um deine Auswahl dauerhaft zu speichern.');
      return;
    }
    storageWriteFailed = false;
    readPreference();
    render();
    loadTracker();
  });

  function syncPreference() {
    readPreference();
    render();
    loadTracker();
  }

  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) syncPreference();
  });
  window.addEventListener('pageshow', syncPreference);
  syncPreference();
})();
