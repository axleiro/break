import * as React from "react";

import "styles/animate.scss";
import { TransactionState } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";
import { useSlotTiming } from "providers/slot";
import type { SlotTiming } from "providers/slot";

interface Props {
  transaction: TransactionState;
}

export function timeElapsed(
  sentAt: number | undefined,
  receivedAt: number | undefined
): string | undefined {
  if (sentAt === undefined || receivedAt === undefined) return;
  return (Math.max(0, receivedAt - sentAt) / 1000).toFixed(3) + "s";
}

export function TxTableRow({ transaction }: Props) {
  const signature = transaction.details.signature;
  const selectTransaction = useSelectTransaction();
  const slotMetrics = useSlotTiming();

  let targetSlot;
  let landedSlot: number | undefined;
  let timing;
  let received;
  if (transaction.status === "success") {
    targetSlot = transaction.slot.target;
    landedSlot = transaction.slot.landed;
    timing = transaction.timing;
    received = transaction.received;
  } else if (transaction.status === "timeout") {
  } else {
    targetSlot = transaction.pending.targetSlot;
    timing = transaction.timing;
    received = transaction.received;
  }

  let slotTiming: SlotTiming | undefined;
  let landedTime: number | undefined;
  let forkedSlots = [];
  if (landedSlot !== undefined) {
    landedTime = received?.find((r) => r.slot === landedSlot)?.timestamp;
    slotTiming = slotMetrics.current.get(landedSlot);
    if (targetSlot) {
      for (let slot = targetSlot; slot < landedSlot; slot++) {
        if (slotMetrics.current.get(slot)?.confirmed === undefined) {
          forkedSlots.push(slot.toString().substr(-3));
        }
      }
    }
  }

  return (
    <tr
      className="debug-row text-monospace"
      onClick={() => selectTransaction(signature)}
    >
      <td>{signature.slice(0, 7)}…</td>
      <td>{targetSlot || "-"}</td>
      <td>{landedSlot || "-"}</td>
      <td>{slotTiming?.numTransactions || "-"}</td>
      <td>{slotTiming?.numEntries || "-"}</td>
      <td>{slotTiming?.maxTpe || "-"}</td>
      <td>{forkedSlots.toString() || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.firstShred) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, landedTime) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.fullSlot) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.replayStart) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.frozen) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.voted) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.confirmed) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.rooted) || "-"}</td>
    </tr>
  );
}
