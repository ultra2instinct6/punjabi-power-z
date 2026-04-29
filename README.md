# Punjabi Power Z — Warrior from Peshtigo

A kid-friendly Punjabi learning game inspired by anime training arcs. Vanilla JS, no account, saves on-device.

## Quick start

```bash
npm install      # one-time
npm run dev      # Vite dev server with HMR
npm run build    # production bundle into dist/
npm run preview  # preview the production build
npm test         # run unit tests (Vitest)
npm run lint     # ESLint flat config
npm run format   # Prettier --write
```

No build step is required to run the app — opening `index.html` directly still works.

## Project layout

```
punjabi-power-z/
├── index.html               # app entry (loads tuning → deck → medicine → script)
├── script.js                # legacy IIFE (consumes window.PPZ_* globals)
│
├── src/
│   ├── config/              # tuning.data.js (RANKS, ENEMIES, BATTLE, SRS, ...)
│   ├── data/                # deck.data.js (1,235 cards), medicine-bank.data.js (201 Qs)
│   ├── lib/                 # progression.js (pure helpers, ES module, tested)
│   ├── styles/              # 14 CSS partials + main.css aggregator
│   └── game/ ui/ storage/ utils/   # scaffolds for Phase 3 (DOM decoupling)
│
├── assets/
│   └── images/              # logo.png, avatar.png, enemy.png
│
├── tests/
│   ├── unit/                # Vitest suites (45 tests)
│   └── fixtures/            # vm sandbox loader for the IIFE data files
│
└── docs/                    # ARCHITECTURE.md, GAME-RULES.md
```

See `docs/ARCHITECTURE.md` for the migration plan and module boundaries.

## Status

- [x] Phase 1 — Scaffolding (folders, configs, asset reorg)
- [x] Phase 2 — Extract DECK + MEDICINE_BANK + tuning constants
- [ ] Phase 3 — Decouple UI from game logic (deferred; tests in place as safety net)
- [x] Phase 4 — Split `style.css` into 14 partials under `src/styles/`
- [x] Phase 5 — Vite + ESLint + Prettier + Vitest wired
- [x] Phase 6 — 45 unit tests covering config, deck, medicine bank, progression

## License

Private — all rights reserved.
