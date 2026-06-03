"use client";

import React from "react";

export function LaunchStatus() {
  const [acknowledged, setAcknowledged] = React.useState(false);

  return (
    <button className="status" onClick={() => setAcknowledged((value) => !value)}>
      {acknowledged ? "Client hydration confirmed" : "Confirm client hydration"}
    </button>
  );
}
