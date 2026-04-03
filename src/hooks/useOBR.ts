import { useEffect, useState, useCallback } from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { OBRToken } from "../types";

interface UseOBRReturn {
  isReady: boolean;
  isGM: boolean;
  tokens: OBRToken[];
  selectedTokenIds: string[];
  addTokenToScene: (imageUrl: string, name: string, x: number, y: number) => Promise<string | null>;
  getSceneTokens: () => Promise<OBRToken[]>;
  refreshTokens: () => Promise<void>;
}

export function useOBR(): UseOBRReturn {
  const [isReady, setIsReady] = useState(false);
  const [isGM, setIsGM] = useState(false);
  const [tokens, setTokens] = useState<OBRToken[]>([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);

  const itemsToTokens = useCallback((items: Item[]): OBRToken[] => {
    return items
      .filter((item) => item.layer === "CHARACTER")
      .map((item) => ({
        id: item.id,
        name: item.name || "Unknown Token",
        imageUrl: "image" in item ? (item as any).image?.url : undefined,
        isPlayer: false, // determined by OBR metadata if set
      }));
  }, []);

  const refreshTokens = useCallback(async () => {
    if (!isReady) return;
    try {
      const items = await OBR.scene.items.getItems();
      setTokens(itemsToTokens(items));
    } catch (e) {
      console.error("Failed to refresh tokens", e);
    }
  }, [isReady, itemsToTokens]);

  useEffect(() => {
    OBR.onReady(async () => {
      setIsReady(true);

      // Check GM status via role
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

      // Listen for selection changes
      OBR.player.onChange((player) => {
        setSelectedTokenIds(player.selection ?? []);
      });

      // Listen for scene item changes
      OBR.scene.items.onChange((items) => {
        setTokens(itemsToTokens(items));
      });

      // Watch role changes
      OBR.player.onChange((_player) => {
        // role isn't directly on player object in all SDK versions
        // re-fetch role on any player change
        OBR.player.getRole().then((role) => setIsGM(role === "GM")).catch(() => {});
      });
    });
  }, [itemsToTokens]);

  const getSceneTokens = useCallback(async (): Promise<OBRToken[]> => {
    if (!isReady) return [];
    try {
      const items = await OBR.scene.items.getItems();
      return itemsToTokens(items);
    } catch {
      return [];
    }
  }, [isReady, itemsToTokens]);

  const addTokenToScene = useCallback(
    async (imageUrl: string, name: string, x: number, y: number): Promise<string | null> => {
      if (!isReady || !isGM) return null;
      try {
        const id = crypto.randomUUID();
        await OBR.scene.items.addItems([
          {
            id,
            type: "IMAGE",
            name,
            layer: "CHARACTER",
            position: { x, y },
            rotation: 0,
            scale: { x: 1, y: 1 },
            visible: true,
            locked: false,
            image: {
              url: imageUrl,
              width: 150,
              height: 150,
              mime: "image/png",
            },
            grid: {
              dpi: 150,
              offset: { x: 75, y: 75 },
            },
          } as any,
        ]);
        return id;
      } catch (e) {
        console.error("Failed to add token to scene", e);
        return null;
      }
    },
    [isReady, isGM]
  );

  return {
    isReady,
    isGM,
    tokens,
    selectedTokenIds,
    addTokenToScene,
    getSceneTokens,
    refreshTokens,
  };
}
