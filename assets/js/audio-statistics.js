const erfasstePlayer = new WeakSet();

document.addEventListener("playing", function (event) {
  const audio = event.target;

  if (!(audio instanceof HTMLAudioElement)) return;
  if (erfasstePlayer.has(audio)) return;
  if (!audio.currentSrc) return;

  const url = new URL(audio.currentSrc);

  if (url.origin !== location.origin) return;
  if (!url.pathname.toLowerCase().endsWith(".mp3")) return;

  erfasstePlayer.add(audio);

  fetch(
    "/statistik/wiedergabe?datei=" +
    encodeURIComponent(url.pathname),
    {
      method: "POST",
      credentials: "same-origin",
      keepalive: true
    }
  ).then(response => {
    if (!response.ok) erfasstePlayer.delete(audio);
  }).catch(() => {
    erfasstePlayer.delete(audio);
  });
}, true);
