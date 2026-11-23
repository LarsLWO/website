
(function () {
  'use strict';

  document.querySelectorAll('.story-card-actions').forEach(function (actions) {
    const button = actions.querySelector('[data-card-play]');
    const audio = actions.querySelector('[data-card-audio]');
    if (!button || !audio) return;

    const playIcon = button.querySelector('[data-card-play-icon]');
    const pauseIcon = button.querySelector('[data-card-pause-icon]');
    const label = button.querySelector('[data-card-play-label]');
    const status = actions.querySelector('[data-card-audio-status]');

    // Umami: Fortschritt pro Wiedergabe erfassen
    const milestones = [25, 50, 75];
    const reached = new Set();

    function trackEvent(eventName, properties) {
      if (typeof window.umami?.track !== 'function') return;

      window.umami.track(eventName, {
        song: button.dataset.songTitle,
        ...properties
      });
    }

    function update() {
      const playing = !audio.paused && !audio.ended;
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', button.dataset.songTitle + (playing ? ' pausieren' : ' abspielen'));
      playIcon.toggleAttribute('hidden', playing);
      pauseIcon.toggleAttribute('hidden', !playing);
      label.textContent = playing ? 'Pause' : 'Abspielen';
    }

    function showError() {
      audio.pause();
      update();
      status.textContent = 'Wiedergabe nicht möglich. Bitte den Song über die Textseite öffnen.';
      status.hidden = false;
    }

    button.hidden = false;

    button.addEventListener('click', async function () {
      status.hidden = true;

      if (!audio.paused) {
        audio.pause();
        return;
      }

      document.querySelectorAll('audio').forEach(function (other) {
        if (other !== audio) other.pause();
      });

      try {
        await audio.play();
      } catch (error) {
        if (error.name !== 'AbortError') showError();
      }
    });

    // Umami: Audiostarts erfassen
    audio.addEventListener('play', function () {
      trackEvent('audio-play', {});
    });

    // Umami: Wiedergabefortschritt erfassen
    audio.addEventListener('timeupdate', function () {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      const percent = (audio.currentTime / audio.duration) * 100;

      milestones.forEach(function (milestone) {
        if (percent >= milestone && !reached.has(milestone)) {
          reached.add(milestone);
          trackEvent('audio-progress', {
            percent: milestone
          });
        }
      });
    });

    // Umami: Song vollständig abgespielt
    audio.addEventListener('ended', function () {
      trackEvent('audio-progress', {
        percent: 100
      });

      reached.clear();
    });

    ['play', 'pause', 'ended', 'emptied'].forEach(function (event) {
      audio.addEventListener(event, update);
    });

    audio.addEventListener('error', showError);

    update();
  });
}());
