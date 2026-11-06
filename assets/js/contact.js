document.querySelectorAll('.contact-email').forEach(function (element) {
  const user = Array.from(element.dataset.emailUser).reverse().join('');
  const domain = Array.from(element.dataset.emailDomain).reverse().join('');
  if (!user || !domain) return;
  const address = user + '@' + domain;
  const link = document.createElement('a');
  link.href = 'mailto:' + address;
  link.textContent = address;
  element.replaceChildren(link);
  element.removeAttribute('data-email-user');
  element.removeAttribute('data-email-domain');
});
