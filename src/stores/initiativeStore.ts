import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Combatant, InitiativeRollMode } from "../types";
import { v4 as uuidv4 } from "uuid";

interface InitiativeStore {
  combatants: Combatant[];
  currentTurn: number;
  round: number;
  isRunning: boolean;
  rollMode: InitiativeRollMode;

  // Actions
  addCombatant: (combatant: Omit<Combatant, "id">) => string;
  removeCombatant: (id: string) => void;
  updateCombatant: (id: string, updates: Partial<Combatant>) => void;
  setCombatantInitiative: (id: string, initiative: number) => void;
  sortByInitiative: () => void;
  nextTurn: () => void;
  prevTurn: () => void;
  startCombat: () => void;
  endCombat: () => void;
  resetRound: () => void;
  clearAll: () => void;
  setRollMode: (mode: InitiativeRollMode) => void;
  adjustHp: (id: string, delta: number) => void;
  addCondition: (id: string, condition: { name: string; icon: string }) => void;
  removeCondition: (id: string, conditionName: string) => void;
  reorderCombatants: (fromIndex: number, toIndex: number) => void;
}

export const useInitiativeStore = create<InitiativeStore>()(
  persist(
    (set, get) => ({
      combatants: [],
      currentTurn: 0,
      round: 1,
      isRunning: false,
      rollMode: "auto",

      addCombatant: (combatant) => {
        const id = uuidv4();
        set((state) => {
          // Count duplicates for labeling (e.g. "Goblin 2")
          const sameNameCount = state.combatants.filter(
            (c) => c.name === combatant.name
          ).length;
          return {
            combatants: [
              ...state.combatants,
              { ...combatant, id, count: sameNameCount > 0 ? sameNameCount + 1 : undefined },
            ],
          };
        });
        return id;
      },

      removeCombatant: (id) => {
        set((state) => {
          const idx = state.combatants.findIndex((c) => c.id === id);
          const newCombatants = state.combatants.filter((c) => c.id !== id);
          let newTurn = state.currentTurn;
          if (idx < state.currentTurn) newTurn = Math.max(0, state.currentTurn - 1);
          if (state.currentTurn >= newCombatants.length) newTurn = 0;
          return { combatants: newCombatants, currentTurn: newTurn };
        });
      },

      updateCombatant: (id, updates) => {
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      setCombatantInitiative: (id, initiative) => {
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id === id ? { ...c, initiative } : c
          ),
        }));
      },

      sortByInitiative: () => {
        set((state) => ({
          combatants: [...state.combatants].sort(
            (a, b) => b.initiative - a.initiative
          ),
          currentTurn: 0,
        }));
      },

      nextTurn: () => {
        set((state) => {
          const next = state.currentTurn + 1;
          if (next >= state.combatants.length) {
            return { currentTurn: 0, round: state.round + 1 };
          }
          return { currentTurn: next };
        });
      },

      prevTurn: () => {
        set((state) => {
          const prev = state.currentTurn - 1;
          if (prev < 0) {
            return {
              currentTurn: Math.max(0, state.combatants.length - 1),
              round: Math.max(1, state.round - 1),
            };
          }
          return { currentTurn: prev };
        });
      },

      startCombat: () => {
        get().sortByInitiative();
        set({ isRunning: true, round: 1, currentTurn: 0 });
      },

      endCombat: () => {
        set({ isRunning: false, round: 1, currentTurn: 0 });
      },

      resetRound: () => {
        set({ round: 1, currentTurn: 0 });
      },

      clearAll: () => {
        set({ combatants: [], currentTurn: 0, round: 1, isRunning: false });
      },

      setRollMode: (mode) => set({ rollMode: mode }),

      adjustHp: (id, delta) => {
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id === id
              ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) }
              : c
          ),
        }));
      },

      addCondition: (id, condition) => {
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id === id && !c.conditions.find((cond) => cond.name === condition.name)
              ? { ...c, conditions: [...c.conditions, condition] }
              : c
          ),
        }));
      },

      removeCondition: (id, conditionName) => {
        set((state) => ({
          combatants: state.combatants.map((c) =>
            c.id === id
              ? { ...c, conditions: c.conditions.filter((cond) => cond.name !== conditionName) }
              : c
          ),
        }));
      },

      reorderCombatants: (fromIndex, toIndex) => {
        set((state) => {
          const list = [...state.combatants];
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return { combatants: list };
        });
      },
    }),
    { name: "obr-initiative-tracker" }
  )
);
