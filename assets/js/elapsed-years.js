(() => {
  'use strict';

  // Count anniversaries using Hamburg's calendar date, including near midnight.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const today = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));

  document.querySelectorAll('[data-elapsed-years][data-since]').forEach(element => {
    const [year, month, day] = element.dataset.since.split('-').map(Number);
    if (!year || !month || !day) return;
    let years = today.year - year;
    if (today.month < month || (today.month === month && today.day < day)) years -= 1;
    element.textContent = String(Math.max(0, years));
  });
})();
