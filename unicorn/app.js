/* global document, window, localStorage */

const unicornConfig = {
  bodyColor: "white",
  maneStyle: "rainbow_01",
  hornType: "crystal",
  wings: "butterfly",
};

const STORAGE_KEY = "unicorn-tamagotchi-state-v2";
const TICK_MS = 10000;
const OFFLINE_TICK_MS = 10000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundValue = (value) => Math.round(value * 10) / 10;

function readStorage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage may be unavailable in file:// or private contexts.
  }
}

const UnicornRenderer = (() => {
  const bodyVariants = {
    white: { fill: "#f8fbff", shade: "#dde8f6", accent: "#b8c7da" },
    pink: { fill: "#ffd9ea", shade: "#f0aac8", accent: "#d979aa" },
    mint: { fill: "#d7fff2", shade: "#a9ead6", accent: "#6cbfa6" },
  };

  const maneVariants = {
    rainbow_01: ["#ff5f6d", "#ffaf40", "#ffe066", "#7ce38b", "#6ecbff", "#8a7dff"],
    pastel_wave: ["#ffd1dc", "#ffd9a8", "#fff2a8", "#c8f7c5", "#c6e9ff", "#dfd1ff"],
    starry: ["#18224d", "#243b7d", "#5f69ff", "#8f7dff", "#c6abff", "#f8f2ff"],
  };

  const hornVariants = {
    classic: ["#fff2bf", "#f0d77f"],
    crystal: ["#d9f7ff", "#78d8ff"],
    spiral: ["#f8dfff", "#c16eff"],
  };

  const wingVariants = {
    none: null,
    feather: {
      strokes: ["#ffffff", "#edf2ff", "#dfe8ff"],
      fill: "#ffffff",
      opacity: 0.86,
    },
    butterfly: {
      strokes: ["#ff99c8", "#7ad7ff", "#ffd166"],
      fill: "#ffffff",
      opacity: 0.72,
    },
  };

  let currentConfig = { ...unicornConfig };
  let currentMood = "neutral";
  let currentAction = null;

  function render(target, config = currentConfig) {
    currentConfig = { ...currentConfig, ...config };
    target.innerHTML = buildSvg(currentConfig, currentMood, currentAction);
    bindSvg(target);
  }

  function setMood(mood) {
    currentMood = mood;
    syncClassState();
  }

  function triggerAction(action, durationMs = 5000) {
    currentAction = action;
    syncClassState();
    window.clearTimeout(triggerAction._timer);
    if (durationMs == null) return;
    triggerAction._timer = window.setTimeout(() => {
      currentAction = null;
      syncClassState();
    }, durationMs);
  }

  function updateConfig(nextConfig) {
    currentConfig = { ...currentConfig, ...nextConfig };
    const stage = document.querySelector("#unicorn-stage");
    if (stage) render(stage, currentConfig);
  }

  function syncClassState() {
    const svg = document.querySelector("svg.unicorn");
    if (!svg) return;
    const moodClasses = ["state-happy", "state-hungry", "state-sick"];
    const actionClasses = ["activity-feed", "activity-pet", "activity-play", "activity-clean", "activity-fly", "activity-sleep", "activity-arzt"];
    svg.classList.remove(...moodClasses, ...actionClasses);
    if (currentMood && currentMood !== "neutral") {
      svg.classList.add(`state-${currentMood}`);
    }
    if (currentAction) {
      svg.classList.add(`activity-${currentAction}`);
    }
    svg.dataset.mood = currentMood;
  }

  function bindSvg(target) {
    const svg = target.querySelector("svg.unicorn");
    if (!svg || svg.dataset.bound === "1") return;
    svg.dataset.bound = "1";
    svg.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("unicorn:action", { detail: { action: "pet" } }));
    });
    syncClassState();
  }

  function buildSvg(config, mood, action) {
    const body = bodyVariants[config.bodyColor] || bodyVariants.white;
    const maneColors = maneVariants[config.maneStyle] || maneVariants.rainbow_01;
    const hornColors = hornVariants[config.hornType] || hornVariants.classic;
    const wings = wingVariants[config.wings] || wingVariants.none;
    const moodClass = mood && mood !== "neutral" ? `state-${mood}` : "";
    const actionClass = action ? `activity-${action}` : "";
    const wingsClass = config.wings && config.wings !== "none" ? config.wings : "none";

    return `
      <svg class="unicorn ${moodClass} ${actionClass}" viewBox="0 0 720 540" role="img" aria-label="Modulares Einhorn" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyGradient" x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stop-color="${body.fill}" />
            <stop offset="100%" stop-color="${body.shade}" />
          </linearGradient>
          <linearGradient id="maneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            ${maneColors
              .map((color, index) => {
                const denominator = Math.max(maneColors.length - 1, 1);
                return `<stop offset="${(index / denominator) * 100}%" stop-color="${color}" />`;
              })
              .join("")}
          </linearGradient>
          <linearGradient id="hornGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${hornColors[0]}" />
            <stop offset="100%" stop-color="${hornColors[1]}" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </radialGradient>
        </defs>

        <g data-layer="glow" opacity="0.6">
          <ellipse cx="360" cy="260" rx="180" ry="150" fill="url(#glow)" />
        </g>

        <g data-layer="main" class="layer-main">
          ${renderWings(wingsClass, wings)}
          <g data-layer="tail" class="layer-tail">${renderTail(maneColors)}</g>
          <g data-layer="body" class="layer-body">${renderBody(body)}</g>
          <g data-layer="head" class="layer-head">${renderHead(body, hornColors, mood)}</g>
          <g data-layer="mane" class="layer-mane">${renderMane(maneColors)}</g>
          <g data-layer="accessories" class="layer-accessories">${renderAccessories()}</g>
        </g>
      </svg>
    `;
  }

  function renderBody(body) {
    return `
      <g data-part="body">
        <ellipse cx="345" cy="330" rx="126" ry="98" fill="url(#bodyGradient)" stroke="${body.accent}" stroke-width="5" />
        <path d="M250 322c-12 10-22 30-23 49-1 30 24 50 55 50h126c31 0 56-20 55-50-1-19-11-39-23-49" fill="none" stroke="${body.accent}" stroke-width="5" stroke-linecap="round" opacity="0.34" />
        <path d="M275 407v56" stroke="${body.accent}" stroke-width="16" stroke-linecap="round" />
        <path d="M330 415v60" stroke="${body.accent}" stroke-width="16" stroke-linecap="round" />
        <path d="M390 415v60" stroke="${body.accent}" stroke-width="16" stroke-linecap="round" />
        <path d="M446 400v57" stroke="${body.accent}" stroke-width="16" stroke-linecap="round" />
        <circle cx="416" cy="282" r="7" fill="${body.accent}" opacity="0.7" />
      </g>
    `;
  }

  function renderHead(body, hornColors, mood) {
    return `
      <g data-part="head">
        <ellipse cx="478" cy="220" rx="96" ry="84" fill="url(#bodyGradient)" stroke="${body.accent}" stroke-width="5" />
        <path d="M435 240c0-38 26-68 70-68 18 0 34 4 45 14" fill="none" stroke="${body.accent}" stroke-width="5" stroke-linecap="round" opacity="0.28" />
        <path d="M444 267c14 22 43 35 67 35 27 0 53-13 67-36" fill="none" stroke="${body.accent}" stroke-width="5" stroke-linecap="round" opacity="0.25" />
        <g data-part="horn" class="layer-horn">${renderHorn(hornColors)}</g>
        <g data-part="face" class="layer-face">
          <g data-part="eyes" class="layer-eyes">
            <g class="eye-wrap eye-left" transform="translate(512 238)">
              <g class="eye-core">
                <ellipse class="eye-open" cx="0" cy="0" rx="10" ry="14" fill="#23304a" />
                <ellipse class="eye-half" cx="0" cy="2" rx="10" ry="4" fill="#23304a" />
                <circle cx="4" cy="-4" r="3" fill="#ffffff" />
              </g>
            </g>
            <g class="eye-wrap eye-right" transform="translate(552 238)">
              <g class="eye-core">
                <ellipse class="eye-open" cx="0" cy="0" rx="10" ry="14" fill="#23304a" />
                <ellipse class="eye-half" cx="0" cy="2" rx="10" ry="4" fill="#23304a" />
                <circle cx="4" cy="-4" r="3" fill="#ffffff" />
              </g>
            </g>
          </g>
          <g data-part="brows" class="layer-brows">
            <path d="M501 220c9-7 19-8 29-2" fill="none" stroke="#41506a" stroke-width="4" stroke-linecap="round" opacity="0.8" />
            <path d="M545 220c9-7 19-8 29-2" fill="none" stroke="#41506a" stroke-width="4" stroke-linecap="round" opacity="0.8" />
          </g>
          <g data-part="mouth" class="layer-mouth">
            <path class="expression-neutral" d="M529 273c11 0 19 0 31 0" fill="none" stroke="#a86d7e" stroke-width="5" stroke-linecap="round" />
            <path class="expression-happy" d="M526 270c12 11 27 11 39 0" fill="none" stroke="#f06a8e" stroke-width="5" stroke-linecap="round" />
            <path class="expression-sleeping" d="M528 271c12-4 24-4 36 0" fill="none" stroke="#a56a6e" stroke-width="5" stroke-linecap="round" />
            <path class="expression-hungry" d="M527 275c13-8 24-8 37 0" fill="none" stroke="#9a4f63" stroke-width="5" stroke-linecap="round" />
            <path class="expression-sick" d="M527 274c12 6 25 6 37 0" fill="none" stroke="#8e5675" stroke-width="5" stroke-linecap="round" />
          </g>
          <g data-part="sweat" class="layer-sweat">
            <path class="sweat-drop sweat-drop-1" d="M478 214c4 8 6 12 6 16 0 5-4 9-8 9s-8-4-8-9c0-4 2-8 10-16z" fill="#8fe0ff" opacity="0.92" />
            <path class="sweat-drop sweat-drop-2" d="M592 226c4 8 6 12 6 16 0 5-4 9-8 9s-8-4-8-9c0-4 2-8 10-16z" fill="#8fe0ff" opacity="0.86" />
          </g>
          <ellipse cx="492" cy="258" rx="11" ry="8" fill="#ffb0c0" opacity="0.22" />
          <ellipse cx="569" cy="258" rx="11" ry="8" fill="#ffb0c0" opacity="0.22" />
        </g>
      </g>
    `;
  }

  function renderMane(maneColors) {
    const stripes = maneColors
      .map((color, index) => {
        const x = 300 + index * 20;
        const y = 170 + Math.sin(index) * 8;
        return `<path d="M${x} ${y}c20-28 36-36 52-31 14 5 20 19 13 34-8 17-33 24-65 19z" fill="${color}" opacity="0.96" />`;
      })
      .join("");

    return `
      <g data-part="mane">
        <path d="M314 156c-16 28-22 58-15 84 7 29 28 49 50 58-7-13-10-26-7-40 5-23 22-37 37-50 18-15 30-32 31-53-21 9-38 7-58-2-17-8-31-8-38 3z" fill="url(#maneGradient)" opacity="0.95" />
        ${stripes}
        <path d="M289 229c18-15 38-19 59-11" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.18" />
      </g>
    `;
  }

  function renderTail(maneColors) {
    return `
      <g data-part="tail">
        <path d="M229 353c-38 8-62 40-59 74 3 33 29 54 60 60 22 4 39-1 52-13-25-5-44-18-55-39-10-19-12-40-5-61 5-15 12-23 20-29-3-2-8-2-13-2z" fill="url(#maneGradient)" opacity="0.95" />
        <path d="M196 368c16 4 32 15 44 33" fill="none" stroke="${maneColors[1]}" stroke-width="12" stroke-linecap="round" opacity="0.7" />
        <path d="M190 398c20-1 39 7 55 24" fill="none" stroke="${maneColors[3]}" stroke-width="12" stroke-linecap="round" opacity="0.65" />
        <path d="M205 433c16-3 31-2 45 4" fill="none" stroke="${maneColors[4]}" stroke-width="12" stroke-linecap="round" opacity="0.62" />
      </g>
    `;
  }

  function renderHorn(hornColors) {
    return `
      <path d="M544 123c11 18 17 37 17 57 0 16-6 30-17 42-4-13-9-21-15-28-6-8-8-18-7-31 2-16 10-31 22-40z" fill="url(#hornGradient)" stroke="${hornColors[1]}" stroke-width="4" stroke-linejoin="round" />
      <path d="M541 126c-7 15-8 31-4 47" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.45" />
      <path d="M544 126c10 17 14 36 11 58" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.35" />
    `;
  }

  function renderWings(wingsClass, wings) {
    if (!wings) return "";
    if (wingsClass === "feather") {
      return `
        <g data-part="wings" class="layer-wings feather" opacity="0.95">
          <path d="M294 245c-56-10-96 16-109 62 35 6 67-4 96-31 6-6 11-16 13-31z" fill="${wings.fill}" fill-opacity="${wings.opacity}" stroke="${wings.strokes[0]}" stroke-width="4" />
          <path d="M290 252c-36 16-61 38-78 67" fill="none" stroke="${wings.strokes[1]}" stroke-width="5" stroke-linecap="round" />
          <path d="M285 265c-31 18-48 33-64 58" fill="none" stroke="${wings.strokes[2]}" stroke-width="5" stroke-linecap="round" opacity="0.8" />
        </g>
      `;
    }

    return `
      <g data-part="wings" class="layer-wings butterfly" opacity="0.96">
        <path d="M301 247c-47-24-100 1-120 41 33 16 66 14 99-8 10-7 17-19 21-33z" fill="${wings.fill}" fill-opacity="${wings.opacity}" stroke="${wings.strokes[0]}" stroke-width="4" />
        <path d="M301 248c33-29 85-26 111 8-30 22-63 28-94 18-12-4-18-13-17-26z" fill="${wings.fill}" fill-opacity="${wings.opacity}" stroke="${wings.strokes[1]}" stroke-width="4" />
        <path d="M298 244c-10 10-17 23-22 40" fill="none" stroke="${wings.strokes[2]}" stroke-width="5" stroke-linecap="round" />
        <path d="M302 244c10 12 15 27 16 45" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.5" />
      </g>
    `;
  }

  function renderAccessories() {
    return `
      <g data-part="accessories" opacity="0">
        <circle cx="0" cy="0" r="0" />
      </g>
    `;
  }

  return {
    render,
    setMood,
    triggerAction,
    updateConfig,
  };
})();

const Game = (() => {
  const GOOD_STATE_THRESHOLD = 70;
  const GOOD_STATE_REWARD = 5;
  const CRITICAL_THRESHOLD = 10;
  const WARNING_THRESHOLD = 25;
  const LOW_THRESHOLD = 50;

  const ACTION_VALUES = {
    feed: {
      title: "Fuettern",
      hungerGainMin: 15,
      hungerGainMax: 20,
      cleanlinessLoss: 4,
      durationMs: 5000,
    },
    play: {
      title: "Spielen",
      happinessGain: 15,
      hungerLoss: 5,
      durationMs: 5000,
    },
    pet: {
      title: "Streicheln",
      happinessGain: 6,
      hungerLoss: 2,
      durationMs: 5000,
    },
    clean: {
      title: "Ausmisten",
      cleanlinessGain: 20,
      hungerLoss: 4,
      durationMs: 5000,
    },
    fly: {
      title: "Fliegen",
      happinessGain: 18,
      hungerLoss: 8,
      durationMs: 5000,
    },
    sleep: {
      title: "Schlafen",
      wakeHungerLoss: 20,
      wakeCleanlinessLoss: 2,
    },
    arzt: {
      title: "Arzt",
      healthSetTo: 100,
      happinessLoss: 50,
      minHealth: 20,
      durationMs: 5000,
    },
  };

  const STAT_LABELS = {
    hunger: "Hunger",
    happiness: "Glueck",
    cleanliness: "Sauberkeit",
    health: "Gesundheit",
    coins: "Coins",
    magicDust: "Magic Dust",
  };

  function getActionRequirementText(action, values) {
    switch (action) {
      case "feed":
        return "Voraussetzung: jederzeit verfuegbar.";
      case "play":
      case "pet":
      case "clean":
      case "fly":
        return "Voraussetzung: Gesundheit >= 20.";
      case "sleep":
        return state.activeAction === "sleep"
          ? "Voraussetzung: bereits eingeschlafen. Aufwachen beendet den Schlaf."
          : "Voraussetzung: jederzeit verfuegbar.";
      case "arzt":
        return `Voraussetzung: Gesundheit < ${values.minHealth}.`;
      default:
        return "Voraussetzung: jederzeit verfuegbar.";
    }
  }

  function formatSignedValue(value) {
    const rounded = roundValue(value);
    if (rounded > 0) return `+${rounded}`;
    if (rounded < 0) return `${rounded}`;
    return "0";
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function buildActionOverlay(action) {
    const values = ACTION_VALUES[action];
    if (!values) return null;
    const title = values.title;

    const lines = [];

    const addLine = (label, value, tone, note) => {
      lines.push({ label, value, tone, note });
    };

    if (action === "feed") {
      addLine(STAT_LABELS.hunger, `+${values.hungerGainMin} bis +${values.hungerGainMax}`, "positive");
      addLine(STAT_LABELS.cleanliness, formatSignedValue(-values.cleanlinessLoss), "negative");
      addLine("Status", "Animation laeuft 5 Sekunden, Effekte danach.", "special");
      addLine(STAT_LABELS.coins, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.magicDust, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.health, "keine Aenderung", "neutral");
    } else if (action === "play") {
      addLine(STAT_LABELS.happiness, `+${values.happinessGain}`, "positive");
      addLine(STAT_LABELS.hunger, formatSignedValue(-values.hungerLoss), "negative");
      addLine(STAT_LABELS.cleanliness, "-2", "negative");
      addLine("Status", "Animation laeuft 5 Sekunden, Effekte danach.", "special");
      addLine(STAT_LABELS.coins, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.magicDust, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.health, "keine Aenderung", "neutral");
    } else if (action === "pet") {
      addLine(STAT_LABELS.happiness, `+${values.happinessGain}`, "positive");
      addLine(STAT_LABELS.hunger, formatSignedValue(-values.hungerLoss), "negative");
      addLine(STAT_LABELS.cleanliness, "-1", "negative");
      addLine("Status", "Animation laeuft 5 Sekunden, Effekte danach.", "special");
      addLine(STAT_LABELS.coins, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.magicDust, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.health, "keine Aenderung", "neutral");
    } else if (action === "clean") {
      addLine(STAT_LABELS.cleanliness, `+${values.cleanlinessGain}`, "positive");
      addLine(STAT_LABELS.hunger, formatSignedValue(-values.hungerLoss), "negative");
      addLine("Status", "Animation laeuft 5 Sekunden, Effekte danach.", "special");
      addLine(STAT_LABELS.coins, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.magicDust, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.health, "keine Aenderung", "neutral");
    } else if (action === "fly") {
      addLine(STAT_LABELS.happiness, `+${values.happinessGain}`, "positive");
      addLine(STAT_LABELS.hunger, formatSignedValue(-values.hungerLoss), "negative");
      addLine(STAT_LABELS.cleanliness, "-2", "negative");
      addLine("Status", "Animation laeuft 5 Sekunden, Effekte danach.", "special");
      addLine(STAT_LABELS.coins, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.magicDust, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.health, "keine Aenderung", "neutral");
    } else if (action === "sleep") {
      addLine("Status", "Schlaf-Animation bleibt aktiv bis Aufwachen.", "special");
      addLine(STAT_LABELS.hunger, formatSignedValue(-values.wakeHungerLoss), "negative");
      addLine(STAT_LABELS.cleanliness, formatSignedValue(-values.wakeCleanlinessLoss), "negative");
      addLine(STAT_LABELS.happiness, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.coins, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.magicDust, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.health, "keine Aenderung", "neutral");
    } else if (action === "arzt") {
      addLine(STAT_LABELS.health, `= ${values.healthSetTo}`, "special");
      addLine(STAT_LABELS.happiness, formatSignedValue(-values.happinessLoss), "negative");
      addLine("Status", "Animation laeuft 5 Sekunden, Effekte danach.", "special");
      addLine(STAT_LABELS.coins, "keine Aenderung", "neutral");
      addLine(STAT_LABELS.magicDust, "keine Aenderung", "neutral");
    }

    const coveredLabels = new Set(lines.map((line) => line.label));
    [
      STAT_LABELS.hunger,
      STAT_LABELS.happiness,
      STAT_LABELS.cleanliness,
      STAT_LABELS.health,
      STAT_LABELS.coins,
      STAT_LABELS.magicDust,
    ].forEach((label) => {
      if (!coveredLabels.has(label)) {
        addLine(label, "keine Aenderung", "neutral");
      }
    });

    const requirement = getActionRequirementText(action, values);

    lines.push({ label: "Hinweis", value: requirement, tone: "special" });

    return { title, lines };
  }

  const defaultState = () => ({
    stats: {
      hunger: 78,
      happiness: 82,
      cleanliness: 70,
    },
    health: 100,
    coins: 0,
    magicDust: 0,
    mood: "neutral",
    moodSnapshot: null,
    activeAction: null,
    activityUntil: 0,
    lastUpdated: Date.now(),
    lastRewardAt: 0,
    config: { ...unicornConfig },
  });

  let state = loadState();
  let tickTimer = null;
  let uiBound = false;

  function loadState() {
    const fallback = defaultState();
    try {
      const raw = readStorage();
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return {
        ...fallback,
        ...parsed,
        stats: { ...fallback.stats, ...(parsed.stats || {}) },
        config: { ...fallback.config, ...(parsed.config || {}) },
      };
    } catch {
      return fallback;
    }
  }

  function syncActivityState(now = Date.now()) {
    if (!state.activeAction) return;
    if (state.activeAction === "sleep") return;
    if (now < state.activityUntil) return;
  }

  function persistState() {
    state.lastUpdated = Date.now();
    writeStorage(JSON.stringify(state));
  }

  function advanceOfflineProgress() {
    const now = Date.now();
    const elapsed = now - state.lastUpdated;
    const ticks = Math.floor(elapsed / OFFLINE_TICK_MS);
    if (ticks <= 0) return;
    for (let i = 0; i < ticks; i += 1) {
      applyTick(false);
    }
    state.lastUpdated = now;
  }

  function applyCriticalHealthLoss() {
    const hungerCrisis = state.stats.hunger < 20;
    const healthLoss = hungerCrisis ? 2 : 0;

    if (healthLoss > 0) {
      state.health = clamp(roundValue(state.health - healthLoss), 0, 100);
    }
  }

  function applyTick(shouldPersist = true) {
    syncActivityState();
    if (state.activeAction) {
      if (shouldPersist) persistState();
      return;
    }

    state.stats.hunger = clamp(roundValue(state.stats.hunger - 1), 0, 100);
    state.stats.happiness = clamp(roundValue(state.stats.happiness - 1), 0, 100);
    state.stats.cleanliness = clamp(roundValue(state.stats.cleanliness - 1), 0, 100);

    applyCriticalHealthLoss();

    if (
      state.stats.hunger > GOOD_STATE_THRESHOLD &&
      state.health > GOOD_STATE_THRESHOLD
    ) {
      rewardCoins(GOOD_STATE_REWARD);
    }

    if (state.health < CRITICAL_THRESHOLD) {
      setHint("Kritischer Zustand: Ressourcen stabilisieren.");
    } else if (state.stats.hunger < WARNING_THRESHOLD) {
      setHint("Warnung: Ein oder mehrere Werte sind kritisch.");
    }

    updateMoodFromStats();
    updateActionLocks();
    renderHUD();
    if (shouldPersist) persistState();
  }

  function gameTick() {
    applyTick(true);
  }

  function rewardCoins(amount) {
    state.coins += amount;
  }

  function rewardDust(amount) {
    state.magicDust += amount;
  }

  function applyActionEffects(action) {
    switch (action) {
      case "feed":
        state.stats.hunger = clamp(
          state.stats.hunger + randomInt(ACTION_VALUES.feed.hungerGainMin, ACTION_VALUES.feed.hungerGainMax),
          0,
          100,
        );
        state.stats.cleanliness = clamp(state.stats.cleanliness - ACTION_VALUES.feed.cleanlinessLoss, 0, 100);
        break;
      case "play":
        state.stats.happiness = clamp(state.stats.happiness + ACTION_VALUES.play.happinessGain, 0, 100);
        state.stats.hunger = clamp(state.stats.hunger - ACTION_VALUES.play.hungerLoss, 0, 100);
        state.stats.cleanliness = clamp(state.stats.cleanliness - 2, 0, 100);
        break;
      case "pet":
        state.stats.happiness = clamp(state.stats.happiness + ACTION_VALUES.pet.happinessGain, 0, 100);
        state.stats.hunger = clamp(state.stats.hunger - ACTION_VALUES.pet.hungerLoss, 0, 100);
        state.stats.cleanliness = clamp(state.stats.cleanliness - 1, 0, 100);
        break;
      case "clean":
        state.stats.cleanliness = clamp(state.stats.cleanliness + ACTION_VALUES.clean.cleanlinessGain, 0, 100);
        state.stats.hunger = clamp(state.stats.hunger - ACTION_VALUES.clean.hungerLoss, 0, 100);
        break;
      case "fly":
        state.stats.happiness = clamp(state.stats.happiness + ACTION_VALUES.fly.happinessGain, 0, 100);
        state.stats.hunger = clamp(state.stats.hunger - ACTION_VALUES.fly.hungerLoss, 0, 100);
        state.stats.cleanliness = clamp(state.stats.cleanliness - 2, 0, 100);
        break;
      case "arzt":
        state.health = ACTION_VALUES.arzt.healthSetTo;
        state.stats.happiness = clamp(state.stats.happiness - ACTION_VALUES.arzt.happinessLoss, 0, 100);
        break;
      default:
        break;
    }
  }

  function completeAction(action) {
    if (state.activeAction !== action) return;
    window.clearTimeout(applyAction._timer);

    if (action === "sleep") {
      state.stats.hunger = clamp(state.stats.hunger - ACTION_VALUES.sleep.wakeHungerLoss, 0, 100);
      state.stats.cleanliness = clamp(state.stats.cleanliness - ACTION_VALUES.sleep.wakeCleanlinessLoss, 0, 100);
      state.moodSnapshot = null;
      state.activeAction = null;
      state.activityUntil = 0;
      UnicornRenderer.triggerAction(null, null);
      updateMoodFromStats(true);
      updateActionLocks();
      renderHUD();
      persistState();
      return;
    }

    applyActionEffects(action);
    state.moodSnapshot = null;
    updateMoodFromStats(true);
    state.activeAction = null;
    state.activityUntil = 0;
    UnicornRenderer.triggerAction(null, null);
    updateActionLocks();
    renderHUD();
    persistState();
  }

  function canAct(action) {
    syncActivityState();
    if (state.activeAction === "sleep") {
      return action === "sleep";
    }
    if (state.activeAction) return false;
    if (action === "feed") {
      return true;
    }
    if (action === "arzt") {
      return state.health < ACTION_VALUES.arzt.minHealth;
    }
    if (state.health < ACTION_VALUES.arzt.minHealth) {
      return action === "sleep" || action === "feed" || action === "arzt";
    }
    return Boolean(ACTION_VALUES[action]);
  }

  function getActionLockReason(action) {
    syncActivityState();
    if (state.activeAction === "sleep" && action !== "sleep") {
      return "Das Einhorn schlaeft. Erst auf Aufwachen klicken, dann sind andere Aktionen wieder moeglich.";
    }
    if (state.activeAction && action !== state.activeAction) {
      return "Waerend einer Aktion sind keine weiteren Aktionen moeglich.";
    }

    if (action === "arzt") {
      if (state.health >= ACTION_VALUES.arzt.minHealth) {
        return `Aktuell gesperrt, weil Gesundheit noch ueber ${ACTION_VALUES.arzt.minHealth} liegt.`;
      }
    }

    if (["play", "pet", "clean", "fly"].includes(action) && state.health < ACTION_VALUES.arzt.minHealth) {
      return "Gesundheit muss mindestens 20 sein, damit diese Aktion ausgefuehrt werden kann.";
    }

    if (state.health < ACTION_VALUES.arzt.minHealth && action !== "sleep" && action !== "feed" && action !== "arzt") {
      return "Bei Gesundheit unter 20 sind nur Fuettern, Schlafen und Arzt verfuegbar.";
    }

    return "Aktuell gesperrt, weil eine Ressource fehlt.";
  }

  function applyAction(action) {
    syncActivityState();
    if (!canAct(action)) {
      setHint(getActionLockReason(action));
      return;
    }

    state.moodSnapshot = state.mood;

    switch (action) {
      case "feed":
        setHint("Fuetterung laeuft.");
        break;
      case "play":
        setHint("Spielrunde laeuft.");
        break;
      case "pet":
        setHint("Streicheln laeuft.");
        break;
      case "clean":
        setHint("Ausmisten laeuft.");
        break;
      case "fly":
        setHint("Flug laeuft.");
        break;
      case "sleep":
        if (state.activeAction === "sleep") {
          state.stats.hunger = clamp(state.stats.hunger - ACTION_VALUES.sleep.wakeHungerLoss, 0, 100);
          state.stats.cleanliness = clamp(state.stats.cleanliness - ACTION_VALUES.sleep.wakeCleanlinessLoss, 0, 100);
          state.activeAction = null;
          state.activityUntil = 0;
          state.moodSnapshot = null;
          UnicornRenderer.triggerAction(null);
          setHint("Einhorn wacht auf.");
          updateMoodFromStats(true);
          updateActionLocks();
          renderHUD();
          persistState();
          return;
        }
        setHint("Einhorn schlummert ein.");
        break;
      case "arzt":
        setHint("Arzt laeuft.");
        break;
      default:
        return;
    }

    state.activeAction = action;
    state.activityUntil = action === "sleep" ? 0 : Date.now() + (ACTION_VALUES[action].durationMs || 5000);
    UnicornRenderer.triggerAction(action, action === "sleep" ? null : (ACTION_VALUES[action].durationMs || 5000));
    updateActionLocks();
    renderHUD();
    persistState();

    window.clearTimeout(applyAction._timer);
    if (action !== "sleep") {
      applyAction._timer = window.setTimeout(() => {
        completeAction(action);
      }, ACTION_VALUES[action].durationMs || 5000);
    }
  }

  function updateMoodFromStats(force = false) {
    syncActivityState();
    if (state.activeAction && !force) {
      UnicornRenderer.setMood(state.moodSnapshot || state.mood);
      return;
    }
    if (state.activeAction) {
      state.moodSnapshot = null;
    }

    if (state.health < ACTION_VALUES.arzt.minHealth) {
      state.mood = "sick";
      UnicornRenderer.setMood("sick");
      return;
    }

    if (state.stats.hunger < WARNING_THRESHOLD) {
      state.mood = "hungry";
    } else if (state.stats.happiness > GOOD_STATE_THRESHOLD) {
      state.mood = "happy";
    } else {
      state.mood = "neutral";
    }

    UnicornRenderer.setMood(state.mood);
  }

  function updateActionLocks() {
    const buttons = document.querySelectorAll("#action-controls [data-action]");
    buttons.forEach((button) => {
      const action = button.dataset.action;
      const locked = !canAct(action);
      button.disabled = false;
      button.setAttribute("aria-disabled", locked ? "true" : "false");
      button.classList.toggle("is-locked", locked);
    });
  }

  function renderHUD() {
    const map = [
      ["hunger", "hungerFill", "hungerValue"],
      ["happiness", "happinessFill", "happinessValue"],
      ["cleanliness", "cleanlinessFill", "cleanlinessValue"],
    ];

    map.forEach(([key, fillId, valueId]) => {
      const fill = document.querySelector(`#${fillId}`);
      const value = document.querySelector(`#${valueId}`);
      const current = clamp(state.stats[key], 0, 100);
      if (fill) {
        fill.style.transform = `scaleX(${current / 100})`;
        fill.classList.remove("is-low", "is-mid", "is-high", "is-critical");
        if (current < CRITICAL_THRESHOLD) {
          fill.classList.add("is-critical");
        } else if (current < WARNING_THRESHOLD) {
          fill.classList.add("is-low");
        } else if (current < LOW_THRESHOLD) {
          fill.classList.add("is-mid");
        } else {
          fill.classList.add("is-high");
        }
      }
      if (value) {
        value.textContent = `${Math.round(current)}`;
      }
    });

    const healthFill = document.querySelector("#healthFill");
    const healthValue = document.querySelector("#healthValue");
    if (healthFill) {
      healthFill.style.transform = `scaleX(${state.health / 100})`;
      healthFill.classList.remove("is-low", "is-mid", "is-high", "is-critical");
      if (state.health < CRITICAL_THRESHOLD) {
        healthFill.classList.add("is-critical");
      } else if (state.health < WARNING_THRESHOLD) {
        healthFill.classList.add("is-low");
      } else if (state.health < LOW_THRESHOLD) {
        healthFill.classList.add("is-mid");
      } else {
        healthFill.classList.add("is-high");
      }
    }
    if (healthValue) healthValue.textContent = `${Math.round(state.health)}`;

    const moodBadge = document.querySelector("#moodBadge");
    const activityBadge = document.querySelector("#activityBadge");
    const coinsBadge = document.querySelector("#coinsBadge");
    const dustBadge = document.querySelector("#dustBadge");
    if (moodBadge) {
      moodBadge.textContent = `Mood: ${state.mood}`;
      moodBadge.classList.remove("is-warning", "is-danger");
      if (state.health < ACTION_VALUES.arzt.minHealth) {
        moodBadge.classList.add("is-danger");
      } else if (state.health < WARNING_THRESHOLD || state.stats.hunger < WARNING_THRESHOLD) {
        moodBadge.classList.add("is-danger");
      } else if (state.health < LOW_THRESHOLD) {
        moodBadge.classList.add("is-warning");
      }
    }
    if (activityBadge) {
      const activityLabel = state.activeAction === "sleep" ? "sleeping" : state.activeAction || "idle";
      activityBadge.textContent = `Aktivitaet: ${activityLabel}`;
      activityBadge.classList.remove("is-warning", "is-danger");
      if (state.activeAction) {
        activityBadge.classList.add("is-warning");
      }
    }
    if (coinsBadge) coinsBadge.textContent = `Coins: ${state.coins}`;
    if (dustBadge) dustBadge.textContent = `Dust: ${state.magicDust}`;

    const arztButton = document.querySelector('#action-controls [data-action="arzt"]');
    if (arztButton) {
      arztButton.textContent = "Arzt";
    }

    const sleepButton = document.querySelector('#action-controls [data-action="sleep"]');
    if (sleepButton) {
      sleepButton.textContent = state.activeAction === "sleep" ? "Aufwachen" : "Schlafen";
    }
  }

  function restoreActivityAfterReload() {
    syncActivityState();
    if (!state.activeAction) {
      UnicornRenderer.triggerAction(null, null);
      window.clearTimeout(applyAction._timer);
      return;
    }

    const remainingMs =
      state.activeAction === "sleep" ? null : Math.max(0, state.activityUntil - Date.now());
    UnicornRenderer.triggerAction(
      state.activeAction,
      state.activeAction === "sleep" ? null : remainingMs,
    );

    window.clearTimeout(applyAction._timer);
    if (state.activeAction !== "sleep") {
      if (remainingMs <= 0) {
        completeAction(state.activeAction);
        return;
      }

      applyAction._timer = window.setTimeout(() => {
        completeAction(state.activeAction);
      }, remainingMs);
    }
  }

  function setHint(text) {
    const hint = document.querySelector("#statusHint");
    if (hint) hint.textContent = text;
  }

  function showActionOverlay(action) {
    const overlayTitle = document.querySelector("#actionOverlayTitle");
    const overlayBody = document.querySelector("#actionOverlayBody");
    const effect = buildActionOverlay(action);
    if (!overlayTitle || !overlayBody || !effect) return;
    const lockedNote = canAct(action) ? "" : getActionLockReason(action);
    overlayTitle.textContent = effect.title;
    overlayBody.innerHTML = renderActionOverlayLines(effect.lines, lockedNote);
  }

  function renderActionOverlayLines(lines, lockedNote) {
    const items = lines
      .map((line) => {
        const toneClass = `is-${line.tone}`;
        return `
          <li>
            <span class="effect-label">${line.label}</span>
            <span class="effect-separator">:</span>
            <span class="effect-value ${toneClass}">${line.value}</span>
          </li>
        `;
      })
      .join("");

    const lockedMarkup = lockedNote
      ? `<li><span class="effect-note">${lockedNote}</span></li>`
      : "";

    return `${items}${lockedMarkup}`;
  }

  function resetActionOverlay() {
    const overlayTitle = document.querySelector("#actionOverlayTitle");
    const overlayBody = document.querySelector("#actionOverlayBody");
    if (overlayTitle) overlayTitle.textContent = "Button-Effekt";
    if (overlayBody) {
      overlayBody.innerHTML = "<li>Bewege den Mauszeiger ueber eine Aktion oder fokussiere sie per Tastatur.</li>";
    }
  }

  function applyCheat(cheat) {
    switch (cheat) {
      case "coins-100":
        state.coins += 100;
        setHint("Cheat: +100 Coins.");
        break;
      case "hunger-0":
        state.stats.hunger = 0;
        setHint("Cheat: Hunger auf 0 gesetzt.");
        break;
      case "hunger-100":
        state.stats.hunger = 100;
        setHint("Cheat: Hunger auf 100 gesetzt.");
        break;
      case "cleanliness-0":
        state.stats.cleanliness = 0;
        setHint("Cheat: Sauberkeit auf 0 gesetzt.");
        break;
      case "cleanliness-100":
        state.stats.cleanliness = 100;
        setHint("Cheat: Sauberkeit auf 100 gesetzt.");
        break;
      case "health-100":
        state.health = 100;
        setHint("Cheat: Gesundheit auf 100 gesetzt.");
        break;
      default:
        return;
    }

    updateMoodFromStats();
    updateActionLocks();
    renderHUD();
    persistState();
  }

  function bindUI() {
    if (uiBound) return;
    uiBound = true;

    const actionControls = document.querySelector("#action-controls");
    actionControls?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button || button.getAttribute("aria-disabled") === "true") return;
      applyAction(button.dataset.action);
    });

    actionControls?.addEventListener("pointerover", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      showActionOverlay(button.dataset.action);
    });

    actionControls?.addEventListener("focusin", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      showActionOverlay(button.dataset.action);
    });

    const actionOverlay = document.querySelector("#actionOverlay");
    actionOverlay?.addEventListener("toggle", () => {
      if (!actionOverlay.open) {
        resetActionOverlay();
      }
    });

    const cheatControls = document.querySelector("#cheat-controls");
    cheatControls?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cheat]");
      if (!button) return;
      applyCheat(button.dataset.cheat);
    });

    document.querySelector("#bodyColorSelect")?.addEventListener("change", (event) => {
      state.config.bodyColor = event.target.value;
      UnicornRenderer.updateConfig({ bodyColor: event.target.value });
      persistState();
    });

    document.querySelector("#maneStyleSelect")?.addEventListener("change", (event) => {
      state.config.maneStyle = event.target.value;
      UnicornRenderer.updateConfig({ maneStyle: event.target.value });
      persistState();
    });

    document.querySelector("#hornTypeSelect")?.addEventListener("change", (event) => {
      state.config.hornType = event.target.value;
      UnicornRenderer.updateConfig({ hornType: event.target.value });
      persistState();
    });

    document.querySelector("#wingsSelect")?.addEventListener("change", (event) => {
      state.config.wings = event.target.value;
      UnicornRenderer.updateConfig({ wings: event.target.value });
      persistState();
    });

    window.addEventListener("unicorn:action", (event) => {
      if (event.detail?.action) applyAction(event.detail.action);
    });
  }

  function syncConfigControls() {
    const bodySelect = document.querySelector("#bodyColorSelect");
    const maneSelect = document.querySelector("#maneStyleSelect");
    const hornSelect = document.querySelector("#hornTypeSelect");
    const wingsSelect = document.querySelector("#wingsSelect");
    if (bodySelect) bodySelect.value = state.config.bodyColor;
    if (maneSelect) maneSelect.value = state.config.maneStyle;
    if (hornSelect) hornSelect.value = state.config.hornType;
    if (wingsSelect) wingsSelect.value = state.config.wings;
  }

  function start() {
    const stage = document.querySelector("#unicorn-stage");
    if (!stage) return;

    bindUI();
    advanceOfflineProgress();
    syncActivityState();
    syncConfigControls();
    updateMoodFromStats();
    restoreActivityAfterReload();
    UnicornRenderer.render(stage, state.config);
    updateActionLocks();
    renderHUD();
    resetActionOverlay();
    window.unicornConfig = state.config;

    window.clearInterval(tickTimer);
    tickTimer = window.setInterval(gameTick, TICK_MS);
    persistState();
  }

  return {
    start,
    getState: () => state,
  };
})();

document.addEventListener("DOMContentLoaded", Game.start);

window.unicornConfig = unicornConfig;
window.UnicornRenderer = UnicornRenderer;
window.setMood = UnicornRenderer.setMood;
