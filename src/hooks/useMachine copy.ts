import { useState, useEffect, useCallback, useRef } from "react";
import type { Machine, MachineType } from "../types";
import { machineConfig } from "../constants/machine";
import { api } from "../services/api";

const BALANCE_EVENT = "winbet_balance_update";
export const CASHOUT_STATUS_EVENT = "winbet_cashout_status_change";
export const STATION_UNBOUND_EVENT = "winbet_station_unbound";

export interface CashoutStatusEventDetail {
  status: "PENDING" | "APPROVED" | "REJECTED" | "NONE";
  amount: number;
}

export const broadcastBalanceChange = (newBalance: number) => {
  localStorage.setItem("winbet_machine_balance", String(newBalance));
  window.dispatchEvent(new CustomEvent(BALANCE_EVENT, { detail: { balance: newBalance } }));
};

export const broadcastCashoutStatusChange = (status: "PENDING" | "APPROVED" | "REJECTED" | "NONE", amount: number) => {
  window.dispatchEvent(new CustomEvent(CASHOUT_STATUS_EVENT, { detail: { status, amount } }));
};

export const broadcastStationUnbound = (balance?: number) => {
  window.dispatchEvent(new CustomEvent(STATION_UNBOUND_EVENT, { detail: { balance } }));
};

export const getStoredBalance = (fallback: number): number => {
  const stored = localStorage.getItem("winbet_machine_balance");
  if (stored !== null && stored !== "" && !isNaN(Number(stored))) {
    return Number(stored);
  }
  return fallback;
};

export const useMachine = (initialType?: MachineType) => {
  const [machine, setMachine] = useState<Machine>(() => {
    const savedType = (localStorage.getItem("winbet_machine_type") as MachineType) || initialType || "smart-pc";
    const savedName = localStorage.getItem("winbet_machine_name");
    const savedShop = localStorage.getItem("winbet_shop_name");
    const baseConfig = savedType === "terminal" ? machineConfig.terminal : machineConfig.smartPc;
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
  const previousPendingStatusRef = useRef<string | null>(null);
  const previousBalanceRef = useRef<number>(machine.balance);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const updateBalance = useCallback((newBalance: number) => {
    const validBalance = isNaN(newBalance) ? 0 : Math.max(0, Number(newBalance));
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
      broadcastBalanceChange(nextBalance);
      return {
        ...prev,
        balance: nextBalance,
      };
    });
  }, []);

  const selectMachineType = useCallback((type: MachineType) => {
    const config = type === "terminal" ? machineConfig.terminal : machineConfig.smartPc;
    const balance = getStoredBalance(config.balance);
    setMachine({
      ...config,
      type,
      balance,
    });
    localStorage.setItem("winbet_machine_type", type);
    localStorage.setItem("winbet_machine_name", config.name);
  }, []);

  // 1. Real-time Live Session & Balance Socket Tracker (Polls every 2.5s)
  useEffect(() => {
    let isMounted = true;

    const trackLiveSession = async () => {
      const machineId = api.getStoredMachineId();
      const fingerprint = api.getDeviceFingerprint();
      if (!machineId) return;

      try {
        const session = await api.getSession(machineId, fingerprint);
        if (!isMounted || !session) return;

        // Balance live sync
        if (typeof session.current_balance === "number") {
          const liveBal = session.current_balance;
          if (liveBal !== previousBalanceRef.current) {
            const diff = liveBal - previousBalanceRef.current;
            previousBalanceRef.current = liveBal;
            updateBalance(liveBal);

            if (diff > 0 && !session.pending_cash_out) {
              showToast(`+N$ ${diff.toFixed(2)} chips loaded by cashier desk!`);
            }
          }
        }

        // Cash out real-time status tracking
        const currentStatus = session.pending_cash_out?.status || "NONE";
        const prevStatus = previousPendingStatusRef.current;

        if (prevStatus === "PENDING" && currentStatus === "APPROVED") {
          broadcastCashoutStatusChange("APPROVED", session.pending_cash_out?.requested_amount || 0);
          showToast(`Cashier approved payout of N$ ${(session.pending_cash_out?.requested_amount || 0).toFixed(2)}!`);
        } else if (prevStatus === "PENDING" && currentStatus === "REJECTED") {
          broadcastCashoutStatusChange("REJECTED", session.pending_cash_out?.requested_amount || 0);
          showToast(`Cashier rejected cash out. Credits restored to machine.`);
        } else if (prevStatus === "PENDING" && currentStatus === "NONE") {
          // Handle implicit action from admin panel if they delete the pending_cash_out
          if (session.current_balance > 0) {
            broadcastCashoutStatusChange("REJECTED", session.current_balance);
            showToast(`Cashier rejected cash out. Credits restored to machine.`);
          } else {
            broadcastCashoutStatusChange("APPROVED", 0);
            showToast(`Cashier approved your cash out!`);
          }
        }

        // Check for station unbind status from server
        if (
          session.status === "UNBOUND" ||
          session.status === "INACTIVE" ||
          session.status === "DEAUTHORIZED" ||
          session.status === "UNASSIGNED" ||
          session.status === "MISMATCH" ||
          session.status === "LOCKED"
        ) {
          broadcastStationUnbound(session.current_balance ?? previousBalanceRef.current);
        }

        previousPendingStatusRef.current = currentStatus;
      } catch {
        // Continue tracking seamlessly
      }
    };

    // Initial sync and interval tracking
    trackLiveSession();
    const trackerInterval = setInterval(trackLiveSession, 2500);

    return () => {
      isMounted = false;
      clearInterval(trackerInterval);
    };
  }, [updateBalance, showToast]);

  useEffect(() => {
    if (initialType && initialType !== machine.type) {
      selectMachineType(initialType);
    }
  }, [initialType, machine.type, selectMachineType]);

  useEffect(() => {
    const handleBalanceEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ balance: number }>;
      if (customEvt.detail && typeof customEvt.detail.balance === "number") {
        setMachine((prev) => (prev.balance !== customEvt.detail.balance ? { ...prev, balance: customEvt.detail.balance } : prev));
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "winbet_machine_balance" && e.newValue !== null) {
        const val = Number(e.newValue);
        if (!isNaN(val)) {
          setMachine((prev) => (prev.balance !== val ? { ...prev, balance: val } : prev));
        }
      } else if (e.key === "winbet_machine_name" && e.newValue) {
        setMachine((prev) => ({ ...prev, name: e.newValue || prev.name }));
      } else if (e.key === "winbet_shop_name" && e.newValue) {
        setMachine((prev) => ({ ...prev, shopName: e.newValue || prev.shopName }));
      }
    };

    window.addEventListener(BALANCE_EVENT, handleBalanceEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(BALANCE_EVENT, handleBalanceEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

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
