
(() => {
  'use strict';

  // Song-Info-Dialog
  document.querySelectorAll('[data-song-player]').forEach((player) => {
    const dialog = player.querySelector('dialog');
    const trigger = player.querySelector('[data-song-info-open]');

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

  });
})();
