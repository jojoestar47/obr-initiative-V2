# OBR Initiative Tracker

A full-featured combat initiative tracker extension for [Owlbear Rodeo](https://owlbear.rodeo), built with Vite + React.

## Features

- **Initiative Tracker** — Click selected OBR tokens to add them to combat, or add manually. Drag to reorder. Full round/turn tracking.
- **Roll Modes** — Auto-roll (d20 + bonus), Manual (type your physical dice result), or Set (enter initiative directly).
- **Health Bars** — Always visible as bars. GM sees exact HP numbers; players see bars only for monsters. Full HP is shown for player characters.
- **DM Panel** — Gated by OBR's GM role flag. GMs see AC, exact HP, HP adjust buttons, notes, and inline stat block view. Players see only what the GM reveals.
- **Conditions** — Full 2024 D&D condition set with icons. Click to apply/remove.
- **Stat Block Bestiary** — Import JSON files (single creature or array). Searchable list with full 2024 D&D format viewer. Export individual creatures or the whole library.
- **Encounter Builder** — Build named encounter groups from your bestiary. Assign OBR tokens from the current scene to each monster type. Deploy an encounter directly to the initiative tracker with one click.

---

## Stat Block JSON Format

The tracker uses the 2024 D&D stat block format. See `public/example-statblocks.json` for full examples.

```json
{
  "name": "Goblin",
  "size": "Small",
  "type": "Humanoid",
  "alignment": "Neutral Evil",
  "ac": 15,
  "ac_source": "leather armor, shield",
  "initiative_bonus": 2,
  "hp_average": 7,
  "hp_formula": "2d6",
  "speed": { "walk": 30 },
  "stats": { "str": 8, "dex": 14, "con": 10, "int": 10, "wis": 8, "cha": 8 },
  "saves": { "str": null, "dex": null, "con": null, "int": null, "wis": null, "cha": null },
  "skills": { "Stealth": 6 },
  "damage_resistances": [],
  "damage_immunities": [],
  "condition_immunities": [],
  "senses": "Darkvision 60 ft., Passive Perception 9",
  "languages": ["Common", "Goblin"],
  "cr": "1/4",
  "xp": 50,
  "pb": 2,
  "traits": [{ "name": "Nimble Escape", "desc": "..." }],
  "actions": [{ "name": "Scimitar", "desc": "..." }],
  "bonus_actions": [],
  "reactions": [],
  "legendary_actions": [],
  "legendary_resistances": null,
  "lair_actions": [],
  "source": "SRD"
}
```

### Notes
- `saves`: Use `null` for saves the creature has no proficiency in. Use the full modifier value (e.g. `5`) for proficient saves.
- `legendary_resistances`: Use a number (e.g. `3`) or `null`.
- `speed`: Include only relevant movement types. Keys: `walk`, `fly`, `swim`, `climb`, `burrow`.
- You can import an array of stat blocks in a single JSON file.

---

## Development

```bash
npm install
npm run dev
```

Then in Owlbear Rodeo:
1. Go to **Settings > Extensions**
2. Add extension with URL: `http://localhost:5173/manifest.json`

The extension opens as a **popover** (action button in the OBR toolbar).

---

## Build & Deploy

```bash
npm run build
```

Deploy the `dist/` folder to Vercel (or any static host):

```bash
vercel deploy dist/
```

Then update your OBR extension URL to point at the production manifest:
`https://your-deployment.vercel.app/manifest.json`

---

## Architecture

```
src/
  types/          — TypeScript interfaces (StatBlock, Combatant, SavedEncounter, etc.)
  stores/
    initiativeStore.ts   — Zustand store for combat state (persisted)
    libraryStore.ts      — Zustand store for stat blocks + encounters (persisted)
  hooks/
    useOBR.ts     — OBR SDK integration (GM detection, token sync, scene items)
  components/
    InitiativePanel.tsx  — Main combat tracker view
    CombatantRow.tsx     — Individual combatant row with HP, conditions, GM panel
    AddCombatantModal.tsx — Manual add modal with roll mode support
    EncounterPanel.tsx   — Encounter builder and deploy
    StatBlockPanel.tsx   — Bestiary import, search, and full stat block viewer
  utils/
    index.ts      — Dice rolling, modifiers, formatting, JSON import/export
  styles.css      — Full dark parchment theme (Cinzel + Crimson Pro)
public/
  manifest.json          — OBR extension manifest
  icon.svg               — Extension icon
  example-statblocks.json — Sample creatures to import
```

---

## Persistence

All data is stored in `localStorage`:
- `obr-initiative-tracker` — current combat state (combatants, round, turn)
- `obr-library` — stat blocks and saved encounters

Combat state survives page refreshes. Clear via the **Clear** button in the tracker or via browser DevTools if needed.

---

## Roadmap / Future Ideas

- Supabase backend for cross-device sync (swap out localStorage stores)
- Heliana monster DB integration (pull directly from your existing Supabase project)
- Player-facing view (separate URL that shows filtered initiative info)
- Death saves tracking for player characters
- Initiative tiebreaker (DEX tiebreak or manual swap)
- Token HP bar overlay on the OBR canvas (via OBR attachments API)
