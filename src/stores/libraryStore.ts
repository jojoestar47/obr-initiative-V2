import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StatBlock, SavedEncounter, EncounterMonster } from "../types";
import { v4 as uuidv4 } from "uuid";

interface LibraryStore {
  statBlocks: StatBlock[];
  encounters: SavedEncounter[];

  // Stat block actions
  addStatBlock: (statBlock: Omit<StatBlock, "id">) => string;
  updateStatBlock: (id: string, updates: Partial<StatBlock>) => void;
  removeStatBlock: (id: string) => void;
  importStatBlocks: (blocks: Omit<StatBlock, "id">[]) => void;
  getStatBlock: (id: string) => StatBlock | undefined;

  // Encounter actions
  addEncounter: (encounter: Omit<SavedEncounter, "id" | "createdAt" | "updatedAt">) => string;
  updateEncounter: (id: string, updates: Partial<SavedEncounter>) => void;
  removeEncounter: (id: string) => void;
  addMonsterToEncounter: (encounterId: string, monster: EncounterMonster) => void;
  removeMonsterFromEncounter: (encounterId: string, statBlockId: string) => void;
  updateMonsterInEncounter: (encounterId: string, statBlockId: string, updates: Partial<EncounterMonster>) => void;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      statBlocks: [],
      encounters: [],

      addStatBlock: (statBlock) => {
        const id = uuidv4();
        set((state) => ({
          statBlocks: [...state.statBlocks, { ...statBlock, id }],
        }));
        return id;
      },

      updateStatBlock: (id, updates) => {
        set((state) => ({
          statBlocks: state.statBlocks.map((sb) =>
            sb.id === id ? { ...sb, ...updates } : sb
          ),
        }));
      },

      removeStatBlock: (id) => {
        set((state) => ({
          statBlocks: state.statBlocks.filter((sb) => sb.id !== id),
        }));
      },

      importStatBlocks: (blocks) => {
        const withIds = blocks.map((b) => ({ ...b, id: uuidv4() }));
        set((state) => ({
          statBlocks: [...state.statBlocks, ...withIds],
        }));
      },

      getStatBlock: (id) => {
        return get().statBlocks.find((sb) => sb.id === id);
      },

      addEncounter: (encounter) => {
        const id = uuidv4();
        const now = Date.now();
        set((state) => ({
          encounters: [
            ...state.encounters,
            { ...encounter, id, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },

      updateEncounter: (id, updates) => {
        set((state) => ({
          encounters: state.encounters.map((enc) =>
            enc.id === id ? { ...enc, ...updates, updatedAt: Date.now() } : enc
          ),
        }));
      },

      removeEncounter: (id) => {
        set((state) => ({
          encounters: state.encounters.filter((enc) => enc.id !== id),
        }));
      },

      addMonsterToEncounter: (encounterId, monster) => {
        set((state) => ({
          encounters: state.encounters.map((enc) => {
            if (enc.id !== encounterId) return enc;
            const existing = enc.monsters.find((m) => m.statBlockId === monster.statBlockId);
            if (existing) {
              return {
                ...enc,
                monsters: enc.monsters.map((m) =>
                  m.statBlockId === monster.statBlockId
                    ? { ...m, quantity: m.quantity + monster.quantity }
                    : m
                ),
                updatedAt: Date.now(),
              };
            }
            return {
              ...enc,
              monsters: [...enc.monsters, monster],
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      removeMonsterFromEncounter: (encounterId, statBlockId) => {
        set((state) => ({
          encounters: state.encounters.map((enc) =>
            enc.id === encounterId
              ? {
                  ...enc,
                  monsters: enc.monsters.filter((m) => m.statBlockId !== statBlockId),
                  updatedAt: Date.now(),
                }
              : enc
          ),
        }));
      },

      updateMonsterInEncounter: (encounterId, statBlockId, updates) => {
        set((state) => ({
          encounters: state.encounters.map((enc) =>
            enc.id === encounterId
              ? {
                  ...enc,
                  monsters: enc.monsters.map((m) =>
                    m.statBlockId === statBlockId ? { ...m, ...updates } : m
                  ),
                  updatedAt: Date.now(),
                }
              : enc
          ),
        }));
      },
    }),
    { name: "obr-library" }
  )
);
