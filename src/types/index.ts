// ─── Stat Block ───────────────────────────────────────────────────────────────

export interface StatSpeed {
  walk?: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

export interface StatBlock {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  ac: number;
  ac_source?: string;
  initiative_bonus: number;
  hp_average: number;
  hp_formula: string;
  speed: StatSpeed;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  saves: {
    str: number | null;
    dex: number | null;
    con: number | null;
    int: number | null;
    wis: number | null;
    cha: number | null;
  };
  skills: Record<string, number>;
  damage_resistances: string[];
  damage_immunities: string[];
  condition_immunities: string[];
  senses: string;
  languages: string[];
  cr: string;
  xp: number;
  pb: number;
  traits: { name: string; desc: string }[];
  actions: { name: string; desc: string }[];
  bonus_actions: { name: string; desc: string }[];
  reactions: { name: string; desc: string }[];
  legendary_actions: { name: string; desc: string }[];
  legendary_resistances?: number | null;
  lair_actions: { name: string; desc: string }[];
  source: string;
}

// ─── Initiative ───────────────────────────────────────────────────────────────

export type InitiativeRollMode = "auto" | "manual" | "set";

export interface CombatantCondition {
  name: string;
  icon: string;
}

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  initiativeBonus: number;
  hp: number;
  maxHp: number;
  ac: number;
  isPlayer: boolean;
  isVisible: boolean; // visible to players
  tokenId?: string; // OBR token ID
  statBlockId?: string;
  conditions: CombatantCondition[];
  notes?: string;
  color?: string; // for grouping multiple of same monster
  count?: number; // display index for duplicate names
}

// ─── Encounters ───────────────────────────────────────────────────────────────

export interface EncounterMonster {
  statBlockId: string;
  quantity: number;
  tokenImageUrl?: string; // OBR image URL selected at encounter build time
  tokenImageId?: string; // OBR image asset ID
}

export interface SavedEncounter {
  id: string;
  name: string;
  description?: string;
  monsters: EncounterMonster[];
  createdAt: number;
  updatedAt: number;
}

// ─── App State ────────────────────────────────────────────────────────────────

export type AppTab = "initiative" | "encounters" | "statblocks";

export interface OBRToken {
  id: string;
  name: string;
  imageUrl?: string;
  isPlayer: boolean;
}
