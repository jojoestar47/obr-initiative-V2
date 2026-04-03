import React from "react";
import ReactDOM from "react-dom/client";
import OBR from "@owlbear-rodeo/sdk";
import App from "./App";

OBR.onReady(async () => {
  await OBR.action.setWidth(360);
  await OBR.action.setHeight(600);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
