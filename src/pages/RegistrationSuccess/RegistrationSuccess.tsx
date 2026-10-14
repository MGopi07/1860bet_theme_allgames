import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { shop, VALID_SETUP_CODE } from "../../constants/machine";
import type { MachineType } from "../../types";

export const RegistrationSuccess: React.FC = () => {
  const navigate = useNavigate();

  const machineType = (localStorage.getItem("winbet_machine_type") as MachineType) || "smart-pc";
  const machineName =
    localStorage.getItem("winbet_machine_name") ||
    localStorage.getItem("winbet_machine_id") ||
    "";
  const shopName = localStorage.getItem("winbet_shop_name") || "";
  const setupCode =
    localStorage.getItem("winbet_setup_code") ||
    localStorage.getItem("winbet_registration_token") ||
    VALID_SETUP_CODE;

  const handleContinue = () => {
    if (machineType === "terminal") {
      navigate("/terminal");
    } else {
      navigate("/smart-pc");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="container-fluid px-lg-5 py-3 d-flex flex-column flex-grow-1">
        {/* Top Controls Bar */}
        <div
          className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-bottom pb-3"
          style={{ borderColor: "rgba(94, 23, 187, 0.4)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <Link to="/register" className="brand-logo-wrap text-decoration-none mb-0">
              <img
                src="/assets/images/logo.png"
                alt="BETWISE"
                className="brand-logo-img logo-sm"
                style={{ height: "38px" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="brand-name fs-5">
                <span style={{ color: "#f5b300" }}>BET</span>
                <span style={{ color: "#ffffff" }}>WISE</span>
              </span>
            </Link>
            <span
              className="badge ms-2 bg-dark text-warning border border-warning-subtle"
              style={{ fontSize: "0.75rem" }}
            >
              REGISTRATION PORTAL
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 mt-2 mt-sm-0">
            <button
              type="button"
              className="btn btn-outline-warning btn-sm rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
              style={{ borderColor: "#f5b300", color: "#ffdc69" }}
              onClick={handleContinue}
            >
              <i className="fa-solid fa-gamepad"></i> Game Lobby
            </button>
          </div>
        </div>

        {/* Center Card */}
        <div className="my-auto w-100 py-2">
          <div className="row justify-content-center py-2">
            <div className="col-12 col-md-8 col-lg-5 col-xl-4">
              <div className="winbet-card active-step-card">
                <div>
                  {/* Brand Logo */}
                  <div className="winbet-logo mb-3">
                    <img
                      src="/assets/images/logo.png"
                      alt="BETWISE"
                      className="brand-logo-img logo-sm"
                      style={{ maxHeight: "48px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  {/* Glowing Checkmark Circle */}
                  <div className="success-circle-container mt-2">
                    <div className="neon-success-circle">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  </div>

                  <h2 className="success-banner-text">Registration Successful!</h2>

                  {/* Registration Summary List */}
                  <div className="receipt-list mb-3">
                    <div className="receipt-row">
                      <span className="receipt-label">Machine Name:</span>
                      <span className="receipt-value text-warning" id="successMachineName">
                        {machineName}
                      </span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Machine Type:</span>
                      <span className="receipt-value" id="successMachineType">
                        {machineType === "terminal" ? "Terminal" : "Smart PC"}
                      </span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Shop Name:</span>
                      <span className="receipt-value">{shopName}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Location:</span>
                      <span className="receipt-value text-secondary">{shop.location}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">Setup Code:</span>
                      <span className="receipt-value text-light" id="successSetupCode">
                        {setupCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Continue Action */}
                <div>
                  <button type="button" className="btn-winbet" onClick={handleContinue}>
                    <span>CONTINUE TO GAMING PLATFORM</span>
                    <i className="fa-solid fa-arrow-right ms-2"></i>
                  </button>

                  <div className="card-footer-brand mt-3">
                    <div className="brand-badge">
                      <i className="fa-solid fa-scale-balanced"></i>
                    </div>
                    <div className="brand-text-block">
                      <span className="brand-title">Betwise Central</span>
                      <span className="brand-sub">Independent. Fair. Reliable. Windhoek Central.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
