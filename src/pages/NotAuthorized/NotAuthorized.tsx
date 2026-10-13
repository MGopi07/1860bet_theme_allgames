import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { shop } from "../../constants/machine";

import { api } from "../../services/api";

export const NotAuthorized: React.FC = () => {
  const navigate = useNavigate();

  const machineName = localStorage.getItem("winbet_machine_name") || "Terminal-02";
  const machineType = localStorage.getItem("winbet_machine_type") || "terminal";

  const handleClearAndRegister = () => {
    // Clear local storage machine binding
    localStorage.removeItem("winbet_machine_id");
    localStorage.removeItem("winbet_numeric_id");
    localStorage.removeItem("winbet_machine_name");
    localStorage.removeItem("winbet_machine_type");
    localStorage.removeItem("winbet_setup_code");
    localStorage.removeItem("winbet_registration_token");
    localStorage.removeItem("winbet_shop_name");
    localStorage.removeItem("winbet_shop_location");
    api.generateNewDeviceFingerprint();

    // Navigate to registration screen
    navigate("/register");
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "radial-gradient(circle at 50% 20%, #1c0628 0%, #080214 100%)" }}>
      <div className="container-fluid px-lg-5 py-3 d-flex flex-column flex-grow-1">
        {/* Top Header */}
        <div
          className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-bottom pb-3"
          style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <Link to="/register" className="brand-logo-wrap text-decoration-none mb-0">
              <span className="brand-name fs-5">
                <span style={{ color: "#f5b300" }}>WIN</span>
                <span style={{ color: "#ffffff" }}>BET</span>
              </span>
            </Link>
            <span
              className="badge ms-2 bg-danger text-white border border-danger-subtle"
              style={{ fontSize: "0.75rem" }}
            >
              SECURITY ALERT
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-dark text-secondary border border-secondary" style={{ fontSize: "0.76rem" }}>
              Shop System · Hardware Bind
            </span>
          </div>
        </div>

        {/* Center Card for Screen 28 */}
        <div className="my-auto w-100 py-3">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-5 col-xl-4">
              <div
                className="winbet-card"
                style={{
                  borderColor: "rgba(239, 68, 68, 0.5)",
                  boxShadow: "0 12px 45px rgba(0, 0, 0, 0.85), 0 0 35px rgba(239, 68, 68, 0.35)",
                }}
              >
                <div>
                  {/* Step Pill */}
                  <div className="step-pill-box justify-content-center mb-3">
                    <span className="pill-text fw-bold text-danger">Hardware Authorization</span>
                  </div>

                  {/* Red Neon Alert Icon */}
                  <div className="neon-alert-circle-wrap mb-4 text-center">
                    <div
                      style={{
                        width: "84px",
                        height: "84px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 35% 30%, #ff5252 0%, #b91c1c 65%, #7f1d1d 100%)",
                        border: "2.5px solid #fca5a5",
                        boxShadow: "0 0 35px rgba(239, 68, 68, 0.8), inset 0 2px 6px rgba(255, 255, 255, 0.8)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: "2.4rem",
                        animation: "pulse3DGlow 2.5s infinite alternate ease-in-out"
                      }}
                    >
                      <i className="fa-solid fa-lock"></i>
                    </div>
                  </div>

                  <h2 className="card-heading text-danger text-center mb-2" style={{ textShadow: "0 0 15px rgba(239, 68, 68, 0.6)" }}>
                    PC Not Authorized
                  </h2>

                  <p className="text-light small text-center mb-4" style={{ lineHeight: "1.5", fontSize: "0.85rem" }}>
                    This PC no longer matches the server bind. The machine slot was unbound in Back Office, or this application is running on a different computer.
                  </p>

                  {/* Machine Details List */}
                  <div className="p-3 mb-4 rounded border text-start small"
                    style={{
                      background: "radial-gradient(circle at 50% 0%, #3f1010 0%, #1a0505 100%)",
                      borderColor: "rgba(239, 68, 68, 0.5)",
                      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(239, 68, 68, 0.15)",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div className="d-flex justify-content-between text-secondary mb-2">
                      <span>Machine ID:</span>
                      <span className="text-danger fw-bold">{machineName}</span>
                    </div>
                    <div className="d-flex justify-content-between text-secondary mb-2">
                      <span>Device Type:</span>
                      <span className="text-light fw-bold text-capitalize">{machineType}</span>
                    </div>
                    <div className="d-flex justify-content-between text-secondary mb-2">
                      <span>Shop Name:</span>
                      <span className="text-light fw-bold">{shop.name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center text-secondary">
                      <span>Hardware Bind:</span>
                      <span className="badge bg-danger text-white border border-danger shadow-sm">
                        UNBOUND / MISMATCH
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Big Primary Action: Clear local data & register again */}
                  <button
                    type="button"
                    className="btn-danger-action w-100 py-3"
                    onClick={handleClearAndRegister}
                    style={{ fontSize: "0.95rem" }}
                  >
                    <i className="fa-solid fa-trash-arrow-up me-2"></i>
                    <span>CLEAR LOCAL DATA & REGISTER AGAIN</span>
                  </button>

                  <div className="card-footer-brand mt-3">
                    <div className="brand-badge">
                      <i className="fa-solid fa-scale-balanced"></i>
                    </div>
                    <div className="brand-text-block">
                      <span className="brand-title">Betwise Security</span>
                      <span className="brand-sub">Hardware Binding · Tauri PC Protection</span>
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
