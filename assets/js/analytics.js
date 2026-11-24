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
  const dialogLinks = document.querySelectorAll('[data-open-analytics-dialog]');
  const receipt = document.querySelector('[data-analytics-receipt]');
  const consentVersion = '2026-11-24-2';
  let choice = null;
  let receiptTimestamp = null;
  let receiptVersion = null;
  let promptOpen = false;
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
      let record = null;
      try { record = stored ? JSON.parse(stored) : null; } catch { record = null; }
      if (record && (record.choice === 'accepted' || record.choice === 'rejected')) {
        choice = record.choice;
        receiptTimestamp = record.timestamp || null;
        receiptVersion = record.version || null;
      } else if (stored === 'accepted' || stored === 'rejected') {
        // Preserve an older choice without inventing a timestamp or text version.
        choice = stored;
        receiptTimestamp = null;
        receiptVersion = null;
      } else {
        choice = null;
        receiptTimestamp = null;
        receiptVersion = null;
      }
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
      prompt.hidden = (choice !== null && !promptOpen) || !websiteId;
      if (promptStatus && message) promptStatus.textContent = message;
    }
    if (controls) {
      controls.hidden = choice === null || !websiteId;
      manageButton.disabled = !websiteId;
      manageButton.textContent = choice === 'accepted' ? 'Statistik widerrufen' : 'Statistik später erlauben';
    }
    if (settingsLink) settingsLink.hidden = !websiteId || choice === null;
    if (receipt) {
      const decision = receipt.querySelector('[data-receipt-decision]');
      const date = receipt.querySelector('[data-receipt-date]');
      const version = receipt.querySelector('[data-receipt-version]');
      receipt.hidden = choice === null;
      if (decision) decision.textContent = !storageAvailable ? 'Keine gespeicherte Auswahl (Browser-Speicher nicht verfügbar)' : choice === 'accepted' ? 'Zugestimmt' : choice === 'rejected' ? 'Abgelehnt' : 'Noch keine Auswahl';
      if (date) date.textContent = receiptTimestamp ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(receiptTimestamp)) : 'Für diese ältere Auswahl nicht gespeichert';
      if (version) version.textContent = receiptVersion || 'Für diese ältere Auswahl nicht gespeichert';
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
      const timestamp = new Date().toISOString();
      window.localStorage.setItem(storageKey, JSON.stringify({ choice: nextChoice, timestamp, version: consentVersion }));
      receiptTimestamp = timestamp;
      receiptVersion = consentVersion;
    } catch {
      choice = 'rejected';
      storageAvailable = false;
      storageWriteFailed = true;
      render('Deine Auswahl konnte nicht gespeichert werden. Umami bleibt ausgeschaltet. Bitte erlaube den Website-Speicher und versuche es erneut.');
      return;
    }
    storageWriteFailed = false;
    promptOpen = false;
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
  settingsLink?.addEventListener('click', event => {
    event.preventDefault();
    promptOpen = true;
    render();
    prompt?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  dialogLinks.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    promptOpen = true;
    render();
    prompt?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));

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
