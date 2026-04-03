import { useState } from "react";
import { useOBR } from "./hooks/useOBR";
import { InitiativePanel } from "./components/InitiativePanel";
import { EncounterPanel } from "./components/EncounterPanel";
import { StatBlockPanel } from "./components/StatBlockPanel";
import { AppTab } from "./types";
import "./styles.css";

const TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: "initiative", label: "Combat", icon: "⚔️" },
  { id: "encounters", label: "Encounters", icon: "🐉" },
  { id: "statblocks", label: "Bestiary", icon: "📜" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("initiative");
  const obr = useOBR();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="app-title-icon">⚔️</span>
          <h1>Initiative</h1>
          {obr.isGM && <span className="gm-badge">GM</span>}
        </div>
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {!obr.isReady && (
          <div className="loading-screen">
            <div className="loading-rune">᚛</div>
            <p>Connecting to Owlbear Rodeo...</p>
          </div>
        )}

        {obr.isReady && (
          <>
            {activeTab === "initiative" && (
              <InitiativePanel obr={obr} />
            )}
            {activeTab === "encounters" && (
              <EncounterPanel obr={obr} />
            )}
            {activeTab === "statblocks" && (
              <StatBlockPanel />
            )}
          </>
        )}
      </main>
    </div>
  );
}
