import { useState } from "react";
import { useInitiativeStore } from "../stores/initiativeStore";
import { useLibraryStore } from "../stores/libraryStore";
import { InitiativeRollMode } from "../types";
import { useOBR } from "../hooks/useOBR";
import { CombatantRow } from "./CombatantRow";
import { AddCombatantModal } from "./AddCombatantModal";
import { rollInitiative } from "../utils";

interface InitiativePanelProps {
  obr: ReturnType<typeof useOBR>;
}

export function InitiativePanel({ obr }: InitiativePanelProps) {
  const {
    combatants,
    currentTurn,
    round,
    isRunning,
    rollMode,
    addCombatant,
    removeCombatant,
    updateCombatant,
    sortByInitiative,
    nextTurn,
    prevTurn,
    startCombat,
    endCombat,
    clearAll,
    setRollMode,
    adjustHp,
    addCondition,
    removeCondition,
    reorderCombatants,
  } = useInitiativeStore();

  const { getStatBlock } = useLibraryStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // Add selected OBR tokens to initiative
  const addSelectedTokens = async () => {
    const freshTokens = await obr.getSceneTokens();
    const selected = freshTokens.filter((t) =>
      obr.selectedTokenIds.includes(t.id)
    );

    for (const token of selected) {
      // Check if already in tracker
      const exists = combatants.find((c) => c.tokenId === token.id);
      if (exists) continue;

      const initiative =
        rollMode === "auto" ? rollInitiative(0) : 0;

      addCombatant({
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
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    reorderCombatants(fromIndex, toIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="initiative-panel">
      {/* Controls bar */}
      <div className="initiative-controls">
        <div className="roll-mode-group">
          <span className="control-label">Roll:</span>
          {(["auto", "manual", "set"] as InitiativeRollMode[]).map((mode) => (
            <button
              key={mode}
              className={`roll-mode-btn ${rollMode === mode ? "active" : ""}`}
              onClick={() => setRollMode(mode)}
              title={
                mode === "auto"
                  ? "Auto roll d20 + bonus"
                  : mode === "manual"
                  ? "Roll physical dice, type result"
                  : "Set initiative directly"
              }
            >
              {mode === "auto" ? "Auto" : mode === "manual" ? "Manual" : "Set"}
            </button>
          ))}
        </div>

        <div className="combat-actions">
          {obr.selectedTokenIds.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={addSelectedTokens}
              title={`Add ${obr.selectedTokenIds.length} selected token(s)`}
            >
              + Selected ({obr.selectedTokenIds.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>
            + Manual
          </button>
        </div>
      </div>

      {/* Round / turn header */}
      {isRunning && (
        <div className="combat-header">
          <button className="round-nav-btn" onClick={prevTurn}>‹</button>
          <div className="round-info">
            <span className="round-label">Round</span>
            <span className="round-number">{round}</span>
          </div>
          <button className="round-nav-btn" onClick={nextTurn}>›</button>
        </div>
      )}

      {/* Combatant list */}
      <div className="combatant-list">
        {combatants.length === 0 && (
          <div className="empty-state">
            
            <p>No combatants yet.</p>
            <p className="empty-hint">
              Select tokens on the map and tap <strong>+ Selected</strong>, or use <strong>+ Manual</strong> to add by hand.
            </p>
          </div>
        )}

        {combatants.map((combatant, index) => (
          <div
            key={combatant.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={handleDragOver}
          >
            <CombatantRow
              combatant={combatant}
              isActive={isRunning && index === currentTurn}
              isGM={obr.isGM}
              statBlock={combatant.statBlockId ? getStatBlock(combatant.statBlockId) : undefined}
              onRemove={() => removeCombatant(combatant.id)}
              onUpdate={(updates) => updateCombatant(combatant.id, updates)}
              onAdjustHp={(delta) => adjustHp(combatant.id, delta)}
              onAddCondition={(cond) => addCondition(combatant.id, cond)}
              onRemoveCondition={(name) => removeCondition(combatant.id, name)}
            />
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="initiative-footer">
        {!isRunning ? (
          <>
            <button
              className="btn btn-primary"
              onClick={startCombat}
              disabled={combatants.length === 0}
            >
              Begin Combat
            </button>
            <button
              className="btn btn-ghost"
              onClick={sortByInitiative}
              disabled={combatants.length === 0}
            >
              Sort
            </button>
            <button
              className="btn btn-ghost btn-danger"
              onClick={clearAll}
              disabled={combatants.length === 0}
            >
              Clear
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={nextTurn}>
              Next Turn ›
            </button>
            <button className="btn btn-ghost btn-danger" onClick={endCombat}>
              End Combat
            </button>
          </>
        )}
      </div>

      {showAddModal && (
        <AddCombatantModal
          rollMode={rollMode}
          onAdd={(combatant) => {
            addCombatant(combatant);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
