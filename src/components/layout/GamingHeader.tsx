import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { MachineType } from "../../types";
import { BalanceDisplay } from "../gaming/BalanceDisplay";

interface GamingHeaderProps {
  machineType: MachineType;
  machineName: string;
  shopName: string;
  balance: number;
  actionText: string;
  onPrimaryAction: () => void;
  onToggleMachineType?: (type: MachineType) => void;
}

export const GamingHeader: React.FC<GamingHeaderProps> = ({
  machineType,
  machineName,
  shopName,
  balance,
  actionText,
  onPrimaryAction,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };



  return (
    <header className="smart-pc-header">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        {/* Left: Winbet Brand Logo + Machine Station Badge */}
        <div className="d-flex align-items-center gap-3">
          <Link
            to={machineType === "terminal" ? "/terminal" : "/smart-pc"}
            className="d-flex align-items-center gap-2 text-decoration-none me-1"
            title="1860BET Station"
          >
            <img
              src="/assets/images/logo.png"
              alt="1860BET"
              className="brand-logo-img logo-sm"
              style={{ maxHeight: "32px", objectFit: "contain" }}
            />
          </Link>

          {/* Dedicated Station Badge & Type */}
          <div className="station-badge d-flex align-items-center gap-2">
            <span className="online-dot" title="Station Online"></span>
            {machineType === "smart-pc" ? (
              <span
                className="badge border text-light px-2 py-1 d-inline-flex align-items-center gap-1"
                style={{
                  fontSize: "0.74rem",
                  background: "rgba(245, 131, 31, 0.22)",
                  borderColor: "rgba(245, 131, 31, 0.5)",
                }}
              >
                <i className="fa-solid fa-desktop" style={{ color: "#FF9431" }}></i> SMART PC
              </span>
            ) : (
              <span
                className="badge border px-2 py-1 d-inline-flex align-items-center gap-1"
                style={{ fontSize: "0.74rem", background: "rgba(245, 131, 31, 0.15)", borderColor: "rgba(245, 131, 31, 0.4)", color: "#FF9431" }}
              >
                <i className="fa-solid fa-receipt"></i> TERMINAL
              </span>
            )}
            <span id="stationCodeDisplay" className="fw-bold text-light">
              {machineName}
            </span>
            <span className="text-secondary">|</span>
            <span id="stationShopDisplay" style={{ fontSize: "0.76rem", color: "#FDF3E3" }}>
              {shopName}
            </span>
          </div>
        </div>

        {/* Right: Balance, Primary Action & Tools */}
        <div className="d-flex align-items-center gap-2 gap-sm-3">
          {/* Balance Display Chip */}
          <BalanceDisplay balance={balance} onClick={onPrimaryAction} />

          {/* Primary Action Button */}
          <button
            type="button"
            className="btn-gold-action"
            id="btnPrimaryCashout"
            onClick={onPrimaryAction}
          >
            <i
              className={
                machineType === "terminal"
                  ? "fa-solid fa-print"
                  : "fa-solid fa-money-bill-transfer"
              }
              id="primaryActionIcon"
            ></i>
            <span id="primaryActionText">{actionText}</span>
          </button>

          {/* Sound Effects Toggle */}
          <button
            type="button"
            className="btn-icon-control"
            id="btnAudioToggle"
            onClick={toggleSound}
            title="Sound Effects"
          >
            <i className={`fa-solid ${soundEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}></i>
          </button>

        </div>
      </div>
    </header>
  );
};
