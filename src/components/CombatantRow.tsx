import { useState } from "react";
import { Combatant, StatBlock } from "../types";
import { hpPercent, CONDITIONS } from "../utils";

interface CombatantRowProps {
  combatant: Combatant;
  isActive: boolean;
  isGM: boolean;
  statBlock?: StatBlock;
  onRemove: () => void;
  onUpdate: (updates: Partial<Combatant>) => void;
  onAdjustHp: (delta: number) => void;
  onAddCondition: (cond: { name: string; icon: string }) => void;
  onRemoveCondition: (name: string) => void;
}

export function CombatantRow({
  combatant,
  isActive,
  isGM,
  statBlock,
  onRemove,
  onUpdate,
  onAdjustHp,
  onAddCondition,
  onRemoveCondition,
}: CombatantRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingInit, setEditingInit] = useState(false);
  const [hpDelta, setHpDelta] = useState("");
  const [showConditions, setShowConditions] = useState(false);
  const [showStatBlock, setShowStatBlock] = useState(false);

  const pct = hpPercent(combatant.hp, combatant.maxHp);
  const isDead = combatant.hp <= 0;
  const displayName = combatant.count
    ? `${combatant.name} ${combatant.count}`
    : combatant.name;

  const canSeeNumbers = isGM || combatant.isPlayer;

  const handleHpSubmit = () => {
    const val = parseInt(hpDelta);
    if (!isNaN(val)) onAdjustHp(val);
    setHpDelta("");
  };

  return (
    <div
      className={`combatant-row ${isActive ? "active" : ""} ${isDead ? "dead" : ""} ${combatant.isPlayer ? "is-player" : "is-monster"}`}
    >
      {/* Turn indicator dot */}
      <div className="turn-dot" />

      {/* Initiative number */}
      <div
        className="initiative-num"
        onClick={() => setEditingInit(true)}
        title="Click to edit initiative"
      >
        {editingInit ? (
          <input
            className="init-input"
            type="number"
            defaultValue={combatant.initiative}
            autoFocus
            onBlur={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) onUpdate({ initiative: val });
              setEditingInit(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditingInit(false);
            }}
          />
        ) : (
          combatant.initiative
        )}
      </div>

      {/* Name + condition tags */}
      <div className="combatant-info" onClick={() => setExpanded(!expanded)}>
        <div className="combatant-name-row">
          <span className="combatant-name">{displayName}</span>
          {combatant.conditions.map((cond) => (
            <span
              key={cond.name}
              className="condition-tag"
              title="Click to remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCondition(cond.name);
              }}
            >
              {cond.name}
            </span>
          ))}
        </div>
      </div>

      {/* HP badge */}
      <div className={`hp-badge ${pct < 50 ? "danger" : "neutral"}`}>
        {canSeeNumbers
          ? `${combatant.hp}/${combatant.maxHp}`
          : pct < 50
          ? "Low"
          : ""}
      </div>

      {/* AC */}
      <div className="ac-badge">AC {combatant.ac}</div>

      {/* Action buttons */}
      <div className="combatant-actions">
        <button
          className="icon-btn"
          title="Conditions"
          onClick={(e) => {
            e.stopPropagation();
            setShowConditions(!showConditions);
          }}
        >
          fx
        </button>
        {isGM && (
          <button
            className="icon-btn danger"
            title="Remove from initiative"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            x
          </button>
        )}
      </div>

      {/* Expanded GM panel */}
      {expanded && isGM && (
        <div className="combatant-expanded">
          <div className="hp-adjust-row">
            <span className="expand-label">HP:</span>
            <button className="hp-btn heal" onClick={() => onAdjustHp(1)}>+1</button>
            <button className="hp-btn heal" onClick={() => onAdjustHp(5)}>+5</button>
            <button className="hp-btn damage" onClick={() => onAdjustHp(-1)}>-1</button>
            <button className="hp-btn damage" onClick={() => onAdjustHp(-5)}>-5</button>
            <button className="hp-btn damage" onClick={() => onAdjustHp(-10)}>-10</button>
            <div className="hp-custom-row">
              <input
                className="hp-delta-input"
                type="number"
                placeholder="+-val"
                value={hpDelta}
                onChange={(e) => setHpDelta(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleHpSubmit()}
              />
              <button className="btn-sm" onClick={handleHpSubmit}>Apply</button>
            </div>
          </div>

          <div className="expand-fields">
            <label className="expand-field">
              <span>Max HP</span>
              <input
                type="number"
                defaultValue={combatant.maxHp}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val))
                    onUpdate({ maxHp: val, hp: Math.min(combatant.hp, val) });
                }}
              />
            </label>
            <label className="expand-field">
              <span>AC</span>
              <input
                type="number"
                defaultValue={combatant.ac}
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) onUpdate({ ac: val });
                }}
              />
            </label>
            <label className="expand-field">
              <span>Name</span>
              <input
                type="text"
                defaultValue={combatant.name}
                onBlur={(e) => onUpdate({ name: e.target.value })}
              />
            </label>
          </div>

          <label className="expand-field full">
            <span>Notes</span>
            <textarea
              defaultValue={combatant.notes ?? ""}
              rows={2}
              onBlur={(e) => onUpdate({ notes: e.target.value })}
            />
          </label>

          {statBlock && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowStatBlock(!showStatBlock)}
            >
              {showStatBlock ? "Hide Stat Block" : "View Stat Block"}
            </button>
          )}

          {showStatBlock && statBlock && <StatBlockMini statBlock={statBlock} />}
        </div>
      )}

      {/* Condition picker */}
      {showConditions && (
        <div className="condition-picker" onClick={(e) => e.stopPropagation()}>
          {CONDITIONS.map((cond) => {
            const active = combatant.conditions.find((c) => c.name === cond.name);
            return (
              <button
                key={cond.name}
                className={`condition-btn ${active ? "active" : ""}`}
                onClick={() => {
                  if (active) onRemoveCondition(cond.name);
                  else onAddCondition(cond);
                  setShowConditions(false);
                }}
              >
                {cond.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBlockMini({ statBlock }: { statBlock: StatBlock }) {
  return (
    <div className="statblock-mini">
      <div className="sb-mini-header">
        <strong>{statBlock.name}</strong>
        <span>
          {statBlock.size} {statBlock.type}, {statBlock.alignment}
        </span>
      </div>
      <div className="sb-mini-row">
        <span>
          AC {statBlock.ac}
          {statBlock.ac_source ? ` (${statBlock.ac_source})` : ""}
        </span>
        <span>
          HP {statBlock.hp_average} ({statBlock.hp_formula})
        </span>
      </div>
      <div>
        {statBlock.actions.slice(0, 3).map((a) => (
          <div key={a.name} className="sb-mini-action">
            <strong>{a.name}.</strong> {a.desc}
          </div>
        ))}
      </div>
    </div>
  );
}
