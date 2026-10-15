import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatCurrency } from "../../utils/formatCurrency";

interface CashOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
}

export const CashOutModal: React.FC<CashOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="390px">
      <div className="modal-body p-4 text-center">
        {/* Step Pill */}
        <div className="step-pill-box justify-content-center mb-3">
          <span className="pill-text fw-bold">Cash Out Confirmation</span>
        </div>

        {/* Inner Indented Cash Out Panel */}
        <div
          className="inner-cashout-panel p-3 rounded mb-3"
          style={{
            background: "radial-gradient(circle at 50% 0%, #26160B 0%, #0F0A06 100%)",
            border: "1.5px solid rgba(245, 179, 0, 0.4)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(245, 179, 0, 0.1)",
          }}
        >
          <div className="cashout-icon-glow mb-2">
            <i className="fa-solid fa-coins text-warning fs-3"></i>
          </div>
          <h3 className="panel-heading text-warning mb-1" style={{ textShadow: "0 0 12px rgba(245, 179, 0, 0.4)" }}>
            Cash Out
          </h3>
          <p className="panel-label text-secondary small text-uppercase mb-1" style={{ fontSize: "0.72rem" }}>
            Available Shop Balance
          </p>
          <div className="panel-amount fs-2 fw-bold text-light">
            <span className="currency-symbol text-warning me-1">N$</span>
            <span id="smartpcModalAmount">{amount.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-light small mb-3">
          Are you sure you want to cash out <strong className="text-warning">{formatCurrency(amount)}</strong>?
        </p>

        {/* Action Buttons: Confirm & Cancel */}
        <div className="d-flex flex-column gap-2 mt-2">
          <Button variant="success" onClick={onConfirm} icon="fa-solid fa-circle-check">
            Confirm Cash Out
          </Button>
          <Button variant="danger" onClick={onClose} icon="fa-solid fa-circle-xmark">
            Cancel
          </Button>
        </div>

        <p className="text-dim small mt-3 mb-0" style={{ fontSize: "0.76rem" }}>
          <i className="fa-solid fa-info-circle me-1 text-warning"></i>
          Cashier will approve and redeem your balance at the counter.
        </p>
      </div>
    </Modal>
  );
};
