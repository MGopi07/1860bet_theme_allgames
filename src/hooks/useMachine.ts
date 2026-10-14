import { useState, useEffect, useCallback, useRef } from "react";
import type { Machine, MachineType } from "../types";
import { machineConfig } from "../constants/machine";
import { api } from "../services/api";

export const BALANCE_EVENT = "winbet_balance_update";
export const CASHOUT_STATUS_EVENT = "winbet_cashout_status_change";
export const STATION_UNBOUND_EVENT = "winbet_station_unbound";
export const TOAST_EVENT = "winbet_toast_notification";

export interface CashoutStatusEventDetail {
  status: "PENDING" | "APPROVED" | "REJECTED" | "NONE";
  amount: number;
}

export const getStoredBalance = (fallback: number): number => {
  const stored = localStorage.getItem("winbet_machine_balance");
  if (stored !== null && stored.trim() !== "" && !isNaN(Number(stored))) {
    return Math.max(0, Number(stored));
  }
  return Math.max(0, fallback);
};

export const broadcastBalanceChange = (newBalance: number) => {
  const safeBalance = isNaN(newBalance) ? 0 : Math.max(0, Number(newBalance));
  localStorage.setItem("winbet_machine_balance", String(safeBalance));
  window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: { balance: safeBalance } }));
};

export const broadcastCashoutStatusChange = (
  status: "PENDING" | "APPROVED" | "REJECTED" | "NONE",
  amount: number
) => {
  const safeAmount = isNaN(amount) ? 0 : Math.max(0, Number(amount));
  window.dispatchEvent(
    new CustomEvent(CASHOUT_STATUS_EVENT, {
      detail: { status, amount: safeAmount },
    })
  );
};

export const broadcastStationUnbound = (balance?: number) => {
  const safeBalance =
    typeof balance === "number" && !isNaN(balance) ? Math.max(0, balance) : undefined;
  window.dispatchEvent(
    new CustomEvent(STATION_UNBOUND_EVENT, { detail: { balance: safeBalance } })
  );
};

export const broadcastToast = (message: string) => {
  if (!message) return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message } }));
};

// --- Shared Singleton Session Tracker ---
let activePollerSubscribers = 0;
let pollerInterval: ReturnType<typeof setInterval> | null = null;
let lastTrackedBalance: number = getStoredBalance(0);
let lastTrackedPendingStatus: string | null = null;
let lastPendingAmount: number = 0;
let lastStationStatus: string | null = null;

const runSessionTracker = async () => {
  const machineId = api.getStoredMachineId();
  const fingerprint = api.getDeviceFingerprint();
  if (!machineId) return;

  try {
    const session = await api.getSession(machineId, fingerprint);
    if (!session) return;

    // 1. Balance live sync
    if (typeof session.current_balance === "number") {
      const liveBal = session.current_balance;
      if (liveBal !== lastTrackedBalance) {
        const diff = liveBal - lastTrackedBalance;
        lastTrackedBalance = liveBal;
        broadcastBalanceChange(liveBal);

        // Only show chips loaded toast if positive diff and not during cashout
        if (diff > 0 && !session.pending_cash_out) {
          broadcastToast(`+N$ ${diff.toFixed(2)} chips loaded by cashier desk!`);
        }
      }
    }

    // 2. Cash out real-time status tracking
    const currentStatus = session.pending_cash_out?.status || "NONE";
    const prevStatus = lastTrackedPendingStatus;
    const currentReqAmount = session.pending_cash_out?.requested_amount || 0;
    if (currentReqAmount > 0) {
      lastPendingAmount = currentReqAmount;
    }

    if (prevStatus === "PENDING" && currentStatus === "APPROVED") {
      const amt = currentReqAmount || lastPendingAmount;
      broadcastCashoutStatusChange("APPROVED", amt);
      broadcastToast(`Cashier approved payout of N$ ${amt.toFixed(2)}!`);
    } else if (prevStatus === "PENDING" && currentStatus === "REJECTED") {
      const amt = currentReqAmount || lastPendingAmount;
      broadcastCashoutStatusChange("REJECTED", amt);
      broadcastToast(`Cashier rejected cash out. Credits restored to machine.`);
    } else if (prevStatus === "PENDING" && currentStatus === "NONE") {
      // Handle implicit action from cashier panel when pending_cash_out record is cleared
      if (session.current_balance > 0) {
        broadcastCashoutStatusChange("REJECTED", session.current_balance);
        broadcastToast(`Cashier rejected cash out. Credits restored to machine.`);
      } else {
        const amt = lastPendingAmount;
        broadcastCashoutStatusChange("APPROVED", amt);
        broadcastToast(
          amt > 0
            ? `Cashier approved payout of N$ ${amt.toFixed(2)}!`
            : `Cashier approved your cash out!`
        );
      }
    }

    // 3. Station unbind status from server (Only fire on status change to avoid spamming every tick)
    const isUnboundStatus =
      session.status === "UNBOUND" ||
      session.status === "INACTIVE" ||
      session.status === "DEAUTHORIZED" ||
      session.status === "UNASSIGNED" ||
      session.status === "MISMATCH" ||
      session.status === "LOCKED";

    if (isUnboundStatus && lastStationStatus !== session.status) {
      broadcastStationUnbound(session.current_balance ?? lastTrackedBalance);
    }

    lastStationStatus = session.status;
    lastTrackedPendingStatus = currentStatus;
  } catch {
    // Continue tracking seamlessly
  }
};

const startSessionTracker = () => {
  activePollerSubscribers++;
  if (activePollerSubscribers === 1) {
    runSessionTracker();
    pollerInterval = setInterval(runSessionTracker, 2500);
  }
};

const stopSessionTracker = () => {
  activePollerSubscribers = Math.max(0, activePollerSubscribers - 1);
  if (activePollerSubscribers === 0 && pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
};

export const useMachine = (initialType?: MachineType) => {
  const [machine, setMachine] = useState<Machine>(() => {
    const savedType =
      (localStorage.getItem("winbet_machine_type") as MachineType) ||
      initialType ||
      "smart-pc";
    const savedName = localStorage.getItem("winbet_machine_name");
    const savedShop = localStorage.getItem("winbet_shop_name");
    const baseConfig =
      savedType === "terminal" ? machineConfig.terminal : machineConfig.smartPc;
    const initialBalance = getStoredBalance(baseConfig.balance);

    return {
      ...baseConfig,
      name: savedName || baseConfig.name,
      shopName: savedShop || baseConfig.shopName,
      type: savedType,
      balance: initialBalance,
    };
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(null);
  }, []);

  const showToast = useCallback((message: string) => {
    if (!message) return;
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  // Clean up any pending toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const updateBalance = useCallback((newBalance: number) => {
    const validBalance = isNaN(newBalance) ? 0 : Math.max(0, Number(newBalance));
    lastTrackedBalance = validBalance;
    setMachine((prev) => {
      if (prev.balance === validBalance) return prev;
      return {
        ...prev,
        balance: validBalance,
      };
    });
    broadcastBalanceChange(validBalance);
  }, []);

  const addBalance = useCallback((amount: number) => {
    setMachine((prev) => {
      const nextBalance = Math.max(0, prev.balance + amount);
      lastTrackedBalance = nextBalance;
      broadcastBalanceChange(nextBalance);
      return {
        ...prev,
        balance: nextBalance,
      };
    });
  }, []);

  const selectMachineType = useCallback((type: MachineType) => {
    const config =
      type === "terminal" ? machineConfig.terminal : machineConfig.smartPc;
    const balance = getStoredBalance(config.balance);
    setMachine({
      ...config,
      type,
      balance,
    });
    localStorage.setItem("winbet_machine_type", type);
    localStorage.setItem("winbet_machine_name", config.name);
  }, []);

  // 1. Shared Real-time Live Session & Balance Poller
  useEffect(() => {
    startSessionTracker();
    return () => {
      stopSessionTracker();
    };
  }, []);

  useEffect(() => {
    if (initialType && initialType !== machine.type) {
      selectMachineType(initialType);
    }
  }, [initialType, machine.type, selectMachineType]);

  // 2. Global Event Listeners (Balance, Toast notifications, and Storage events)
  useEffect(() => {
    const handleBalanceEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ balance: number }>;
      if (customEvt.detail && typeof customEvt.detail.balance === "number") {
        const val = customEvt.detail.balance;
        lastTrackedBalance = val;
        setMachine((prev) => (prev.balance !== val ? { ...prev, balance: val } : prev));
      }
    };

    const handleToastEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ message: string }>;
      if (customEvt.detail?.message) {
        showToast(customEvt.detail.message);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "winbet_machine_balance" && e.newValue !== null) {
        const val = Number(e.newValue);
        if (!isNaN(val)) {
          lastTrackedBalance = val;
          setMachine((prev) => (prev.balance !== val ? { ...prev, balance: val } : prev));
        }
      } else if (e.key === "winbet_machine_name" && e.newValue) {
        setMachine((prev) => ({ ...prev, name: e.newValue || prev.name }));
      } else if (e.key === "winbet_shop_name" && e.newValue) {
        setMachine((prev) => ({ ...prev, shopName: e.newValue || prev.shopName }));
      }
    };

    window.addEventListener(BALANCE_EVENT, handleBalanceEvent);
    window.addEventListener(TOAST_EVENT, handleToastEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(BALANCE_EVENT, handleBalanceEvent);
      window.removeEventListener(TOAST_EVENT, handleToastEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [showToast]);

  return {
    machine,
    updateBalance,
    addBalance,
    selectMachineType,
    toastMessage,
    showToast,
    clearToast,
  };
};
