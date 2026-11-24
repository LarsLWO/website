(() => {
  'use strict';

  const websiteId = document.currentScript?.dataset.websiteId;
  const storageKey = 'umami-consent';
  const prompt = document.querySelector('[data-analytics-consent]');
  const promptStatus = prompt?.querySelector('[role="status"]');
  const controls = document.querySelector('[data-analytics-preference]');
  const manageButton = controls?.querySelector('button');
  const status = controls?.querySelector('[role="status"]');
  const settingsLink = document.querySelector('[data-open-analytics-settings]');
  let choice = null;
  let storageAvailable = true;
  let storageWriteFailed = false;
  let trackerLoaded = false;

  function readPreference() {
    if (storageWriteFailed) {
      choice = 'rejected';
      storageAvailable = false;
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      choice = stored === 'accepted' || stored === 'rejected' ? stored : null;
      storageAvailable = true;
    } catch {
      // If the preference cannot be read, do not start analytics.
      choice = 'rejected';
      storageAvailable = false;
    }
  }

  // Also guards custom events and already open tabs after consent is withdrawn.
  window.umamiBeforeSend = (_type, payload) => {
    readPreference();
    return websiteId && choice === 'accepted' ? payload : false;
  };

  function loadTracker() {
    if (!websiteId || choice !== 'accepted' || trackerLoaded) return;
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
    if (prompt) {
      prompt.hidden = choice !== null || !websiteId;
      if (promptStatus) promptStatus.textContent = message || 'Dürfen anonyme Nutzungsstatistiken erfasst werden? Dabei werden technische Daten wie deine IP-Adresse verarbeitet.';
    }
    if (controls) {
      controls.hidden = choice === null || !websiteId;
      manageButton.disabled = !websiteId;
      manageButton.textContent = choice === 'accepted' ? 'Statistik widerrufen' : 'Statistik später erlauben';
    }
    if (status) status.textContent = message || (!websiteId
      ? 'Die statistische Auswertung ist auf dieser Website ausgeschaltet.'
      : !storageAvailable
        ? 'Deine Auswahl konnte nicht gespeichert werden. Die Statistik bleibt vorsorglich ausgeschaltet.'
        : choice === 'accepted'
          ? 'Du hast der Statistik zugestimmt. Du kannst deine Zustimmung hier jederzeit widerrufen.'
          : 'Du hast die Statistik abgelehnt. Du kannst sie hier später erlauben.');
  }

  function saveChoice(nextChoice) {
    try {
      window.localStorage.setItem(storageKey, nextChoice);
    } catch {
      choice = 'rejected';
      storageAvailable = false;
      storageWriteFailed = true;
      render('Deine Auswahl konnte nicht gespeichert werden. Umami bleibt ausgeschaltet. Bitte erlaube den Website-Speicher und versuche es erneut.');
      return;
    }
    storageWriteFailed = false;
    readPreference();
    render();
    loadTracker();
  }

  prompt?.querySelector('[data-consent-accept]')?.addEventListener('click', () => saveChoice('accepted'));
  prompt?.querySelector('[data-consent-reject]')?.addEventListener('click', () => saveChoice('rejected'));
  manageButton?.addEventListener('click', () => {
    if (choice === 'accepted') saveChoice('rejected');
    else {
      choice = null;
      try { window.localStorage.removeItem(storageKey); } catch { storageAvailable = false; }
      render();
    }
  });
  settingsLink?.addEventListener('click', () => {
    if (choice === 'accepted') saveChoice('rejected');
    else {
      try { window.localStorage.removeItem(storageKey); } catch { storageAvailable = false; }
      choice = null;
      render();
      prompt?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  function syncPreference() {
    readPreference();
    render();
    if (settingsLink) settingsLink.hidden = !websiteId || choice === null;
    loadTracker();
  }

  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) syncPreference();
  });
  window.addEventListener('pageshow', syncPreference);
  syncPreference();
})();
