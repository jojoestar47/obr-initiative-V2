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

  // Add selected OBR tokens -- skips any already in tracker
  const addSelectedTokens = async () => {
    const freshTokens = await obr.getSceneTokens();
    const selected = freshTokens.filter((t) =>
      obr.selectedTokenIds.includes(t.id)
    );
    for (const token of selected) {
      const exists = combatants.find((c) => c.tokenId === token.id);
      if (exists) continue;
      const initiative = rollMode === "auto" ? rollInitiative(0) : 0;
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

  // Remove selected OBR tokens from initiative
  const removeSelectedTokens = () => {
    for (const tokenId of obr.selectedTokenIds) {
      const match = combatants.find((c) => c.tokenId === tokenId);
      if (match) removeCombatant(match.id);
    }
  };

  // How many of the currently selected tokens are already in initiative
  const selectedInTracker = obr.selectedTokenIds.filter((id) =>
    combatants.some((c) => c.tokenId === id)
  ).length;
  const selectedNotInTracker = obr.selectedTokenIds.length - selectedInTracker;

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
          {/* Show Add/Remove buttons based on what's selected */}
          {selectedNotInTracker > 0 && (
            <button
              className="btn btn-secondary"
              onClick={addSelectedTokens}
              title={`Add ${selectedNotInTracker} selected token(s) to initiative`}
            >
              + {selectedNotInTracker} Selected
            </button>
          )}
          {selectedInTracker > 0 && (
            <button
              className="btn btn-secondary btn-danger"
              onClick={removeSelectedTokens}
              title={`Remove ${selectedInTracker} selected token(s) from initiative`}
            >
              - {selectedInTracker} Selected
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>
            + Manual
          </button>
        </div>
      </div>

      {/* Add All / token count bar */}
      {obr.tokens.length > 0 && (
        <div className="token-bar">
          <span className="token-bar-hint">
            {obr.tokens.length} token{obr.tokens.length !== 1 ? "s" : ""} on scene
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={obr.addAllTokens}
            title="Add every character token on the scene to initiative"
          >
            Add All
          </button>
        </div>
      )}

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
              Right-click a token on the map, select tokens and use the buttons above, or use + Manual.
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
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
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
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
              onClick={nextTurn}
            >
              Next Turn ›
            </button>
            <button className="btn btn-ghost btn-danger" onClick={endCombat}>
              End
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
