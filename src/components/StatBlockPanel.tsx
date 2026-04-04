import { useState } from "react";
import { useLibraryStore } from "../stores/libraryStore";
import { StatBlock } from "../types";
import { exportJSON, readJSONFile, formatModifier, getModifier, speedString } from "../utils";

export function StatBlockPanel() {
  const { statBlocks, addStatBlock, importStatBlocks, removeStatBlock } =
    useLibraryStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = statBlocks.filter((sb) =>
    sb.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = statBlocks.find((sb) => sb.id === selectedId);

  const handleImportJSON = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      for (const file of files) {
        try {
          const data = await readJSONFile<StatBlock | StatBlock[]>(file);
          if (Array.isArray(data)) {
            importStatBlocks(data);
          } else {
            addStatBlock(data);
          }
        } catch {
          alert(`Failed to import ${file.name}`);
        }
      }
    };
    input.click();
  };

  const handleExport = (sb: StatBlock) => {
    exportJSON(sb, `${sb.name.replace(/\s+/g, "_")}.json`);
  };

  const handleExportAll = () => {
    exportJSON(statBlocks, "bestiary_export.json");
  };

  return (
    <div className="statblock-panel">
      <div className="panel-header">
        <h2>Bestiary</h2>
        <div className="panel-header-actions">
          {statBlocks.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleExportAll}>
              Export All
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleImportJSON}>
            Import JSON
          </button>
        </div>
      </div>

      <div className="sb-search">
        <input
          type="search"
          placeholder="Search creatures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {statBlocks.length === 0 && (
        <div className="empty-state">
          
          <p>Your bestiary is empty.</p>
          <p className="empty-hint">
            Import stat block JSON files to build your library. Single creatures or arrays are both supported.
          </p>
          <button className="btn btn-primary" onClick={handleImportJSON}>
            Import JSON
          </button>
        </div>
      )}

      <div className="sb-layout">
        {/* List */}
        {filtered.length > 0 && (
          <div className="sb-list">
            {filtered.map((sb) => (
              <div
                key={sb.id}
                className={`sb-list-item ${selectedId === sb.id ? "selected" : ""}`}
                onClick={() => setSelectedId(sb.id === selectedId ? null : sb.id)}
              >
                <div className="sb-list-main">
                  <span className="sb-list-name">{sb.name}</span>
                  <span className="sb-list-meta">
                    CR {sb.cr} · {sb.size} {sb.type}
                  </span>
                </div>
                <div className="sb-list-actions">
                  <button
                    className="icon-btn"
                    title="Export"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(sb);
                    }}
                  >
                    v
                  </button>
                  <button
                    className="icon-btn danger"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove ${sb.name} from bestiary?`))
                        removeStatBlock(sb.id);
                    }}
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full stat block viewer */}
        {selected && (
          <div className="sb-viewer">
            <StatBlockView statBlock={selected} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlockView({ statBlock: sb }: { statBlock: StatBlock }) {
  const statNames = ["str", "dex", "con", "int", "wis", "cha"] as const;
  const statLabels = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

  return (
    <div className="stat-block">
      <div className="sb-name-block">
        <h2>{sb.name}</h2>
        <p className="sb-subtitle">
          {sb.size} {sb.type}, {sb.alignment}
        </p>
      </div>

      <div className="sb-divider" />

      <div className="sb-core-stats">
        <div className="sb-core-row">
          <span className="sb-label">Armor Class</span>
          <span>
            {sb.ac}
            {sb.ac_source ? ` (${sb.ac_source})` : ""}
          </span>
        </div>
        <div className="sb-core-row">
          <span className="sb-label">Initiative</span>
          <span>
            {formatModifier(sb.initiative_bonus)} ({10 + sb.initiative_bonus * 2 + sb.initiative_bonus})
          </span>
        </div>
        <div className="sb-core-row">
          <span className="sb-label">Hit Points</span>
          <span>
            {sb.hp_average} ({sb.hp_formula})
          </span>
        </div>
        <div className="sb-core-row">
          <span className="sb-label">Speed</span>
          <span>{speedString(sb.speed as Record<string, number | undefined>)}</span>
        </div>
      </div>

      <div className="sb-divider" />

      <div className="sb-ability-grid">
        {statNames.map((stat, i) => {
          const score = sb.stats[stat];
          const mod = getModifier(score);
          const save = sb.saves[stat];
          return (
            <div key={stat} className="sb-ability">
              <span className="sb-ability-label">{statLabels[i]}</span>
              <span className="sb-ability-score">{score}</span>
              <span className="sb-ability-mod">{formatModifier(mod)}</span>
              {save !== null && (
                <span className="sb-ability-save">{formatModifier(save ?? mod)}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="sb-divider" />

      {Object.keys(sb.skills).length > 0 && (
        <div className="sb-core-row">
          <span className="sb-label">Skills</span>
          <span>
            {Object.entries(sb.skills)
              .map(([k, v]) => `${k} ${formatModifier(v)}`)
              .join(", ")}
          </span>
        </div>
      )}

      {sb.damage_resistances.length > 0 && (
        <div className="sb-core-row">
          <span className="sb-label">Damage Resistances</span>
          <span>{sb.damage_resistances.join(", ")}</span>
        </div>
      )}

      {sb.damage_immunities.length > 0 && (
        <div className="sb-core-row">
          <span className="sb-label">Damage Immunities</span>
          <span>{sb.damage_immunities.join(", ")}</span>
        </div>
      )}

      {sb.condition_immunities.length > 0 && (
        <div className="sb-core-row">
          <span className="sb-label">Condition Immunities</span>
          <span>{sb.condition_immunities.join(", ")}</span>
        </div>
      )}

      <div className="sb-core-row">
        <span className="sb-label">Senses</span>
        <span>{sb.senses}</span>
      </div>

      <div className="sb-core-row">
        <span className="sb-label">Languages</span>
        <span>{sb.languages.join(", ") || "—"}</span>
      </div>

      <div className="sb-core-row">
        <span className="sb-label">Challenge</span>
        <span>
          {sb.cr} (XP {sb.xp.toLocaleString()}; PB +{sb.pb})
        </span>
      </div>

      <div className="sb-divider" />

      {sb.traits.length > 0 && (
        <div className="sb-section">
          {sb.traits.map((t) => (
            <p key={t.name} className="sb-entry">
              <strong>{t.name}.</strong> {t.desc}
            </p>
          ))}
        </div>
      )}

      {sb.actions.length > 0 && (
        <div className="sb-section">
          <h3 className="sb-section-title">Actions</h3>
          {sb.actions.map((a) => (
            <p key={a.name} className="sb-entry">
              <strong>{a.name}.</strong> {a.desc}
            </p>
          ))}
        </div>
      )}

      {sb.bonus_actions.length > 0 && (
        <div className="sb-section">
          <h3 className="sb-section-title">Bonus Actions</h3>
          {sb.bonus_actions.map((a) => (
            <p key={a.name} className="sb-entry">
              <strong>{a.name}.</strong> {a.desc}
            </p>
          ))}
        </div>
      )}

      {sb.reactions.length > 0 && (
        <div className="sb-section">
          <h3 className="sb-section-title">Reactions</h3>
          {sb.reactions.map((a) => (
            <p key={a.name} className="sb-entry">
              <strong>{a.name}.</strong> {a.desc}
            </p>
          ))}
        </div>
      )}

      {sb.legendary_actions.length > 0 && (
        <div className="sb-section">
          <h3 className="sb-section-title">Legendary Actions</h3>
          {sb.legendary_resistances && (
            <p className="sb-entry">
              {sb.name} can take {sb.legendary_resistances} legendary actions.
            </p>
          )}
          {sb.legendary_actions.map((a) => (
            <p key={a.name} className="sb-entry">
              <strong>{a.name}.</strong> {a.desc}
            </p>
          ))}
        </div>
      )}

      {sb.lair_actions.length > 0 && (
        <div className="sb-section">
          <h3 className="sb-section-title">Lair Actions</h3>
          {sb.lair_actions.map((a) => (
            <p key={a.name} className="sb-entry">
              <strong>{a.name}.</strong> {a.desc}
            </p>
          ))}
        </div>
      )}

      {sb.source && (
        <p className="sb-source">Source: {sb.source}</p>
      )}
    </div>
  );
}
