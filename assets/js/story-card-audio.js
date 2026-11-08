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

    ['play', 'pause', 'ended', 'emptied'].forEach(function (event) {
      audio.addEventListener(event, update);
    });
    audio.addEventListener('error', showError);
    update();
  });
}());
