import { useEffect, useState, useCallback } from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { OBRToken } from "../types";
import { useInitiativeStore } from "../stores/initiativeStore";
import { rollInitiative } from "../utils";

interface UseOBRReturn {
  isReady: boolean;
  isGM: boolean;
  tokens: OBRToken[];
  selectedTokenIds: string[];
  addAllTokens: () => Promise<void>;
  getSceneTokens: () => Promise<OBRToken[]>;
  refreshTokens: () => Promise<void>;
}

function itemsToTokens(items: Item[]): OBRToken[] {
  return items
    .filter((item) => item.layer === "CHARACTER")
    .map((item) => ({
      id: item.id,
      name: item.name || "Unknown Token",
      imageUrl: "image" in item ? (item as any).image?.url : undefined,
      isPlayer: false,
    }));
}

// Helper: add a single OBR token to initiative using current store state
function addTokenToInitiative(token: OBRToken) {
  const store = useInitiativeStore.getState();
  const exists = store.combatants.find((c) => c.tokenId === token.id);
  if (exists) return;
  const initiative =
    store.rollMode === "auto" ? rollInitiative(0) : 0;
  store.addCombatant({
    name: token.name,
    initiative,
    initiativeBonus: 0,
    hp: 10,
    maxHp: 10,
    ac: 10,
    isPlayer: token.isPlayer,
    isVisible: true,
    tokenId: token.id,
    conditions: [],
  });
}

// Helper: toggle a token in/out of initiative
function toggleTokenInInitiative(token: OBRToken) {
  const store = useInitiativeStore.getState();
  const existing = store.combatants.find((c) => c.tokenId === token.id);
  if (existing) {
    store.removeCombatant(existing.id);
  } else {
    addTokenToInitiative(token);
  }
}

export function useOBR(): UseOBRReturn {
  const [isReady, setIsReady] = useState(false);
  const [isGM, setIsGM] = useState(false);
  const [tokens, setTokens] = useState<OBRToken[]>([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);

  const refreshTokens = useCallback(async () => {
    if (!isReady) return;
    try {
      const items = await OBR.scene.items.getItems();
      setTokens(itemsToTokens(items));
    } catch (e) {
      console.error("Failed to refresh tokens", e);
    }
  }, [isReady]);

  useEffect(() => {
    OBR.onReady(async () => {
      setIsReady(true);

      // GM role
      try {
        const role = await OBR.player.getRole();
        setIsGM(role === "GM");
      } catch {
        setIsGM(false);
      }

      // Load initial tokens
      try {
        const items = await OBR.scene.items.getItems();
        setTokens(itemsToTokens(items));
      } catch (e) {
        console.error("Failed to load tokens", e);
      }

      // Selection changes
      OBR.player.onChange((player) => {
        setSelectedTokenIds(player.selection ?? []);
        OBR.player.getRole().then((role) => setIsGM(role === "GM")).catch(() => {});
      });

      // Scene item changes -- sync tokens AND auto-remove deleted tokens from initiative
      OBR.scene.items.onChange((items) => {
        const characterItems = items.filter((i) => i.layer === "CHARACTER");
        const liveIds = new Set(characterItems.map((i) => i.id));

        // Auto-remove combatants whose token was deleted from the scene
        const store = useInitiativeStore.getState();
        for (const combatant of store.combatants) {
          if (combatant.tokenId && !liveIds.has(combatant.tokenId)) {
            store.removeCombatant(combatant.id);
          }
        }

        setTokens(itemsToTokens(items));
      });

      // Register right-click context menu (OBR SDK v2: contextMenu.create)
      try {
        await OBR.contextMenu.create({
          id: "obr-initiative-tracker/toggle",
          icons: [
            {
              icon: `${window.location.origin}/icon.svg`,
              label: "Toggle Initiative",
              filter: {
                every: [{ key: "layer", value: "CHARACTER" }],
              },
            },
          ],
          onClick(context) {
            const clickedTokens = itemsToTokens(context.items as Item[]);
            for (const token of clickedTokens) {
              toggleTokenInInitiative(token);
            }
          },
        });
      } catch (e) {
        // Already registered on hot reload — safe to ignore
        console.warn("Context menu registration skipped:", e);
      }
    });
  }, []);

  const getSceneTokens = useCallback(async (): Promise<OBRToken[]> => {
    if (!isReady) return [];
    try {
      const items = await OBR.scene.items.getItems();
      return itemsToTokens(items);
    } catch {
      return [];
    }
  }, [isReady]);

  const addAllTokens = useCallback(async () => {
    const sceneTokens = await getSceneTokens();
    for (const token of sceneTokens) {
      addTokenToInitiative(token);
    }
  }, [getSceneTokens]);

  return {
    isReady,
    isGM,
    tokens,
    selectedTokenIds,
    addAllTokens,
    getSceneTokens,
    refreshTokens,
  };
}
