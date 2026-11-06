(function () {
  'use strict';

  const shareMenus = Array.from(document.querySelectorAll('.story-share'));
  const copyConfirmation = document.querySelector('[data-copy-confirmation]');
  const copyAnnouncement = document.querySelector('[data-copy-announcement]');
  let copyConfirmationTimer;
  let copyConfirmationOrigin;

  function closeMenu(menu, restoreFocus) {
    menu.open = false;
    if (restoreFocus) menu.querySelector('summary').focus();
  }

  function dismissCopyConfirmation() {
    window.clearTimeout(copyConfirmationTimer);
    if (!copyConfirmation) return;
    const restoreFocus = copyConfirmation.contains(document.activeElement);
    copyConfirmation.hidden = true;
    if (copyAnnouncement) copyAnnouncement.textContent = '';
    if (restoreFocus && copyConfirmationOrigin) copyConfirmationOrigin.focus();
  }

  function showCopyConfirmation(menu) {
    window.clearTimeout(copyConfirmationTimer);
    copyConfirmationOrigin = menu.querySelector('summary');
    closeMenu(menu, true);
    if (!copyConfirmation) return;
    copyConfirmation.hidden = false;
    if (copyAnnouncement) copyAnnouncement.textContent = 'Link kopiert';
    copyConfirmationTimer = window.setTimeout(dismissCopyConfirmation, 2000);
  }

  if (copyConfirmation) {
    copyConfirmation.querySelector('button').addEventListener('click', dismissCopyConfirmation);
  }

  shareMenus.forEach(function (menu) {
    const copyButton = menu.querySelector('[data-copy-link]');
    const nativeButton = menu.querySelector('[data-native-share]');
    const copyField = menu.querySelector('.share-copy-field');
    const status = menu.querySelector('.share-status');
    const url = menu.dataset.shareUrl;
    const title = menu.dataset.shareTitle;

    menu.addEventListener('toggle', function () {
      if (!menu.open) return;
      shareMenus.forEach(function (other) {
        if (other !== menu) closeMenu(other, false);
      });
    });

    copyButton.hidden = false;
    copyButton.addEventListener('click', async function () {
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          throw new Error('Clipboard unavailable');
        }
        await navigator.clipboard.writeText(url);
        copyField.hidden = true;
        status.textContent = '';
        showCopyConfirmation(menu);
      } catch (error) {
        copyField.hidden = false;
        copyField.focus();
        copyField.select();
        status.textContent = 'Link markieren und kopieren.';
      }
    });

    if (typeof navigator.share === 'function' && window.isSecureContext) {
      nativeButton.hidden = false;
      nativeButton.addEventListener('click', async function () {
        try {
          await navigator.share({ title: title, url: url });
          closeMenu(menu, true);
        } catch (error) {
          if (error.name === 'AbortError') return;
          status.textContent = 'Bitte eine der anderen Teilen-Optionen wählen.';
        }
      });
    }

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu(menu, false);
      });
    });
  });

  document.addEventListener('click', function (event) {
    shareMenus.forEach(function (menu) {
      if (menu.open && !menu.contains(event.target)) closeMenu(menu, false);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (copyConfirmation && !copyConfirmation.hidden) {
      event.preventDefault();
      dismissCopyConfirmation();
    }
    shareMenus.forEach(function (menu) {
      if (menu.open) {
        event.preventDefault();
        closeMenu(menu, true);
      }
    });
  });

  const storyText = document.querySelector('[data-story-text]');
  if (!storyText) return;

  document.addEventListener('copy', function (event) {
    if (!event.clipboardData || event.defaultPrevented) return;
    if (event.target instanceof Element &&
        event.target.closest('input, textarea, [contenteditable]')) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const selectedText = selection.toString();
    if (Array.from(selectedText.trim()).length < 200) return;

    const fragment = document.createElement('div');
    for (let index = 0; index < selection.rangeCount; index += 1) {
      const range = selection.getRangeAt(index);
      if (!storyText.contains(range.startContainer) ||
          !storyText.contains(range.endContainer)) return;
      fragment.appendChild(range.cloneContents());
    }

    const publicationYear = storyText.dataset.storyPublishedYear;
    const credit = storyText.dataset.storyTitle +
      (publicationYear ? ' (' + publicationYear + ')' : '') + ', Lars Wollny';
    const url = storyText.dataset.storyUrl;
    const attribution = document.createElement('p');
    const sourceLink = document.createElement('a');
    attribution.appendChild(document.createElement('br'));
    attribution.appendChild(document.createTextNode(credit));
    attribution.appendChild(document.createElement('br'));
    attribution.appendChild(document.createTextNode('Quelle: '));
    sourceLink.href = url;
    sourceLink.textContent = url;
    attribution.appendChild(sourceLink);
    fragment.appendChild(attribution);

    event.clipboardData.setData('text/plain', selectedText.trimEnd() + '\n\n' + credit + '\nQuelle: ' + url);
    event.clipboardData.setData('text/html', fragment.innerHTML);
    event.preventDefault();
  });
}());
