import { useState } from "react";
import { useOBR } from "./hooks/useOBR";
import { InitiativePanel } from "./components/InitiativePanel";
import { EncounterPanel } from "./components/EncounterPanel";
import { StatBlockPanel } from "./components/StatBlockPanel";
import { AppTab } from "./types";
import "./styles.css";

const TABS: { id: AppTab; label: string }[] = [
  { id: "initiative", label: "Combat" },
  { id: "encounters", label: "Encounters" },
  { id: "statblocks", label: "Bestiary" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("initiative");
  const obr = useOBR();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>Initiative</h1>
          {obr.isGM && <span className="gm-badge">GM</span>}
        </div>
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {!obr.isReady && (
          <div className="loading-screen">
            <div className="loading-rune">—</div>
            <p>Connecting to Owlbear Rodeo...</p>
          </div>
        )}
        {obr.isReady && (
          <>
            {activeTab === "initiative" && <InitiativePanel obr={obr} />}
            {activeTab === "encounters" && <EncounterPanel obr={obr} />}
            {activeTab === "statblocks" && <StatBlockPanel />}
          </>
        )}
      </main>
    </div>
  );
}
