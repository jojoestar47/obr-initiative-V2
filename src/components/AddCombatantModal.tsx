import { useState } from "react";
import { Combatant, InitiativeRollMode } from "../types";
import { useLibraryStore } from "../stores/libraryStore";
import { rollInitiative } from "../utils";

interface AddCombatantModalProps {
  rollMode: InitiativeRollMode;
  onAdd: (combatant: Omit<Combatant, "id">) => void;
  onClose: () => void;
}

export function AddCombatantModal({ rollMode, onAdd, onClose }: AddCombatantModalProps) {
  const { statBlocks } = useLibraryStore();

  const [selectedStatBlockId, setSelectedStatBlockId] = useState("");
  const [name, setName] = useState("");
  const [hp, setHp] = useState(10);
  const [ac, setAc] = useState(10);
  const [initiativeBonus, setInitiativeBonus] = useState(0);
  const [initiative, setInitiative] = useState(rollMode === "auto" ? rollInitiative(0) : 0);
  const [isPlayer, setIsPlayer] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleStatBlockSelect = (id: string) => {
    setSelectedStatBlockId(id);
    if (!id) return;
    const sb = statBlocks.find((s) => s.id === id);
    if (!sb) return;
    setName(sb.name);
    setHp(sb.hp_average);
    setAc(sb.ac);
    setInitiativeBonus(sb.initiative_bonus);
    const newInit = rollMode === "auto" ? rollInitiative(sb.initiative_bonus) : sb.initiative_bonus;
    setInitiative(newInit);
  };

  const handleReroll = () => {
    setInitiative(rollInitiative(initiativeBonus));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    for (let i = 0; i < quantity; i++) {
      const rolledInitiative =
        rollMode === "auto" ? rollInitiative(initiativeBonus) : initiative;

      onAdd({
        name: name.trim(),
        initiative: rolledInitiative,
        initiativeBonus,
        hp,
        maxHp: hp,
        ac,
        isPlayer,
        isVisible: true,
        statBlockId: selectedStatBlockId || undefined,
        conditions: [],
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Combatant</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {statBlocks.length > 0 && (
            <label className="field">
              <span>From Bestiary</span>
              <select
                value={selectedStatBlockId}
                onChange={(e) => handleStatBlockSelect(e.target.value)}
              >
                <option value="">-- Choose a creature --</option>
                {statBlocks.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name} (CR {sb.cr})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Name *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goblin"
              autoFocus
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>HP</span>
              <input
                type="number"
                value={hp}
                min={1}
                onChange={(e) => setHp(parseInt(e.target.value) || 1)}
              />
            </label>
            <label className="field">
              <span>AC</span>
              <input
                type="number"
                value={ac}
                min={1}
                onChange={(e) => setAc(parseInt(e.target.value) || 10)}
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Init Bonus</span>
              <input
                type="number"
                value={initiativeBonus}
                onChange={(e) => setInitiativeBonus(parseInt(e.target.value) || 0)}
              />
            </label>

            <label className="field">
              <span>Initiative</span>
              <div className="init-roll-row">
                {rollMode !== "auto" ? (
                  <input
                    type="number"
                    value={initiative}
                    onChange={(e) => setInitiative(parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <span className="rolled-value">{initiative}</span>
                )}
                {rollMode === "auto" && (
                  <button className="reroll-btn" onClick={handleReroll} title="Reroll">
                    🎲
                  </button>
                )}
              </div>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                value={quantity}
                min={1}
                max={20}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </label>
            <label className="field checkbox-field">
              <span>Player Character</span>
              <input
                type="checkbox"
                checked={isPlayer}
                onChange={(e) => setIsPlayer(e.target.checked)}
              />
            </label>
          </div>

          {rollMode === "auto" && quantity > 1 && (
            <p className="field-hint">Each combatant will get a separate auto-rolled initiative.</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Add {quantity > 1 ? `${quantity}×` : ""} {name || "Combatant"}
          </button>
        </div>
      </div>
    </div>
  );
}
