import { LeaderSchedule } from "@solana/web3.js";
import React from "react";
import { useConnection } from "./rpc";
import { DEBUG_MODE } from "./transactions/confirmed";

const SlotContext = React.createContext<
  React.MutableRefObject<number | undefined> | undefined
>(undefined);

const LeaderScheduleContext = React.createContext<
  React.MutableRefObject<[number, LeaderSchedule] | undefined> | undefined
>(undefined);

const SlotMetricsContext = React.createContext<
  React.MutableRefObject<Map<number, SlotTiming>> | undefined
>(undefined);

const SlotMetricsCounter = React.createContext<number | undefined>(undefined);
const ToggleMetricsContext = React.createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

export type SlotStats = {
  numTransactionEntries: number;
  numSuccessfulTransactions: number;
  numFailedTransactions: number;
  maxTransactionsPerEntry: number;
};

export type SlotTiming = {
  firstShred: number;
  parent?: number;
  fullSlot?: number;
  createdBank?: number;
  frozen?: number;
  dead?: number;
  err?: string;
  confirmed?: number;
  rooted?: number;
  stats?: SlotStats;
};

export function useTargetSlotRef() {
  const slotRef = React.useContext(SlotContext);
  if (!slotRef) {
    throw new Error(`useTargetSlotRef must be used within a SlotProvider`);
  }

  return slotRef;
}

export function useLeaderSchedule() {
  const res = React.useContext(LeaderScheduleContext);
  if (!res) {
    throw new Error(`useLeaderSchedule must be used within a SlotProvider`);
  }

  return res;
}

export function useSlotTiming() {
  React.useContext(SlotMetricsCounter);
  const ref = React.useContext(SlotMetricsContext);
  if (!ref) {
    throw new Error(`useSlotMetricsRef must be used within a SlotProvider`);
  }

  return ref;
}

export function useStopMetrics() {
  const toggle = React.useContext(ToggleMetricsContext);
  if (!toggle) {
    throw new Error(`useMetricsToggle must be used within a SlotProvider`);
  }

  return toggle;
}

type ProviderProps = { children: React.ReactNode };
export function SlotProvider({ children }: ProviderProps) {
  const connection = useConnection();
  const targetSlot = React.useRef<number>();
  const slotMetrics = React.useRef(new Map<number, SlotTiming>());
  const [metricsCounter, setCounter] = React.useState(0);
  const stoppedState = React.useState(false);
  const stopped = stoppedState[0];
  const leaderSchedule = React.useRef<[number, LeaderSchedule]>();

  React.useEffect(() => {
    if (connection) {
      (async () => {
        try {
          const epochInfo = await connection.getEpochInfo();
          const slotOffset = epochInfo.absoluteSlot - epochInfo.slotIndex;
          const schedule = await connection.getLeaderSchedule();
          leaderSchedule.current = [slotOffset, schedule];
        } catch (err) {
          console.error("failed to get leader schedule", err);
        }
      })();
    }
  }, [connection]);

  React.useEffect(() => {
    if (stopped || connection === undefined) {
      return;
    } else {
      slotMetrics.current.clear();
    }

    let disabledSlotSubscription = false;
    const slotSubscription = connection.onSlotChange(({ slot }) => {
      if (!DEBUG_MODE) {
        targetSlot.current = slot;
      }
    });

    const interval = setInterval(() => {
      setCounter((c) => c + 1);
    }, 1000);

    const updateTimeout = setTimeout(() => {
      stoppedState[1](true);
    }, 5 * 60 * 1000);

    const slotUpdateSubscription = connection.onSlotUpdate((notification) => {
      // Remove if slot update api is active
      if (!disabledSlotSubscription) {
        connection.removeSlotChangeListener(slotSubscription);
        disabledSlotSubscription = true;
      }

      const { slot, timestamp } = notification;
      if (notification.type === "firstShredReceived") {
        targetSlot.current = Math.max(slot, targetSlot.current || 0);
        slotMetrics.current.set(slot, {
          firstShred: timestamp,
        });
        return;
      }

      const slotTiming = slotMetrics.current.get(slot);
      if (!slotTiming) {
        return;
      }

      switch (notification.type) {
        case "shredsFull": {
          slotTiming.fullSlot = timestamp;
          break;
        }
        case "createdBank": {
          slotTiming.parent = notification.parent;
          slotTiming.createdBank = timestamp;
          break;
        }
        case "dead": {
          slotTiming.dead = timestamp;
          slotTiming.err = notification.err;
          break;
        }
        case "frozen": {
          slotTiming.frozen = timestamp;
          slotTiming.stats = notification.stats;
          break;
        }
        case "optimisticConfirmation": {
          slotTiming.confirmed = timestamp;
          break;
        }
        case "root": {
          slotTiming.rooted = timestamp;
          break;
        }
      }
    });

    return () => {
      clearInterval(interval);
      clearTimeout(updateTimeout);
      if (!disabledSlotSubscription) {
        connection.removeSlotChangeListener(slotSubscription);
      }
      connection.removeSlotUpdateListener(slotUpdateSubscription);
    };
  }, [connection, stopped]);

  return (
    <SlotContext.Provider value={targetSlot}>
      <SlotMetricsContext.Provider value={slotMetrics}>
        <SlotMetricsCounter.Provider value={metricsCounter}>
          <ToggleMetricsContext.Provider value={stoppedState}>
            <LeaderScheduleContext.Provider value={leaderSchedule}>
              {children}
            </LeaderScheduleContext.Provider>
          </ToggleMetricsContext.Provider>
        </SlotMetricsCounter.Provider>
      </SlotMetricsContext.Provider>
    </SlotContext.Provider>
  );
}
