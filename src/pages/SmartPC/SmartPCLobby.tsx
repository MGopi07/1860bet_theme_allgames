import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GamingLayout } from "../../components/layout/GamingLayout";
import { GameGrid } from "../../components/gaming/GameGrid";
import { CashOutModal } from "../../components/gaming/CashOutModal";
import { ValidationModals } from "../../components/gaming/ValidationModals";
import { ZeroBalanceModal } from "../../components/gaming/ZeroBalanceModal";
import { useMachine, CASHOUT_STATUS_EVENT, STATION_UNBOUND_EVENT } from "../../hooks/useMachine";
import { api } from "../../services/api";
import type { ValidationAlertType } from "../../types";

export const SmartPCLobby: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { machine, updateBalance, selectMachineType, toastMessage, showToast, clearToast } =
    useMachine("smart-pc");

  // Step 4 Cash Out Confirm Modal
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  // Zero Balance Notice Modal
  const [isZeroBalanceModalOpen, setIsZeroBalanceModalOpen] = useState(false);

  // Validation / Queue Alerts (05 Pending, 06 Rejected, 06 Low Shop Balance, Approved, Chips Loaded)
  const [activeAlert, setActiveAlert] = useState<ValidationAlertType>("NONE");
  const [pendingCashoutAmount, setPendingCashoutAmount] = useState<number>(0);

  const handleRegisterNewToken = useCallback(() => {
    localStorage.removeItem("winbet_machine_id");
    localStorage.removeItem("winbet_numeric_id");
    localStorage.removeItem("winbet_setup_code");
    localStorage.removeItem("winbet_registration_token");
    localStorage.removeItem("winbet_machine_name");
    navigate("/register");
  }, [navigate]);

  // Check if arriving from game page cashout
  useEffect(() => {
    if (location.state?.cashoutRequested) {
      const amt = Number(location.state.amount) || 0;
      setPendingCashoutAmount(amt);
      setActiveAlert("CASHOUT_PENDING");
      showToast(`Cash Out of N$ ${amt.toFixed(2)} requested! Waiting for cashier...`);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  const syncSession = useCallback(() => {
    const machineId = api.getStoredMachineId();
    const fingerprint = api.getDeviceFingerprint();

    api
      .getSession(machineId, fingerprint)
      .then((session) => {
        if (session) {
          if (
            session.status === "UNBOUND" ||
            session.status === "INACTIVE" ||
            session.status === "DEAUTHORIZED" ||
            session.status === "UNASSIGNED" ||
            session.status === "MISMATCH" ||
            session.status === "LOCKED"
          ) {
            setActiveAlert("STATION_UNBOUND");
            return;
          }
          if (typeof session.current_balance === "number") {
            updateBalance(session.current_balance);
          }
          if (session.pending_cash_out && session.pending_cash_out.requested_amount) {
            setPendingCashoutAmount(session.pending_cash_out.requested_amount);
          }
        }
      })
      .catch(() => {});
  }, [updateBalance]);

  // 1. PDF Flow #2: Background Heartbeat (POST /smart-pcs/heartbeat - timer only, no button)
  useEffect(() => {
    const machineId = api.getStoredMachineId();
    const fingerprint = api.getDeviceFingerprint();

    const doHeartbeat = () => {
      api
        .sendHeartbeat(machineId, fingerprint)
        .then((res) => {
          if (
            res.data?.status === "UNBOUND" ||
            res.data?.status === "INACTIVE" ||
            res.data?.status === "DEAUTHORIZED" ||
            res.data?.status === "UNASSIGNED" ||
            res.data?.status === "MISMATCH" ||
            res.data?.status === "LOCKED" ||
            (typeof res.message === "string" && res.message.toLowerCase().includes("unbound"))
          ) {
            setActiveAlert("STATION_UNBOUND");
            return;
          }
          if (res.data && typeof res.data.current_balance === "number") {
            updateBalance(res.data.current_balance);
          }
        })
        .catch(() => {});
    };

    // Initial heartbeat
    doHeartbeat();

    // Periodic heartbeat every 10 seconds to keep Smart PC ONLINE and sync station status
    const heartbeatTimer = setInterval(doHeartbeat, 10000);

    // Also sync on window focus (e.g. after returning from provider popout or iframe)
    window.addEventListener("focus", syncSession);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener("focus", syncSession);
    };
  }, [updateBalance, syncSession]);

  // 2. PDF Flow #3: Initial Session Check (GET /smart-pcs/session)
  useEffect(() => {
    syncSession();
  }, [syncSession]);

  // 3. PDF Flow #7: Step 3 -> 4: Open Cash Out Confirm Modal
  const handleOpenCashout = () => {
    if (machine.balance <= 0) {
      setIsZeroBalanceModalOpen(true);
      return;
    }
    setIsCashoutModalOpen(true);
  };

  // 4. PDF Flow #7: Step 4 -> 5: Player confirms Cash Out (POST /cashout/request) -> Status = PENDING
  const handleConfirmCashout = async () => {
    const cashoutAmount = machine.balance;
    setPendingCashoutAmount(cashoutAmount);
    setIsCashoutModalOpen(false);

    try {
      await api.requestCashOut(cashoutAmount);
      updateBalance(0.0);

      // PDF Flow #7: Screen 05 Cash Out Pending (Waiting for Cashier in Shop panel)
      setActiveAlert("CASHOUT_PENDING");
      showToast(`Cash Out of N$ ${cashoutAmount.toFixed(2)} requested! Waiting for cashier...`);
    } catch {
      updateBalance(0.0);
      setActiveAlert("CASHOUT_PENDING");
    }
  };

  // 5. Staff Cashier Approves Cash Out
  const handleCashierApprove = async () => {
    await api.cashierApproveCashout();
    setActiveAlert("NONE");
    showToast(`Cashier approved! N$ ${pendingCashoutAmount.toFixed(2)} paid in cash.`);
  };

  // 6. Staff Cashier Rejects Cash Out (Broadcast event: CASHOUT_REJECTED -> Screen 06 Credits Restored)
  const handleCashierReject = async () => {
    const res = await api.cashierRejectCashout();
    const restoredAmt = res.restoredAmount || pendingCashoutAmount || 250.0;
    updateBalance(restoredAmt);
    setActiveAlert("CASHOUT_REJECTED");
    showToast(`Cash Out rejected by cashier. N$ ${restoredAmt.toFixed(2)} restored to Smart PC.`);
  };

  const handleCloseAlert = () => {
    setActiveAlert("NONE");
  };

  // Listen to remote cashout events & poll status automatically when CASHOUT_PENDING
  useEffect(() => {
    const handleCashoutStatus = (e: Event) => {
      const customEvt = e as CustomEvent<{ status: string; amount: number }>;
      if (customEvt.detail.status === "REJECTED") {
        setPendingCashoutAmount(customEvt.detail.amount);
        setActiveAlert("CASHOUT_REJECTED");
      } else if (customEvt.detail.status === "APPROVED") {
        setActiveAlert("NONE");
        showToast(`Cashier approved! N$ ${customEvt.detail.amount.toFixed(2)} paid in cash.`);
      }
    };
    const handleStationUnbound = (e: Event) => {
      const customEvt = e as CustomEvent<{ balance?: number }>;
      setActiveAlert("STATION_UNBOUND");
      if (typeof customEvt.detail?.balance === "number") {
        updateBalance(customEvt.detail.balance);
      }
    };
    const handleBalanceUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ balance?: number }>;
      if (typeof customEvt.detail?.balance === "number" && customEvt.detail.balance > 0) {
        setActiveAlert((prev) => {
          if (prev === "STATION_UNBOUND") {
            showToast(`Chips loaded! Smart PC authorized with N$ ${customEvt.detail?.balance?.toFixed(2)}.`);
            return "NONE";
          }
          return prev;
        });
      }
    };

    window.addEventListener(CASHOUT_STATUS_EVENT, handleCashoutStatus);
    window.addEventListener(STATION_UNBOUND_EVENT, handleStationUnbound);
    window.addEventListener("winbet_balance_update", handleBalanceUpdate);

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    if (activeAlert === "CASHOUT_PENDING") {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.getCashoutStatus();
          if (res) {
            const latestStatus = res.latest?.status?.toUpperCase();
            const pendingStatus = res.pending?.status?.toUpperCase();

            if (latestStatus === "APPROVED" && (!res.pending || pendingStatus === "APPROVED")) {
              setActiveAlert("NONE");
              showToast(`Cashier approved payout of N$ ${(res.latest?.requested_amount || pendingCashoutAmount).toFixed(2)}!`);
            } else if (latestStatus === "REJECTED" && (!res.pending || pendingStatus === "REJECTED")) {
              const restored = res.latest?.requested_amount || pendingCashoutAmount;
              updateBalance(restored);
              setActiveAlert("CASHOUT_REJECTED");
              showToast(`Cash out declined. N$ ${restored.toFixed(2)} restored.`);
            }
          }
        } catch {
          // ignore network poll errors
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener(CASHOUT_STATUS_EVENT, handleCashoutStatus);
      window.removeEventListener(STATION_UNBOUND_EVENT, handleStationUnbound);
      window.removeEventListener("winbet_balance_update", handleBalanceUpdate);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeAlert, pendingCashoutAmount, showToast, updateBalance]);



  return (
    <>
      <GamingLayout
        machineType="smart-pc"
        machineName={machine.name || "Smart PC-03"}
        shopName={machine.shopName}
        shopLocation={machine.location}
        balance={machine.balance}
        actionText="Cash Out"
        onPrimaryAction={handleOpenCashout}
        onToggleMachineType={selectMachineType}
        toastMessage={toastMessage}
        onDismissToast={clearToast}
      >
        <GameGrid
          machineType="smart-pc"
          machineName={machine.name || "Smart PC-03"}
          shopName={machine.shopName}
          balance={machine.balance}
          onBalanceChange={updateBalance}
          showToast={showToast}
          onOpenCashout={handleOpenCashout}
          onZeroBalance={() => setIsZeroBalanceModalOpen(true)}
        />
      </GamingLayout>

      {/* Zero Balance Friendly Modal */}
      <ZeroBalanceModal
        isOpen={isZeroBalanceModalOpen}
        onClose={() => setIsZeroBalanceModalOpen(false)}
        shopName={machine.shopName}
        machineName={machine.name}
      />

      {/* Smart PC Step 4: Cash Out Confirmation Modal */}
      <CashOutModal
        isOpen={isCashoutModalOpen}
        onClose={() => setIsCashoutModalOpen(false)}
        onConfirm={handleConfirmCashout}
        amount={machine.balance}
      />

      {/* Smart PC Step 5 (Pending), Step 6 (Rejected), Approved, Chips Loaded, Shop Balance Low */}
      <ValidationModals
        alertType={activeAlert}
        isOpen={activeAlert !== "NONE"}
        onClose={handleCloseAlert}
        amount={activeAlert === "STATION_UNBOUND" ? machine.balance : pendingCashoutAmount}
        onSimulateApprove={handleCashierApprove}
        onSimulateReject={handleCashierReject}
        onRegisterNewToken={handleRegisterNewToken}
      />
    </>
  );
};
