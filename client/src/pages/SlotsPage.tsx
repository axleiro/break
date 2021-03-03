import * as React from "react";

import { useStopMetrics, useSlotTiming } from "providers/slot";
import { SlotTableRow } from "components/SlotTableRow";
import { Header } from "components/Header";

export default function Slots() {
  const [stopped, setStopped] = useStopMetrics();

  return (
    <div className="container-fluid mw-2 min-vh-100 d-flex flex-column">
      <Header />
      <div className="row flex-grow-1 my-5">
        <div className="col">
          <div className="card h-100 mb-0">
            <div className="card-header">
              <div className="d-flex align-items-center">
                <span className="text-truncate">Live Slot Stats</span>
              </div>
              <span
                className="btn btn-pink text-uppercase text-truncate touch-action-none"
                onClick={() => setStopped(!stopped)}
              >
                {stopped ? "Reset" : "Stop"}
              </span>
            </div>
            <SlotTable />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotTable() {
  const slotTiming = useSlotTiming();
  let min = Number.MAX_SAFE_INTEGER,
    max = 0;
  for (const slot of slotTiming.current.keys()) {
    min = Math.min(min, slot);
    max = Math.max(max, slot);
  }

  const slots = [];
  for (let i = min; i <= max; i++) {
    slots.push(i);
  }

  return (
    <div className="main">
      <div className="content">
        <div className="debug-wrapper">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th className="text-muted sticky">Leader</th>
                <th className="text-muted sticky">Slot + Parent</th>
                <th className="text-muted sticky">Tx Count</th>
                <th className="text-muted sticky">Entry Count</th>
                <th className="text-muted sticky">Max Tx Per Entry</th>
                <th className="text-muted sticky">First Shred</th>
                <th className="text-muted sticky">All Shreds</th>
                <th className="text-muted sticky">Replay Start</th>
                <th className="text-muted sticky">Replay End / Fail</th>
                <th className="text-muted sticky">Voted</th>
                <th className="text-muted sticky">Confirmed</th>
                <th className="text-muted sticky">Rooted</th>
              </tr>
            </thead>
            <tbody className="list">
              {slots.map((slot) => (
                <SlotTableRow
                  key={slot}
                  slot={slot}
                  timing={slotTiming.current.get(slot)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
