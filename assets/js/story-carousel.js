(function () {
  'use strict';

  const carousel = document.querySelector('.story-carousel');
  if (!carousel) return;

  const grid = carousel.querySelector('.story-grid');
  const controls = carousel.querySelector('.story-carousel-controls');
  const previous = controls.querySelector('[data-carousel-previous]');
  const next = controls.querySelector('[data-carousel-next]');
  const status = carousel.querySelector('[role="status"]');
  const mobile = window.matchMedia('(max-width: 700px)');
  const cardCount = grid.children.length;
  if (cardCount < 2) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animations = [];

  function deactivate(card, button) {
    if (card.contains(document.activeElement)) button.focus();
    card.querySelector('audio')?.pause();
    card.querySelector('.story-share')?.removeAttribute('open');
  }

  function updateVisibility() {
    const visibleCount = mobile.matches ? 1 : 2;
    controls.hidden = cardCount <= visibleCount;
    carousel.classList.toggle('is-active', !controls.hidden);
    Array.from(grid.children).forEach(function (card, index) {
      if (index >= visibleCount && !card.hidden) deactivate(card, next);
      card.hidden = index >= visibleCount;
    });
  }

  function move(direction, button) {
    animations.forEach(function (animation) { animation.cancel(); });
    animations = [];

    const singleCard = mobile.matches;
    const retained = singleCard ? null : grid.children[direction === 1 ? 1 : 0];
    const outgoing = grid.children[singleCard || direction === 1 ? 0 : 1];
    const retainedLeft = retained?.getBoundingClientRect().left;
    deactivate(outgoing, button);
    outgoing.hidden = true;

    if (direction === 1) {
      grid.append(grid.firstElementChild);
    } else {
      grid.prepend(grid.lastElementChild);
    }
    updateVisibility();

    const visible = Array.from(grid.children).filter(function (card) { return !card.hidden; });
    status.textContent = (singleCard ? 'Sichtbarer Text: ' : 'Sichtbare Texte: ') + visible.map(function (card) {
      return card.querySelector('h2').textContent.trim();
    }).join(' · ');

    const incoming = visible[direction === 1 && !singleCard ? 1 : 0];
    if (reducedMotion.matches || !incoming.animate) return;

    const timing = { duration: 220, easing: 'ease-out' };
    if (singleCard) {
      animations = [incoming.animate([
        { opacity: 0, transform: 'translateX(' + direction * 24 + 'px)' },
        { opacity: 1, transform: 'none' }
      ], timing)];
      return;
    }
    const distance = retainedLeft - retained.getBoundingClientRect().left;
    animations = [
      retained.animate([{ transform: 'translateX(' + distance + 'px)' }, { transform: 'none' }], timing),
      incoming.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, delay: 60, fill: 'backwards' })
    ];
  }

  updateVisibility();
  mobile.addEventListener('change', updateVisibility);
  previous.addEventListener('click', function () { move(-1, previous); });
  next.addEventListener('click', function () { move(1, next); });

  let swipeStart;
  grid.addEventListener('touchstart', function (event) {
    swipeStart = event.touches.length === 1 && !controls.hidden
      ? event.touches[0]
      : null;
  }, { passive: true });
  grid.addEventListener('touchcancel', function () {
    swipeStart = null;
  }, { passive: true });
  grid.addEventListener('touchend', function (event) {
    const start = swipeStart;
    swipeStart = null;
    const end = event.changedTouches[0];
    if (!start || end.identifier !== start.identifier || !event.cancelable) return;

    const dx = end.clientX - start.clientX;
    const dy = end.clientY - start.clientY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    event.preventDefault();
    if (dx < 0) move(1, next);
    else move(-1, previous);
  }, { passive: false });
}());
