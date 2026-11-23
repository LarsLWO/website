
(() => {
  'use strict';

  // Song-Info-Dialog
  const dialog = document.getElementById('song-info');
  const trigger = document.querySelector('[data-song-info-open]');

  if (dialog && trigger && typeof dialog.showModal === 'function') {
    trigger.hidden = false;

    trigger.addEventListener('click', () => dialog.showModal());

    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;

      const bounds = dialog.getBoundingClientRect();

      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) {
        dialog.close();
      }
    });
  }

  // Umami: Audioplayer-Tracking
  const audio = document.querySelector('.song-player audio');
  if (!audio) return;

  const song = document.querySelector('h1')?.textContent.trim() || 'Unbekannter Song';
  const milestones = [25, 50, 75];
  const reached = new Set();

  function trackEvent(eventName, properties = {}) {
    if (typeof window.umami?.track !== 'function') return;

    window.umami.track(eventName, {
      song: song,
      ...properties
    });
  }

  // Audiostarts erfassen
  audio.addEventListener('play', () => {
    trackEvent('audio-play');
  });

  // Wiedergabefortschritt erfassen
  audio.addEventListener('timeupdate', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }

    const percent = (audio.currentTime / audio.duration) * 100;

    milestones.forEach((milestone) => {
      if (percent >= milestone && !reached.has(milestone)) {
        reached.add(milestone);

        trackEvent('audio-progress', {
          percent: milestone
        });
      }
    });
  });

  // Vollständige Wiedergabe erfassen
  audio.addEventListener('ended', () => {
    trackEvent('audio-progress', {
      percent: 100
    });

    reached.clear();
  });
})();
