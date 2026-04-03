import { useState } from "react";
import { useLibraryStore } from "../stores/libraryStore";
import { useInitiativeStore } from "../stores/initiativeStore";
import { useOBR } from "../hooks/useOBR";
import { SavedEncounter, EncounterMonster, OBRToken } from "../types";
import { rollInitiative, exportJSON, readJSONFile } from "../utils";

interface EncounterPanelProps {
  obr: ReturnType<typeof useOBR>;
}

export function EncounterPanel({ obr }: EncounterPanelProps) {
  const { encounters, statBlocks, addEncounter, updateEncounter, removeEncounter } =
    useLibraryStore();
  const { addCombatant, rollMode } = useInitiativeStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const handleAddToInitiative = (encounter: SavedEncounter) => {
    for (const em of encounter.monsters) {
      const sb = statBlocks.find((s) => s.id === em.statBlockId);
      if (!sb) continue;

      for (let i = 0; i < em.quantity; i++) {
        const init =
          rollMode === "auto" ? rollInitiative(sb.initiative_bonus) : sb.initiative_bonus;

        addCombatant({
          name: sb.name,
          initiative: init,
          initiativeBonus: sb.initiative_bonus,
          hp: sb.hp_average,
          maxHp: sb.hp_average,
          ac: sb.ac,
          isPlayer: false,
          isVisible: true,
          statBlockId: sb.id,
          conditions: [],
        });
      }
    }
  };

  const handleExport = (encounter: SavedEncounter) => {
    exportJSON(encounter, `${encounter.name.replace(/\s+/g, "_")}.json`);
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = await readJSONFile<SavedEncounter>(file);
        addEncounter({
          name: data.name || "Imported Encounter",
          description: data.description,
          monsters: data.monsters || [],
        });
      } catch {
        alert("Failed to import encounter JSON.");
      }
    };
    input.click();
  };

  return (
    <div className="encounter-panel">
      <div className="panel-header">
        <h2>Saved Encounters</h2>
        <div className="panel-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleImport}>
            Import
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            + New
          </button>
        </div>
      </div>

      {encounters.length === 0 && !showNew && (
        <div className="empty-state">
          <div className="empty-icon">🐉</div>
          <p>No saved encounters.</p>
          <p className="empty-hint">Build encounter groups and deploy them directly into combat.</p>
        </div>
      )}

      {showNew && (
        <EncounterEditor
          obr={obr}
          onSave={(data) => {
            addEncounter(data);
            setShowNew(false);
          }}
          onCancel={() => setShowNew(false)}
        />
      )}

      <div className="encounter-list">
        {encounters.map((enc) => (
          <div key={enc.id} className="encounter-card">
            <div
              className="encounter-card-header"
              onClick={() =>
                setExpandedId(expandedId === enc.id ? null : enc.id)
              }
            >
              <div className="encounter-title">
                <span className="encounter-name">{enc.name}</span>
                <span className="encounter-count">
                  {enc.monsters.reduce((sum, m) => sum + m.quantity, 0)} creatures
                </span>
              </div>
              <div className="encounter-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  title="Add all to initiative"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToInitiative(enc);
                  }}
                >
                  ⚔️ Deploy
                </button>
                <button
                  className="icon-btn"
                  title="Export"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(enc);
                  }}
                >
                  ↓
                </button>
                {obr.isGM && (
                  <button
                    className="icon-btn danger"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this encounter?")) removeEncounter(enc.id);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {expandedId === enc.id && (
              <div className="encounter-detail">
                {enc.description && (
                  <p className="encounter-desc">{enc.description}</p>
                )}
                <div className="encounter-monsters">
                  {enc.monsters.map((em) => {
                    const sb = statBlocks.find((s) => s.id === em.statBlockId);
                    return (
                      <div key={em.statBlockId} className="encounter-monster-row">
                        <span className="em-qty">{em.quantity}×</span>
                        <span className="em-name">{sb?.name ?? "Unknown"}</span>
                        <span className="em-cr">CR {sb?.cr ?? "?"}</span>
                        <span className="em-hp">HP {sb?.hp_average ?? "?"}</span>
                        {em.tokenImageUrl && (
                          <span className="em-token" title="Has token">🎭</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {obr.isGM && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(enc.id);
                      setExpandedId(null);
                    }}
                  >
                    Edit Encounter
                  </button>
                )}
              </div>
            )}

            {editingId === enc.id && (
              <EncounterEditor
                obr={obr}
                existing={enc}
                onSave={(data) => {
                  updateEncounter(enc.id, data);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface EncounterEditorProps {
  obr: ReturnType<typeof useOBR>;
  existing?: SavedEncounter;
  onSave: (data: Omit<SavedEncounter, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

function EncounterEditor({ obr, existing, onSave, onCancel }: EncounterEditorProps) {
  const { statBlocks } = useLibraryStore();
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [monsters, setMonsters] = useState<EncounterMonster[]>(
    existing?.monsters ?? []
  );
  const [selectedSbId, setSelectedSbId] = useState("");
  const [pickerTokenId, setPickerTokenId] = useState<string | null>(null);

  const addMonster = () => {
    if (!selectedSbId) return;
    const exists = monsters.find((m) => m.statBlockId === selectedSbId);
    if (exists) {
      setMonsters(
        monsters.map((m) =>
          m.statBlockId === selectedSbId ? { ...m, quantity: m.quantity + 1 } : m
        )
      );
    } else {
      setMonsters([...monsters, { statBlockId: selectedSbId, quantity: 1 }]);
    }
    setSelectedSbId("");
  };

  const updateQuantity = (statBlockId: string, qty: number) => {
    if (qty <= 0) {
      setMonsters(monsters.filter((m) => m.statBlockId !== statBlockId));
    } else {
      setMonsters(
        monsters.map((m) =>
          m.statBlockId === statBlockId ? { ...m, quantity: qty } : m
        )
      );
    }
  };

  const assignToken = (statBlockId: string, token: OBRToken | null) => {
    setMonsters(
      monsters.map((m) =>
        m.statBlockId === statBlockId
          ? {
              ...m,
              tokenImageUrl: token?.imageUrl,
              tokenImageId: token?.id,
            }
          : m
      )
    );
    setPickerTokenId(null);
  };

  const handleSave = () => {
    if (!name.trim() || monsters.length === 0) return;
    onSave({ name: name.trim(), description: description.trim() || undefined, monsters });
  };

  return (
    <div className="encounter-editor">
      <h3>{existing ? "Edit Encounter" : "New Encounter"}</h3>

      <label className="field">
        <span>Name *</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Goblin Ambush"
          autoFocus
        />
      </label>

      <label className="field">
        <span>Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes..."
        />
      </label>

      <div className="monster-adder">
        <select
          value={selectedSbId}
          onChange={(e) => setSelectedSbId(e.target.value)}
        >
          <option value="">-- Add creature from bestiary --</option>
          {statBlocks.map((sb) => (
            <option key={sb.id} value={sb.id}>
              {sb.name} (CR {sb.cr})
            </option>
          ))}
        </select>
        <button
          className="btn btn-secondary btn-sm"
          onClick={addMonster}
          disabled={!selectedSbId}
        >
          Add
        </button>
      </div>

      <div className="editor-monster-list">
        {monsters.map((em) => {
          const sb = statBlocks.find((s) => s.id === em.statBlockId);
          const tokenName = em.tokenImageId
            ? obr.tokens.find((t) => t.id === em.tokenImageId)?.name ?? "Token set"
            : null;

          return (
            <div key={em.statBlockId} className="editor-monster-row">
              <div className="em-row-main">
                <span className="em-name">{sb?.name ?? "Unknown"}</span>
                <div className="em-qty-controls">
                  <button onClick={() => updateQuantity(em.statBlockId, em.quantity - 1)}>−</button>
                  <span>{em.quantity}</span>
                  <button onClick={() => updateQuantity(em.statBlockId, em.quantity + 1)}>+</button>
                </div>
                <button
                  className="icon-btn danger"
                  onClick={() => updateQuantity(em.statBlockId, 0)}
                >
                  ×
                </button>
              </div>

              {/* Token picker */}
              <div className="em-token-row">
                {pickerTokenId === em.statBlockId ? (
                  <div className="token-picker">
                    <button
                      className="token-option none"
                      onClick={() => assignToken(em.statBlockId, null)}
                    >
                      None (no token)
                    </button>
                    {obr.tokens.map((token) => (
                      <button
                        key={token.id}
                        className="token-option"
                        onClick={() => assignToken(em.statBlockId, token)}
                      >
                        🎭 {token.name}
                      </button>
                    ))}
                    {obr.tokens.length === 0 && (
                      <p className="token-picker-empty">No tokens on scene yet.</p>
                    )}
                  </div>
                ) : (
                  <button
                    className="token-assign-btn"
                    onClick={() => setPickerTokenId(em.statBlockId)}
                  >
                    {tokenName ? `🎭 ${tokenName}` : "Select OBR Token..."}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="editor-footer">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!name.trim() || monsters.length === 0}
        >
          Save Encounter
        </button>
      </div>
    </div>
  );
}
