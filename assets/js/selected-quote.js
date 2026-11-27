(() => {
  'use strict';

  document.querySelectorAll('[data-selected-quote]').forEach(section => {
    const options = section.querySelectorAll('template[data-quote-option]');
    const display = section.querySelector('[data-quote-display]');
    if (!display || !options.length) return;

    const selected = options[Math.floor(Math.random() * options.length)];
    display.replaceWith(selected.content.cloneNode(true));
  });
})();
