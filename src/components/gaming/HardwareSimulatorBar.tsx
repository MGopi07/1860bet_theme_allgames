import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MachineType, ValidationAlertType } from "../../types";

interface HardwareSimulatorBarProps {
  machineType: MachineType;
  balance: number;
  onAddBalance: (amt: number, note: string) => void;
  onTriggerAlert: (type: ValidationAlertType, customAmount?: number) => void;
  onOpenCashoutFlow: () => void;
}

export const HardwareSimulatorBar: React.FC<HardwareSimulatorBarProps> = ({
  machineType,
  balance,
  onAddBalance,
  onTriggerAlert,
  onOpenCashoutFlow,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="hardware-simulator-bar position-sticky bottom-0 start-0 end-0 z-3 p-2 text-light"
      style={{
        background: "rgba(16, 11, 7, 0.95)",
        borderTop: "1.5px solid rgba(245, 131, 31, 0.35)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 -8px 25px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div className="container-fluid px-2 px-md-3">
        {/* Toggle Bar / Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge d-inline-flex align-items-center gap-1 bg-dark text-warning border border-warning-subtle px-2 py-1"
              style={{ fontSize: "0.74rem" }}
            >
              <i className="fa-solid fa-microchip text-warning"></i>
              <span>HARDWARE & VALIDATION LAB (PURE WEB / NO TAURI)</span>
            </span>

            <span className="text-secondary small d-none d-md-inline" style={{ fontSize: "0.76rem" }}>
              Simulate real devices, validation popups, and desk actions
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              <i className={`fa-solid ${isExpanded ? "fa-chevron-down" : "fa-sliders"}`}></i>
              <span>{isExpanded ? "Hide Hardware Panel" : "Open Hardware Panel"}</span>
            </button>
          </div>
        </div>

        {/* Expandable Controls Drawer */}
        {isExpanded && (
          <div className="pt-3 mt-2 border-top border-warning border-opacity-25 animate__animated animate__fadeIn">
            <div className="row g-2">
              {/* ==============================================================
                  TERMINAL HARDWARE CONTROLS
                  ============================================================== */}
              {machineType === "terminal" && (
                <>
                  {/* Column 1: Bill Acceptor */}
                  <div className="col-12 col-md-4">
                    <div
                      className="p-2 rounded h-100 border"
                      style={{ background: "rgba(22, 15, 10, 0.6)", borderColor: "rgba(245, 131, 31, 0.3)" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-warning small d-flex align-items-center gap-1">
                          <i className="fa-solid fa-money-bill-wave text-success"></i> Bill Acceptor (Cash-In)
                        </span>
                        <span className="badge bg-success text-dark" style={{ fontSize: "0.65rem" }}>
                          Auto / Port
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onAddBalance(50, "Bill Acceptor: Accepted N$ 50.00 note")}
                        >
                          +N$ 50 Note
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onAddBalance(100, "Bill Acceptor: Accepted N$ 100.00 note")}
                        >
                          +N$ 100 Note
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onAddBalance(200, "Bill Acceptor: Accepted N$ 200.00 note")}
                        >
                          +N$ 200 Note
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-warning py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("NOTE_NOT_ACCEPTED")}
                          title="Screen 08: Cash Not Accepted"
                        >
                          <i className="fa-solid fa-ban me-1"></i> Bad Note (08)
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-danger py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("SHOP_BALANCE_TOO_LOW")}
                          title="Screen 06: Shop Balance Too Low"
                        >
                          <i className="fa-solid fa-triangle-exclamation me-1"></i> Low Shop Bal (06)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Barcode Scanner */}
                  <div className="col-12 col-md-4">
                    <div
                      className="p-2 rounded h-100 border"
                      style={{ background: "rgba(22, 15, 10, 0.6)", borderColor: "rgba(245, 131, 31, 0.3)" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-info small d-flex align-items-center gap-1">
                          <i className="fa-solid fa-barcode text-info"></i> Barcode Scanner (Ticket-In)
                        </span>
                        <span className="badge bg-info text-dark" style={{ fontSize: "0.65rem" }}>
                          USB Keyboard
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-info py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onAddBalance(250, "Ticket Scanner: Redeemed Ticket N$ 250.00")}
                        >
                          +Scan Ticket (N$ 250)
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-warning py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("SCAN_AGAIN")}
                          title="Screen 09: Barcode scanner waking up / partial read"
                        >
                          <i className="fa-solid fa-rotate me-1"></i> Scan Again (09)
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-danger py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("TICKET_NOT_ACCEPTED")}
                          title="Screen 10: Bad / used / invalid ticket"
                        >
                          <i className="fa-solid fa-ban me-1"></i> Invalid Ticket (10)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Epson Printer & Cashout Alerts */}
                  <div className="col-12 col-md-4">
                    <div
                      className="p-2 rounded h-100 border"
                      style={{ background: "rgba(22, 15, 10, 0.6)", borderColor: "rgba(245, 131, 31, 0.3)" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-warning small d-flex align-items-center gap-1">
                          <i className="fa-solid fa-print text-warning"></i> Epson Printer (Cash-Out)
                        </span>
                        <span className="badge bg-warning text-dark" style={{ fontSize: "0.65rem" }}>
                          USB Esc/POS
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-gold-action py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={onOpenCashoutFlow}
                        >
                          <i className="fa-solid fa-receipt me-1"></i> Print Ticket (04/05)
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-warning py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("PRINTER_REQUIRED", balance)}
                          title="Screen 11: Printer required / disconnected before cashout"
                        >
                          <i className="fa-solid fa-triangle-exclamation me-1"></i> Printer Required (11)
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-danger py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("PRINTER_FAILED", balance || 250)}
                          title="Screen 07: Print failed after ticket issued -> Credits restored"
                        >
                          <i className="fa-solid fa-rotate-left me-1"></i> Print Failed (07)
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ==============================================================
                  SMART PC HARDWARE / DESK CONTROLS
                  ============================================================== */}
              {machineType === "smart-pc" && (
                <>
                  {/* Column 1: Cashier Desk Cash-In (Load Coins) */}
                  <div className="col-12 col-md-6">
                    <div
                      className="p-2 rounded h-100 border"
                      style={{ background: "rgba(22, 15, 10, 0.6)", borderColor: "rgba(245, 131, 31, 0.3)" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-success small d-flex align-items-center gap-1">
                          <i className="fa-solid fa-coins text-warning"></i> Cashier Desk (Load Coins)
                        </span>
                        <span className="badge bg-dark text-warning border border-warning" style={{ fontSize: "0.65rem" }}>
                          Back Office Cash-In
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onAddBalance(100, "Desk: Cashier loaded N$ 100.00 coins")}
                        >
                          +Desk Load N$ 100
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onAddBalance(250, "Desk: Cashier loaded N$ 250.00 coins")}
                        >
                          +Desk Load N$ 250
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-danger py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("SHOP_BALANCE_TOO_LOW")}
                          title="Screen 06: Shop Balance Low on Load Coins"
                        >
                          <i className="fa-solid fa-triangle-exclamation me-1"></i> Low Shop Bal (06)
                        </button>
                      </div>
                      <div className="text-secondary small" style={{ fontSize: "0.74rem" }}>
                        Smart PC has no bill acceptor, scanner, or printer. Cashier loads coins from Back Office.
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Cash Out Queue Flow */}
                  <div className="col-12 col-md-6">
                    <div
                      className="p-2 rounded h-100 border"
                      style={{ background: "rgba(22, 15, 10, 0.6)", borderColor: "rgba(245, 131, 31, 0.3)" }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-bold text-warning small d-flex align-items-center gap-1">
                          <i className="fa-solid fa-hand-holding-dollar text-warning"></i> Cash Out Workflow
                        </span>
                        <span className="badge bg-warning text-dark" style={{ fontSize: "0.65rem" }}>
                          Desk Queue
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        <button
                          type="button"
                          className="btn btn-xs btn-gold-action py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={onOpenCashoutFlow}
                        >
                          <i className="fa-solid fa-money-bill-transfer me-1"></i> Request Cash Out (04/05)
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-danger py-1 px-2"
                          style={{ fontSize: "0.72rem" }}
                          onClick={() => onTriggerAlert("CASHOUT_REJECTED", balance || 250)}
                          title="Screen 06: Cashier Rejects Cash Out -> Credits Restored"
                        >
                          <i className="fa-solid fa-ban me-1"></i> Cashier Rejects (06)
                        </button>
                      </div>
                      <div className="text-secondary small" style={{ fontSize: "0.74rem" }}>
                        Flow: 04 Confirm → 05 Pending (Credits 0.00) → Cashier Pays or Rejects (06 Credits Restored).
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* System Security / Unbind Test Row */}
              <div className="col-12 pt-2 border-top border-warning border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="text-secondary small" style={{ fontSize: "0.76rem" }}>
                  <i className="fa-solid fa-fingerprint me-1 text-warning"></i>
                  <strong>Hardware Fingerprint & Unbind Flow:</strong> Test what happens when PC is unbound or unauthorized
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-danger py-1 px-3"
                    style={{ fontSize: "0.74rem" }}
                    onClick={() => onTriggerAlert("STATION_UNBOUND", balance)}
                  >
                    <i className="fa-solid fa-cash-register me-1"></i> Simulate Admin Unbind (Contact Cashier Popup)
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary py-1 px-3"
                    style={{ fontSize: "0.74rem" }}
                    onClick={() => navigate("/not-authorized")}
                  >
                    <i className="fa-solid fa-lock me-1"></i> Screen 28: Hardware Lock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
