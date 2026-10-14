import React, { useState } from "react";
import type { MachineType } from "../../types";
import { GamingHeader } from "./GamingHeader";
import { ShopLocation } from "./ShopLocation";
import { SmartPCHeroBanner } from "../gaming/SmartPCHeroBanner";
import { ThemeNotificationModal } from "../common/ThemeNotificationModal";
import { useKioskKeyboardLock } from "../../hooks/useKioskKeyboardLock";

interface GamingLayoutProps {
  machineType: MachineType;
  machineName: string;
  shopName: string;
  shopLocation?: string;
  balance: number;
  actionText: string;
  onPrimaryAction: () => void;
  onToggleMachineType?: (type: MachineType) => void;
  toastMessage?: string | null;
  onDismissToast?: () => void;
  showJackpotBanner?: boolean;
  showFooterTrustBar?: boolean;
  children: React.ReactNode;
}

export const GamingLayout: React.FC<GamingLayoutProps> = ({
  machineType,
  machineName,
  shopName,
  shopLocation: _shopLocation,
  balance,
  actionText,
  onPrimaryAction,
  onToggleMachineType,
  toastMessage,
  onDismissToast,
  showJackpotBanner,
  showFooterTrustBar,
  children,
}) => {
  const isSmartPc = machineType === "smart-pc";
  const shouldShowJackpot = showJackpotBanner !== undefined ? showJackpotBanner : isSmartPc;
  const shouldShowFooterTrust = showFooterTrustBar !== undefined ? showFooterTrustBar : isSmartPc;
  const [internalToast, setInternalToast] = useState<string | null>(null);

  // Kiosk Keyboard Lock: When balance is 0, keyboard is disabled until unlocked by Ctrl + Shift + D or balance > 0
  const { isOverrideUnlocked } = useKioskKeyboardLock();

  return (
    <div className="game-lobby-body d-flex flex-column min-vh-100">
      {/* Header */}
      <GamingHeader
        machineType={machineType}
        machineName={machineName}
        shopName={shopName}
        balance={balance}
        actionText={actionText}
        onPrimaryAction={onPrimaryAction}
        onToggleMachineType={onToggleMachineType}
      />

      {/* Main Content Area */}
      <main className="container-fluid px-lg-4 py-3 flex-grow-1">
        {/* Dynamic & Engaging Smart PC Hero Showcase Banner (Shown on Smart PC or when enabled) */}
        {shouldShowJackpot && (
          <SmartPCHeroBanner onOpenCashout={onPrimaryAction} />
        )}

        {/* Dynamic Children (GameGrid, etc.) */}
        {children}
      </main>

      {/* Sticky Bottom Dock */}
      <footer className="smart-pc-dock">
        <div className="container-fluid d-flex flex-wrap justify-content-between align-items-center gap-3">
          {/* Bottom Left: Shop Location */}
          <ShopLocation shopName={shopName} />

          {/* Middle: Quick Bet Presets */}
          {/* <div className="d-none d-lg-flex align-items-center gap-2">
            <span className="text-secondary small fw-semibold">DEFAULT BET:</span>
            {[10, 25, 50, 100].map((val) => (
              <button
                key={val}
                type="button"
                className={`btn btn-sm py-1 px-3 rounded-pill ${
                  defaultBet === val
                    ? "btn-warning text-dark fw-bold"
                    : "btn-outline-secondary text-light"
                }`}
                style={{ borderColor: "#59259c" }}
                onClick={() => setDefaultBet(val)}
              >
                N$ {val}
              </button>
            ))}
          </div> */}

          {/* Right: Dock Action Button & Admin Unlock Indicator */}
          <div className="d-flex align-items-center gap-2">
            {isOverrideUnlocked && (
              <span className="badge bg-warning text-dark border border-warning px-3 py-2 fw-bold d-inline-flex align-items-center gap-1 shadow-sm">
                <i className="fa-solid fa-lock-open"></i> KEYBOARD UNLOCKED (CTRL+SHIFT+D)
              </span>
            )}
            <button
              type="button"
              className="btn-gold-action py-2 px-4"
              onClick={onPrimaryAction}
              style={{ fontSize: "0.95rem" }}
            >
              <i className="fa-solid fa-circle-check me-1"></i>
              <span id="dockActionText">{actionText}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Full Footer Trust Bar */}
      {shouldShowFooterTrust && (
        <div className="winbet-full-footer">
          <div className="container-fluid">
            <div className="row g-4 justify-content-between">
              <div className="col-12 col-md-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="brand-name fs-5">
                    <span style={{ color: "#f5b300" }}>BET</span>
                    <span style={{ color: "#ffffff" }}>WISE</span>
                  </span>
                  <span className="badge bg-dark border border-warning-subtle text-warning" style={{ fontSize: "0.7rem" }}>
                    OFFICIAL MACHINE
                  </span>
                </div>
                <p className="text-dim small mb-3">
                  Authorized Gaming Smart PC System. Powered by Betwise Gaming Central.
                </p>
                <div className="security-badge-row">
                  <span className="ssl-badge">
                    <i className="fa-solid fa-lock me-1"></i> 256-BIT ENCRYPTION
                  </span>
                  <span className="age-badge">18+</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <h4 className="footer-col-title">Quick Information</h4>
                <ul className="footer-links-list">
                  <li><span className="text-dim">Shop: {shopName}</span></li>
                  <li><span className="text-dim">Machine: {machineName}</span></li>
                </ul>
              </div>

              <div className="col-6 col-md-3">
                <h4 className="footer-col-title">Player Assistance</h4>
                <ul className="footer-links-list">
                  <li><span className="text-dim">Ask shop cashier for assistance</span></li>
                  <li><span className="text-dim">Play responsibly (18+ only)</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WinBet Theme Modal Popup (Replaces plain toast) */}
      <ThemeNotificationModal
        isOpen={Boolean(internalToast || toastMessage)}
        message={internalToast || toastMessage || null}
        onClose={() => {
          setInternalToast(null);
          onDismissToast?.();
        }}
      />
    </div>
  );
};
