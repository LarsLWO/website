# larswollny.de – Technische Dokumentation

Statische Autorenwebsite für Kurzgeschichten, Gedichte und Songtexte. Die Inhalte werden beim Build in fertige HTML-Seiten umgewandelt. Suche, Filter und weitere Interaktionen laufen anschließend im Browser.

## Technische Basis

| Bereich | Umsetzung |
| --- | --- |
| Seitengenerator | Jekyll |
| Templates | Liquid, HTML und YAML-Front-Matter |
| Texte | Markdown; kramdown mit GFM-Eingabeformat und `hard_wrap: true` |
| Gestaltung | Eigenes CSS, responsive Layouts, Systemschriften und SVG-Icons |
| Interaktionen | JavaScript ohne Frontend-Framework oder npm-Build |
| Medien | Lokale Bilder, WebP-Varianten und MP3-Dateien |
| Datenhaltung | Dateien im Repository; keine Anwendungsdatenbank |
| Sprache und Zeitzone | `de-DE`, `Europe/Berlin` |
| Öffentliche Basis-URL | `https://www.larswollny.de` |

Der Betrieb benötigt einen statischen Webserver. Ruby und Jekyll werden für die Generierung gebraucht, nicht für die Auslieferung der fertigen Website.

## Projektstruktur

```text
_config.yml                 Jekyll-Konfiguration und Ausschlüsse beim Build
_data/
  author.yml                Angaben für die Autorenvorstellung
  legal.yml                 Kontakt-, Anbieter- und Analytics-Konfiguration
_layouts/
  magazine.html             Gemeinsames Seitengerüst
  story.html                Artikelansicht, eingebettet in magazine.html
_includes/                  Wiederverwendbare Liquid-/HTML-Komponenten
_texts/
  short/                    Kurzgeschichten
  poems/                    Gedichte
  songs/                    Songtexte
assets/
  css/                      Stylesheets
  js/                       Browser-Skripte
  images/stories/           Artikelbilder als Bild-Fallbacks
  images/optimized/         Vorbereitete responsive Bildvarianten
  audio/                    MP3-Dateien
index.html                  Startseite mit Textkarussell
stories.html                Textübersicht mit Suche und Filtern
ueber-mich.html              Autorenvorstellung und Kontakt
impressum.html              Impressum
datenschutz.html            Datenschutzerklärung
cookies.html                Informationen zu Cookies
404.html                    Fehlerseite
search-index.json           Liquid-Vorlage für den Volltextindex
feed.xml                    Liquid-Vorlage für den RSS-Feed
sitemap.xml                 Liquid-Vorlage für die Sitemap
robots.txt                  Crawler-Hinweise und Sitemap-Verweis
CNAME                       Domainangabe www.larswollny.de
_resources/                 Lokales Arbeitsmaterial; ignoriert und ausgeschlossen
_site/                      Generierte Website; nicht versioniert
```

`_config.yml` schließt außerdem lokale Werkzeuge, Caches und Dokumentation wie diese `readme.md` von der veröffentlichten Ausgabe aus. `.gitignore` regelt separat, welche lokalen Dateien nicht in Git aufgenommen werden.

## Layouts und gemeinsame Komponenten

`_layouts/magazine.html` enthält Dokumentkopf, Navigation, Hauptbereich, Footer, globale Skripte und die bedingte Analytics-Einbindung. `_layouts/story.html` ergänzt Artikelkopf, Text, Medien, Werkzeugleisten und Empfehlungen.

| Komponente in `_includes/` | Aufgabe |
| --- | --- |
| `story-card.html` | Artikelkarte für die Startseite |
| `story-card-actions.html` | Kartenaktionen: Audiowiedergabe, Songtext-Link und Teilen |
| `story-share.html` | Gemeinsames Teilen-Menü mit E-Mail, WhatsApp, Linkkopie und nativer Teilen-Funktion |
| `story-toolbar.html` | Teilen und Drucken in der Artikelansicht |
| `page-actions.html` | Teilen am Seitenende, aktiviert über `footer_actions: share` |
| `copy-confirmation.html` | Gemeinsame Kopierbestätigung und Screenreader-Meldung |
| `song-player.html` | HTML-Audioplayer, Informationsdialog und Fallback-Text |
| `responsive-image.html` | Artikelbilder mit WebP-`srcset`, Größenangaben und Ladepriorität |
| `author-portrait.html` | Autorenporträt mit Bildvarianten |
| `story-recommendations.html` | Auswahl weiterer Texte über `recommendation_tags`, sonst `fallback_texts` |
| `story-recommendation-card.html` | Darstellung eines empfohlenen Textes |
| `story-classification.html` | Textart und Genre ohne doppelte Bezeichnungen |
| `story-description.html` | Beschreibung mit optionalem Verweis auf einen anderen Text |
| `story-date.html`, `story-card-dates.html` | Datumsdarstellung |
| `story-publication.html` | Hinweise auf externe Veröffentlichungen |
| `tagged-text-links.html` | Verweise auf nach Schlagwort gefilterte Texte |
| `contact-email.html` | E-Mail-Darstellung mit JavaScript-Aufbereitung und Noscript-Fallback |
| `elapsed-years.html` | Beim Build berechnete Jahresangabe |
| `seo.html` | Metadaten, Canonical-URL, Social-Metadaten und Favicons |
| `structured-data.html` | Schema.org-Daten als JSON-LD |

Die Textübersicht in `stories.html` besitzt eigenes Karten-Markup mit Suchmetadaten und Filterelementen. Sie verwendet dabei dieselben Includes für Bilder, Klassifikation, Datum, Beschreibung und Kartenaktionen wie andere Ansichten.

Das Teilen-Menü ist im Quellprojekt zentral gepflegt. Dass es im fertigen HTML pro Karte erscheint, ist das Ergebnis der statischen Generierung und erfordert keine mehrfachen Änderungen am Quelltext.

## JavaScript und CSS

Alle folgenden Skripte liegen in `assets/js/` und werden mit `defer` eingebunden.

| Datei | Aufgabe und Einbindung |
| --- | --- |
| `stories.js` | Global: Teilen, Linkkopie mit Fallback, Kopierbestätigung, Drucken, Gedicht-/Songtextwechsel und Quellenangaben beim Kopieren von Textauszügen |
| `contact.js` | Global: E-Mail-Adresse aus den vorbereiteten Daten zusammensetzen |
| `story-card-audio.js` | Global: Audiowiedergabe über Kartenaktionen steuern |
| `story-carousel.js` | Startseite: Navigation durch Textkarten |
| `story-search.js` | Textübersicht: Volltextsuche, Genre-/Tagfilter, Trefferreihenfolge, Vorschau und URL-Zustand |
| `song-player.js` | Seiten mit Audio: Informationsdialog zum Song öffnen und schließen |
| `elapsed-years.js` | Autorenseite: Jahresangaben im Browser aktualisieren |

`assets/css/magazine.css` enthält das zentrale Design, responsive Anpassungen, Fokusdarstellung, Regeln für reduzierte Bewegung und Druckansichten. `assets/css/no-script.css` wird auf der Textübersicht innerhalb von `<noscript>` geladen.

Die Grundinhalte sind bereits im HTML vorhanden. Ohne JavaScript bleiben Texte, Links, E-Mail-/WhatsApp-Teilen und der native Audioplayer nutzbar; Suche und weitere Komfortfunktionen benötigen JavaScript. Native Teilen- und Clipboard-Funktionen werden abhängig von Browserunterstützung und Verfügbarkeit aktiviert.

## Inhalte und Front-Matter

Jekyll verarbeitet `_texts/` als Collection `texts`. Die Unterordner strukturieren die Quelldateien. Die URL folgt dem in `_config.yml` definierten Muster `/:collection/:path/`, beispielsweise `/texts/short/concordia/`.

Ein neuer Text besteht aus YAML-Front-Matter und anschließendem Markdown:

```yaml
---
layout: story
title: "Titel des Textes"
date: "2026-11-22"
text_type: "Kurzgeschichte"
genre: "Dystopie"
description: "Kurze Beschreibung für Übersicht und Metadaten."
tags:
  - Gesellschaft
recommendation_tags:
  - Gesellschaft
image: /assets/images/stories/beispiel.jpeg
image_webp_base: /assets/images/optimized/beispiel
image_width: 1280
image_height: 853
image_alt: "Beschreibung des Bildinhalts."
---
```

Wichtige optionale Felder:

- `text_type`: Textart; Standardwert der Klassifikation ist `Kurzgeschichte`.
- `title_lang`, `text_lang`: Sprache von Titel und Text, etwa `en-GB`.
- `audio`, `audio_duration`: Lokale Audiodatei und ISO-8601-Dauer, etwa `PT3M58S`.
- `songtext`: Zusätzliche Markdown-Fassung; aktiviert die Gedicht-/Songtextansicht.
- `song_idea_credit`: Zusätzlicher Hinweis zur Entstehung eines Songs.
- `reading_note`, `show_description`: Lesehinweis und Steuerung der Einleitung.
- `description_link_text`, `description_link_url`: Verlinkter Bestandteil der Beschreibung.
- `publication_title`: Hinweis auf eine Veröffentlichung; weitere zugehörige Felder siehe `story-publication.html` und vorhandene Texte.
- `fallback_texts`: Liste von Artikel-URLs als Empfehlungen, wenn keine passenden Empfehlungstags gefunden werden.
- `modified_on`: Änderungsdatum für die Sitemap.
- `seo_title`, `seo_description`, `social_title`, `social_description`: Gezielte Metadaten-Overrides.
- `noindex`, `sitemap`: Steuerung von Indexierung und Sitemap-Aufnahme.

`tags` dienen der sichtbaren Verschlagwortung und den Filtern. `recommendation_tags` steuern unabhängig davon die Empfehlungen. Beim Umbenennen oder Verschieben einer Quelldatei mögliche URL-Änderungen und bestehende Verweise beachten.

## Caching und Cache-Aktualisierung

Alle lokalen CSS- und JavaScript-Einbindungen verwenden einheitlich den Jekyll-Build-Zeitstempel als Versionsparameter:

```liquid
{{ '/assets/css/magazine.css' | relative_url }}?v={{ site.time | date: '%s' }}
```

`site.time` liefert die Zeit des Builds; `%s` formatiert sie als Unix-Zeitstempel in Sekunden. Innerhalb desselben Builds erhalten die Einbindungen denselben Wert. Ein späterer Build mit neuem Zeitstempel erzeugt neue Asset-URLs, sodass Browser bei üblicher Cache-Konfiguration die neue Version anfordern.

Das Verfahren gilt auch für unveränderte CSS-/JavaScript-Dateien: Es ist eine Versionierung pro Build, kein Hash des Dateiinhalts. Manuelle Versionsnamen oder Datumskennungen sind nicht nötig. Neue CSS-/JavaScript-Einbindungen sollten dasselbe Muster verwenden.

Weitere Grenzen und Cache-Ebenen:

- Bilder, Audio, Favicons und `search-index.json` haben derzeit keinen solchen Versionsparameter. Bei Medienänderungen kann ein neuer Dateiname verwendet werden; andernfalls gelten die Cache-Regeln des ausliefernden Servers.
- HTTP-Cache-Header, Cache-Laufzeiten und CDN-Regeln sind im Repository nicht konfiguriert. Diese Dokumentation trifft keine Aussage über die tatsächlich beim Hosting gesetzten Header. Ein CDN muss Query-Parameter bei seinen Cache-Schlüsseln berücksichtigen, damit diese Versionierung dort wirkt.
- Die HTML-Seiten selbst müssen ebenfalls entsprechend den Hosting-Regeln aktualisiert werden, damit Besucher die neuen Asset-URLs erhalten.
- Es gibt keinen Service Worker und keinen Anwendungscache in Local Storage oder Session Storage.
- Der Suchindex wird bei Bedarf geladen und über ein Promise im Arbeitsspeicher der geöffneten Seite wiederverwendet. Bei Ladefehlern ist ein erneuter Versuch möglich; das ist getrennt vom HTTP-Caching.
- Lokale Jekyll-Caches wie `.jekyll-cache` dienen dem Build und sind keine Browser-Caches.

## Build und lokale Vorschau

Beim Build verarbeitet Jekyll Konfiguration, YAML-Daten, Markdown, Liquid und Layouts zu statischen Dateien in `_site/`. Auch Suchindex, Feed und Sitemap entstehen dabei aus ihren Vorlagen. Medien und andere statische Assets werden in die Ausgabe übernommen.

Voraussetzung ist eine lokal installierte, kompatible Ruby-/Jekyll-Umgebung einschließlich kramdown und GFM-Unterstützung. Das Repository enthält derzeit **keine `Gemfile`, keinen Lockfile und keine festgeschriebene Ruby-/Jekyll-Version**. Es gibt auch keine `package.json` oder versionierte CI-/Deployment-Pipeline. Die genaue produktive Build-Umgebung lässt sich daraus nicht rekonstruieren.

Wenn `jekyll` verfügbar ist, im Projektverzeichnis ausführen:

```sh
# Lokale Vorschau mit automatischem Neuaufbau
jekyll serve --host 127.0.0.1

# Produktionsausgabe erzeugen
JEKYLL_ENV=production jekyll build

# Jekyll-Diagnose
jekyll doctor
```

Die Vorschau ist standardmäßig unter `http://127.0.0.1:4000` erreichbar. Nach Änderungen an `_config.yml` den Vorschauprozess neu starten. Die Liquid-Quelldateien sollten nicht direkt über `file://` oder einen einfachen Dateiserver geöffnet werden; dafür zuerst Jekyll ausführen.

Die Befehle beschreiben den vorgesehenen Jekyll-Ablauf. Beim Erstellen dieser Dokumentation war Jekyll lokal nicht installiert; ein vollständiger Build wurde daher nicht ausgeführt. Für reproduzierbare Builds wäre als nächster Schritt die tatsächlich genutzte Umgebung über Ruby-Version, `Gemfile` und `Gemfile.lock` festzuhalten.

## Hosting und Veröffentlichung

`CNAME` enthält `www.larswollny.de`; `_config.yml` definiert die absolute Basis-URL. Eine `CNAME`-Datei allein belegt weder den aktiven Hosting-Anbieter noch den Auslöser eines Deployments. Die konkrete Hosting-Konfiguration liegt nicht im Repository vor.

Bei einer Veröffentlichung der lokal erzeugten Ausgabe wird der Inhalt von `_site/` auf einem statischen Hosting bereitgestellt. Alternativ kann ein Hosting-Dienst den Jekyll-Build selbst ausführen. Welcher Weg produktiv verwendet wird, ist hier nicht festgelegt.

## Suche, SEO und Medien

- **Suche:** `search-index.json` enthält URLs und bereinigte Textinhalte einschließlich zusätzlicher Songtexte. `story-search.js` lädt den Index erst bei einer Suchanfrage. Bei einem Ladefehler bleiben Metadatentreffer möglich. Suchbegriff, Genre und Tag werden im URL-Fragment gespeichert; ältere Query-Links werden ebenfalls eingelesen.
- **SEO:** `seo.html` erzeugt Titel, Beschreibungen, Canonical-Links, Open-Graph- und Twitter-Metadaten. `structured-data.html` ergänzt unter anderem Website, Autor, Seite, literarisches Werk und gegebenenfalls Audio als JSON-LD.
- **Sitemap und Feed:** Eigene Liquid-Vorlagen; der RSS-Feed enthält bis zu 20 Texte, nach Datum absteigend. Die Sitemap berücksichtigt die vorgesehenen Ausschlussfelder und Bildangaben.
- **Bilder:** Das Artikelbild-Include erwartet bei gesetztem `image_webp_base` WebP-Dateien mit den Endungen `-480.webp`, `-800.webp` und `-1280.webp`. Wichtige Bilder laden priorisiert, weitere verzögert. Die Varianten liegen fertig im Repository; ein automatischer Bildkonverter ist nicht enthalten.
- **Audio:** MP3-Dateien werden lokal über HTML-Audio ausgeliefert. Karten laden Audio mit `preload="none"`; der Songdialog wird durch ein separates Skript ergänzt.

## Sicherheit und externe Dienste

Das Hauptlayout setzt eine Content Security Policy und die Referrer Policy `strict-origin-when-cross-origin` über Meta-Tags. Die CSP beschränkt Ressourcen überwiegend auf die eigene Herkunft und erlaubt die benötigten Umami-Adressen `cloud.umami.is` und `gateway.umami.is`. HSTS und Schutz gegen das Einbetten in fremde Frames müssen über HTTP-Header des Hostings umgesetzt werden; Meta-Tags ersetzen diese Header nicht.

Umami Cloud wird über `assets/js/analytics.js` erst nach einer aktiven Zustimmung geladen. Die Einstellung wird im Local Storage unter `umami-consent` als `accepted` oder `rejected` gespeichert. Ein Widerruf unterbindet weitere Übermittlungen; im Footer kann die Entscheidung geändert werden. Seitenaufrufe und ausgewählte Bedienaktionen werden erfasst; URL-Suchparameter und Fragmente sind ausgeschlossen. Das Front-Matter-Feld `analytics: false` wird von der zentralen Einbindung nicht ausgewertet.

In der Datenschutzerklärung können Besucher die Statistik ausschalten und wieder zulassen. Das Opt-out verwendet Umamis unterstützten Local-Storage-Schlüssel `umami.disabled`. Bei gespeichertem Widerspruch oder nicht lesbarem Browser-Speicher wird das externe Skript nicht geladen. Ein `data-before-send`-Handler prüft die Einstellung auch vor weiteren Seitenaufruf- und Ereignisübermittlungen. Änderungen werden über das `storage`-Ereignis in anderen geöffneten Tabs berücksichtigt und beim Wiederherstellen einer Seite erneut geprüft. Bei Speicherfehlern bleibt die aktuelle Seite ohne Statistik; die Oberfläche weist darauf hin, dass die Auswahl nicht dauerhaft gespeichert werden konnte. Das Opt-out gilt pro Browserprofil und Origin; es löscht keine zuvor erhobenen Daten.

Die in `datenschutz.html` angegebenen Kontoeinstellungen (EU-Datenregion, Aufbewahrung) müssen mit dem verwendeten Umami-Cloud-Konto übereinstimmen. Ein Opt-out ersetzt keine gegebenenfalls erforderliche Einwilligung oder Interessenabwägung.

E-Mail- und WhatsApp-Teilen verwenden Links; weitere Apps werden über die native Web-Share-API angesprochen. Es gibt keinen eigenen Versanddienst und kein serverseitiges Kontaktformular.

## Typische Änderungen und Prüfung

| Änderung | Zuständige Dateien |
| --- | --- |
| Neuen Text veröffentlichen | `_texts/`, zugehörige Bilder und gegebenenfalls Audio |
| Navigation oder Footer ändern | `_layouts/magazine.html` |
| Artikelansicht ändern | `_layouts/story.html` und zugehörige Includes |
| Teilen-Menü ändern | `_includes/story-share.html`, `assets/js/stories.js`, CSS |
| Kartenaktionen ändern | `_includes/story-card-actions.html`, gegebenenfalls `story-card-audio.js` |
| Suche oder Filter ändern | `stories.html`, `search-index.json`, `story-search.js` |
| Gestaltung ändern | `assets/css/magazine.css`, gegebenenfalls `no-script.css` |
| Kontakt-/Anbieterdaten oder Analytics ändern | `_data/legal.yml` und betroffene Rechtstexte |
| Autorendaten ändern | `_data/author.yml`, `ueber-mich.html` |
| Domain oder globale Vorgaben ändern | `_config.yml`, `CNAME` und externe Hosting-/DNS-Konfiguration |

Nach Änderungen den Jekyll-Build ausführen und die betroffenen Seiten in der Vorschau prüfen. Für gemeinsame Komponenten insbesondere Startseite, Textübersicht und Artikelansicht vergleichen. Je nach Änderung auch mobile Ansicht, Tastaturbedienung, Betrieb ohne JavaScript, Druckansicht, Teilen, Suche und Audiowiedergabe prüfen. Ein automatisiertes Testsystem ist im Repository derzeit nicht enthalten.
