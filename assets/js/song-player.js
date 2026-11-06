(() => {
  const dialog = document.getElementById('song-info');
  const trigger = document.querySelector('[data-song-info-open]');
  if (!dialog || !trigger || typeof dialog.showModal !== 'function') return;
  trigger.hidden = false;
  trigger.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
})();
