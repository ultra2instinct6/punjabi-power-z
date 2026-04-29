# Architecture

This document captures the target structure for Punjabi Power Z and how the legacy
monolithic files (`script.js`, `medicine-bank.js`, `style.css`) will migrate into it.

## Module boundaries

```
┌────────────────────────────────────────────────────────────┐
│  index.html  (semantic markup only — no inline logic)      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  src/main.js  — bootstraps GameEngine + UIController       │
└────────────────────────────────────────────────────────────┘
        │                                       │
        ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│  src/game/           │  ◄── pure ── │  src/ui/             │
│  • GameEngine        │     state    │  • UIController      │
│  • BattleSystem      │              │  • screens/          │
│  • TrainingSystem    │              │  • components/       │
│  • Player, Enemy     │              └──────────────────────┘
└──────────────────────┘                       │
        │                                      │
        ▼                                      ▼
┌──────────────────────┐              ┌──────────────────────┐
│  src/data/*.json     │              │  src/styles/*.css    │
│  src/config/*.js     │              │  src/utils/audio.js  │
│  src/storage/        │              │  src/utils/random.js │
└──────────────────────┘              └──────────────────────┘
```

## Rules

- Files under `src/game/**` MUST NOT touch `document`, `window`, or DOM APIs.
- Files under `src/ui/**` are the only callers of DOM APIs.
- Persistence calls go through `src/storage/LocalStorageManager.js` — never call
  `localStorage` directly.
- Data (cards, enemies, medical Q&A) lives as JSON under `src/data/`. No code in
  data files.
- Magic numbers (SRS intervals, XP thresholds, damage formulas) live in
  `src/config/*.config.js`.

## Migration map

| Legacy source                  | Target                                              |
| ------------------------------ | --------------------------------------------------- |
| `script.js` — game logic       | `src/game/{GameEngine,BattleSystem,TrainingSystem,Player,Enemy}.js` |
| `script.js` — DECK array       | `src/data/deck.json`                                |
| `script.js` — SRS/XP constants | `src/config/{srs,battle,xp}.config.js`              |
| `script.js` — DOM/event code   | `src/ui/UIController.js` + `src/ui/screens/*`       |
| `script.js` — localStorage     | `src/storage/LocalStorageManager.js`                |
| `script.js` — TTS              | `src/utils/audio.js`                                |
| `medicine-bank.js`             | `src/data/medical-bank.json` (+ MedicineScreen)     |
| `style.css`                    | `src/styles/{main,design-system,components,screens,animations,responsive}.css` |
| `assets/*.png`                 | `assets/images/*.png`                               |

## Verification gates

- `grep -r "document\." src/game/` returns zero matches.
- `grep -r "localStorage" src/game/ src/ui/` returns zero matches (must go via `src/storage/`).
- `index.html` contains no inline `<script>` blocks.
- `npm run lint` is clean and `npm run test` passes with ≥70 % coverage on `src/game/**`.
