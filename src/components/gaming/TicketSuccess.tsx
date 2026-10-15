import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { shop } from "../../constants/machine";

interface TicketSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  amount: number;
  onBackToGames: () => void;
}

export const TicketSuccess: React.FC<TicketSuccessProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  amount,
  onBackToGames,
}) => {
  const currentDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="400px">
      <div className="modal-body p-3 p-sm-4 text-center">
        {/* Step Header Pill */}
        <div className="step-pill-box justify-content-center mb-2">
          <span className="badge-circle">5</span>
          <span className="pill-text fw-bold">Ticket Printed!</span>
        </div>

        {/* Glowing Emerald Green Checkmark Circle */}
        <div className="neon-success-circle-wrap mb-2">
          <div className="neon-success-circle">
            <i className="fa-solid fa-check"></i>
          </div>
        </div>

        <h3 className="success-text-heading mb-3">Ticket Printed!</h3>

        {/* =========================================================================
            THEME-FRIENDLY CASHOUT TICKET VOUCHER CARD
            ========================================================================= */}
        <div
          className="printed-ticket-voucher p-3 rounded mb-3 text-start position-relative overflow-hidden"
          style={{
            background: "radial-gradient(circle at 50% 0%, #26160B 0%, #0F0A06 100%)",
            border: "1.5px solid rgba(245, 179, 0, 0.4)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(245, 179, 0, 0.1)",
          }}
        >
          {/* Header of Voucher */}
          <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-1">
              <span className="fw-bold" style={{ color: "#f5b300", letterSpacing: "1px" }}>
                WIN
              </span>
              <span className="fw-bold text-white" style={{ letterSpacing: "1px" }}>
                BET
              </span>
              <span className="badge ms-1 border" style={{ fontSize: "0.62rem", background: "rgba(245, 131, 31, 0.15)", borderColor: "rgba(245, 131, 31, 0.5)", color: "#FF9431" }}>
                CASHOUT VOUCHER
              </span>
            </div>
            <span className="text-secondary small" style={{ fontSize: "0.7rem" }}>
              {shop.name}
            </span>
          </div>

          {/* Amount Display */}
          <div className="text-center py-2 mb-2 rounded" style={{ background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(245, 179, 0, 0.2)" }}>
            <div className="text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
              Payout Amount
            </div>
            <div className="fs-2 fw-bold text-warning" id="dispTicketAmount" style={{ textShadow: "0 0 12px rgba(245, 179, 0, 0.4)" }}>
              {formatCurrency(amount)}
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="d-flex justify-content-between text-secondary small mb-1" style={{ fontSize: "0.75rem" }}>
            <span>Ticket Number:</span>
            <span className="text-light fw-bold font-monospace" id="dispTicketNum">
              {ticketNumber}
            </span>
          </div>
          <div className="d-flex justify-content-between text-secondary small mb-1" style={{ fontSize: "0.75rem" }}>
            <span>Terminal:</span>
            <span className="text-light">Terminal-02</span>
          </div>
          <div className="d-flex justify-content-between text-secondary small mb-2" style={{ fontSize: "0.75rem" }}>
            <span>Issued At:</span>
            <span className="text-light">{currentDate}</span>
          </div>

          {/* Realistic Theme-Friendly Barcode Element */}
          <div
            className="barcode-wrap my-2 p-2 rounded text-center"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* SVG Vector Barcode lines for ultra crisp realistic look */}
            <svg
              className="w-100"
              height="46"
              viewBox="0 0 240 46"
              preserveAspectRatio="none"
              style={{ display: "block" }}
            >
              <rect x="10" y="2" width="3" height="42" fill="#000000" />
              <rect x="16" y="2" width="2" height="42" fill="#000000" />
              <rect x="22" y="2" width="4" height="42" fill="#000000" />
              <rect x="30" y="2" width="2" height="42" fill="#000000" />
              <rect x="36" y="2" width="5" height="42" fill="#000000" />
              <rect x="45" y="2" width="2" height="42" fill="#000000" />
              <rect x="50" y="2" width="4" height="42" fill="#000000" />
              <rect x="58" y="2" width="1" height="42" fill="#000000" />
              <rect x="63" y="2" width="3" height="42" fill="#000000" />
              <rect x="70" y="2" width="6" height="42" fill="#000000" />
              <rect x="80" y="2" width="2" height="42" fill="#000000" />
              <rect x="86" y="2" width="3" height="42" fill="#000000" />
              <rect x="92" y="2" width="5" height="42" fill="#000000" />
              <rect x="100" y="2" width="2" height="42" fill="#000000" />
              <rect x="106" y="2" width="4" height="42" fill="#000000" />
              <rect x="114" y="2" width="1" height="42" fill="#000000" />
              <rect x="118" y="2" width="3" height="42" fill="#000000" />
              <rect x="125" y="2" width="6" height="42" fill="#000000" />
              <rect x="135" y="2" width="2" height="42" fill="#000000" />
              <rect x="140" y="2" width="5" height="42" fill="#000000" />
              <rect x="148" y="2" width="2" height="42" fill="#000000" />
              <rect x="154" y="2" width="3" height="42" fill="#000000" />
              <rect x="160" y="2" width="6" height="42" fill="#000000" />
              <rect x="170" y="2" width="2" height="42" fill="#000000" />
              <rect x="176" y="2" width="4" height="42" fill="#000000" />
              <rect x="184" y="2" width="2" height="42" fill="#000000" />
              <rect x="190" y="2" width="5" height="42" fill="#000000" />
              <rect x="198" y="2" width="1" height="42" fill="#000000" />
              <rect x="204" y="2" width="4" height="42" fill="#000000" />
              <rect x="212" y="2" width="2" height="42" fill="#000000" />
              <rect x="218" y="2" width="4" height="42" fill="#000000" />
              <rect x="226" y="2" width="2" height="42" fill="#000000" />
            </svg>
            <div className="font-monospace fw-bold text-dark mt-1" style={{ fontSize: "0.78rem", letterSpacing: "3px" }}>
              *{ticketNumber}*
            </div>
          </div>
        </div>

        {/* Cashier Instruction Notice */}
        <p className="cashier-notice-text text-light small mb-3" style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
          <i className="fa-solid fa-circle-info text-warning me-1"></i>
          <strong>Take this ticket to the cashier</strong> to redeem cash, or scan it on any Terminal in this shop.
        </p>

        {/* Next step notice: What happens after printing */}
        <div
          className="p-2 mb-3 rounded border text-start small"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            borderColor: "rgba(16, 185, 129, 0.3)",
            fontSize: "0.76rem",
          }}
        >
          <div className="d-flex justify-content-between text-secondary">
            <span>Terminal Credits:</span>
            <span className="text-warning fw-bold">Reset to N$ 0.00</span>
          </div>
          <div className="d-flex justify-content-between text-secondary">
            <span>Next Action:</span>
            <span className="text-light">Ready for new player / cash insert</span>
          </div>
        </div>

        {/* Action Button: Back to Games */}
        <div className="d-flex flex-column gap-2">
          <Button variant="primary" onClick={onBackToGames} icon="fa-solid fa-arrow-rotate-left">
            Back to Games
          </Button>
        </div>

        <div className="card-footer-brand mt-3 pt-2">
          <div className="brand-badge">
            <i className="fa-solid fa-scale-balanced"></i>
          </div>
          <div className="brand-text-block text-start">
            <span className="brand-title">1860BET Central</span>
            <span className="brand-sub">Independent. Fair. Reliable. Windhoek Central.</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
