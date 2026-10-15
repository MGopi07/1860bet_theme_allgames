import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MachineType, SmartPCRegisterData } from "../../types";
import { api } from "../../services/api";
import { ThemeNotificationModal } from "../../components/common/ThemeNotificationModal";

interface RegistrationProps {
  defaultMachineType?: MachineType;
}

export const Registration: React.FC<RegistrationProps> = ({
  defaultMachineType = "smart-pc",
}) => {
  const navigate = useNavigate();
  const [portal, setPortal] = useState(() => localStorage.getItem("winbet_portal") || api.getPortalSlug() || "betwise");
  const [registrationToken, setRegistrationToken] = useState("");
  const [machineType] = useState<MachineType>(defaultMachineType);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [registeredData, setRegisteredData] = useState<SmartPCRegisterData | null>(null);

  const [currentFp, setCurrentFp] = useState(() => api.getDeviceFingerprint());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const doRegister = async (overrideFp?: string) => {
    const inputToken = registrationToken.trim();
    const inputPortal = portal.trim();
    if (!inputPortal && !inputToken) {
      setErrorMessage("Please enter Portal and Setup Code.");
      showToast("Please enter valid details!");
      return;
    }
    if (!inputPortal) {
      setErrorMessage("Please enter Portal.");
      showToast("Please enter Portal!");
      return;
    }
    if (!inputToken) {
      setErrorMessage("Please enter Setup Code.");
      showToast("Please enter Setup Code!");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const fpToUse = overrideFp || currentFp || api.getDeviceFingerprint();

    try {
      // PDF Flow #1: POST /smart-pcs/register (Live API call)
      const data = await api.registerSmartPC({
        portal_slug: inputPortal.toLowerCase(),
        registration_token: inputToken.toUpperCase(),
        device_fingerprint: fpToUse,
        operating_system: navigator.userAgent.includes("Windows") ? "Windows 11" : "Linux",
      });

      localStorage.setItem("winbet_registration_token", inputToken.toUpperCase());
      localStorage.setItem("winbet_setup_code", inputToken.toUpperCase());
      localStorage.setItem("winbet_machine_type", machineType);

      setRegisteredData(data);
      setWizardStep(2);
      showToast(`Assigned Machine: ${data.pc_name || data.machine_id} in ${data.shop_name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setErrorMessage(msg);
      showToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doRegister();
  };

  const handleResetFingerprintAndRetry = async () => {
    const newFp = api.generateNewDeviceFingerprint();
    setCurrentFp(newFp);
    showToast("Generated new device fingerprint. Registering now...");
    await doRegister(newFp);
  };


  const handleContinueToPlatform = () => {
    const path = machineType === "terminal" ? "/terminal" : "/smart-pc";
    navigate(path);
  };

  const hasExistingMachine = Boolean(localStorage.getItem("winbet_machine_id"));

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: "radial-gradient(circle at 50% 15%, #1c130b 0%, #090705 100%)" }}>
      <div className="container-fluid px-lg-5 py-3 d-flex flex-column flex-grow-1">
        {/* Center Content Wrapper */}
        <div className="my-auto w-100 py-2">
          <div id="wizardContainer" className="row justify-content-center py-2">
            <div className="col-12 col-md-8 col-lg-5 col-xl-4">
              <div
                className="winbet-card active-step-card"
                style={{
                  animation: "modalPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  minHeight: "auto",
                }}
              >
                <div>
                  {/* 1860BET Brand Logo Header */}
                  <div className="text-center mb-3">
                    <img
                      src="/assets/images/logo.png"
                      alt="1860BET"
                      style={{ maxHeight: "48px", maxWidth: "200px", objectFit: "contain", filter: "drop-shadow(0 2px 12px rgba(245, 131, 31, 0.45))" }}
                    />
                  </div>

                  {wizardStep === 1 ? (
                    /* SCREEN 1: REGISTRATION SETUP */
                    <form id="flowScreen1" onSubmit={handleSubmit} className="text-start">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h2 className="card-heading mb-0 text-start">Register Machine</h2>
                        {hasExistingMachine && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info py-0 px-2"
                            style={{ fontSize: "0.75rem", borderRadius: "6px" }}
                            onClick={() => navigate(machineType === "terminal" ? "/terminal" : "/smart-pc")}
                            title="Machine is already registered. Enter lobby directly."
                          >
                            <i className="fa-solid fa-arrow-right-to-bracket me-1"></i> Lobby
                          </button>
                        )}
                      </div>
                      <p className="text-secondary small mb-3" style={{ fontSize: "0.82rem" }}>
                        Enter the portal and shop setup code to claim your machine.
                      </p>

                      {/* PORTAL Input */}
                      <div className="mb-3">
                        <label className="field-label mb-1" htmlFor="portalInput">
                          PORTAL
                        </label>
                        <input
                          type="text"
                          id="portalInput"
                          className="winbet-input text-light fw-bold"
                          value={portal}
                          onChange={(e) => {
                            setPortal(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="betwise"
                        />
                      </div>

                      {/* SETUP CODE Input */}
                      <div className="mb-3">
                        <label className="field-label mb-1" htmlFor="tokenInput">
                          SETUP CODE
                        </label>
                        <input
                          type="text"
                          id="tokenInput"
                          className="winbet-input font-monospace fw-bold text-light"
                          value={registrationToken}
                          onChange={(e) => {
                            setRegistrationToken(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="Enter Setup Code"
                          autoFocus
                        />
                      </div>

                      {/* Error Alert Box */}
                      {errorMessage && (
                        <div
                          className="p-3 mb-3 text-light rounded-4 position-relative"
                          style={{
                            background: "linear-gradient(135deg, rgba(38, 14, 12, 0.92) 0%, rgba(22, 9, 8, 0.96) 100%)",
                            border: "1.5px solid rgba(239, 68, 68, 0.55)",
                            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(239, 68, 68, 0.18)",
                            fontSize: "0.84rem",
                          }}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 mt-1"
                              style={{
                                width: "34px",
                                height: "34px",
                                background: "rgba(239, 68, 68, 0.18)",
                                border: "1px solid rgba(239, 68, 68, 0.45)",
                                color: "#f87171",
                                fontSize: "1.05rem",
                              }}
                            >
                              <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <div className="w-100">
                              <div className="fw-bold mb-1" style={{ color: "#fca5a5", fontSize: "0.88rem" }}>
                                Registration Error:
                              </div>
                              <div className="mb-2" style={{ color: "#FDF3E3", lineHeight: 1.45 }}>
                                {errorMessage}
                              </div>

                              {/* Helpful action buttons when PC is already registered */}
                              {errorMessage.toLowerCase().includes("already registered") && (
                                <div className="mt-2 pt-2 border-top d-flex flex-column gap-2" style={{ borderColor: "rgba(239, 68, 68, 0.25)" }}>
                                  <button
                                    type="button"
                                    className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                                    style={{
                                      borderRadius: "10px",
                                      background: "linear-gradient(180deg, #FF9431 0%, #D96A06 100%)",
                                      border: "1px solid #FFAE66",
                                      color: "#ffffff",
                                      fontWeight: 700,
                                      fontSize: "0.85rem",
                                      boxShadow: "0 2px 0 #662E00, 0 4px 10px rgba(0, 0, 0, 0.4)",
                                      transition: "all 0.18s ease",
                                    }}
                                    onClick={handleResetFingerprintAndRetry}
                                    disabled={isLoading}
                                  >
                                    <i className="fa-solid fa-arrows-rotate"></i>
                                    <span>Reset Device ID & Register Now</span>
                                  </button>

                                  {hasExistingMachine && (
                                    <button
                                      type="button"
                                      className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                                      style={{
                                        borderRadius: "10px",
                                        background: "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid rgba(255, 255, 255, 0.2)",
                                        color: "#FDF3E3",
                                        fontWeight: 600,
                                        fontSize: "0.82rem",
                                      }}
                                      onClick={() => navigate(machineType === "terminal" ? "/terminal" : "/smart-pc")}
                                    >
                                      <i className="fa-solid fa-desktop"></i>
                                      <span>Continue to Smart PC Lobby</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="mt-4" id="btnGroupScreen1">
                        <button
                          type="submit"
                          className="btn-winbet w-100"
                          style={{ padding: "0.6rem 1.2rem" }}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <i className="fa-solid fa-circle-notch fa-spin me-2"></i> Registering...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-link me-1"></i> Register Machine
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* SCREEN 2: REGISTRATION SUCCESSFUL (100% LIVE API VALUES) */
                    <div id="flowScreen2">
                      {/* Glowing Checkmark Circle */}
                      <div className="success-circle-container mt-2">
                        <div className="neon-success-circle">
                          <i className="fa-solid fa-check"></i>
                        </div>
                      </div>

                      <h2 className="success-banner-text">Machine Registered!</h2>
                      <p className="text-secondary small mb-3 text-center" style={{ fontSize: "0.82rem" }}>
                        Assigned live from Betting Shop server
                      </p>

                      {/* Live Registration Summary */}
                      <div className="receipt-list mb-3">
                        <div className="receipt-row">
                          <span className="receipt-label">Machine Name:</span>
                          <span className="receipt-value text-warning fw-bold" id="successPcName">
                            {registeredData?.pc_name || registeredData?.terminal_name || registeredData?.machine_id}
                          </span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">Machine Code:</span>
                          <span className="receipt-value text-light font-monospace" id="successMachineCode">
                            {registeredData?.machine_id}
                          </span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">Shop Name:</span>
                          <span className="receipt-value text-warning-subtle fw-semibold">{registeredData?.shop_name}</span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">Portal:</span>
                          <span className="receipt-value text-light fw-bold">{portal}</span>
                        </div>
                        <div className="receipt-row">
                          <span className="receipt-label">Setup Code:</span>
                          <span className="receipt-value text-light font-monospace" id="successSetupCode">
                            {registrationToken.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Button on Screen 2 */}
                      <div id="btnGroupScreen2">
                        <button
                          type="button"
                          className="btn-winbet"
                          onClick={handleContinueToPlatform}
                        >
                          <span>Continue to Platform</span>
                          <i className="fa-solid fa-arrow-right ms-2"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WinBet Theme Modal Popup */}
        <ThemeNotificationModal
          isOpen={Boolean(toastMessage)}
          message={toastMessage || null}
          onClose={() => setToastMessage(null)}
        />
      </div>
    </div>
  );
};
