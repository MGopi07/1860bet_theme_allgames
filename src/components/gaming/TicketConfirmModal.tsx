import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatCurrency } from "../../utils/formatCurrency";

interface TicketConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPrint: () => void;
  amount: number;
}

export const TicketConfirmModal: React.FC<TicketConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmPrint,
  amount,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="390px">
      <div className="modal-body p-4 text-center">
        {/* Step Header Pill */}
        <div className="step-pill-box justify-content-center mb-3">
          <span className="badge-circle">4</span>
          <span className="pill-text fw-bold">Print Cashout Ticket</span>
        </div>

        {/* Indented Amount Box */}
        <div
          className="inner-cashout-panel p-3 rounded mb-3"
          style={{
            background: "radial-gradient(circle at 50% 0%, #26160B 0%, #0F0A06 100%)",
            border: "1.5px solid rgba(245, 179, 0, 0.4)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(245, 179, 0, 0.1)",
          }}
        >
          <div className="cashout-icon-glow mb-2">
            <i className="fa-solid fa-receipt text-warning fs-3"></i>
          </div>
          <h3 className="panel-heading text-warning mb-1" style={{ textShadow: "0 0 12px rgba(245, 179, 0, 0.4)" }}>
            Print Voucher
          </h3>
          <p className="panel-label text-secondary small text-uppercase mb-1" style={{ fontSize: "0.72rem" }}>
            Voucher Cashout Amount
          </p>
          <div className="panel-amount fs-2 fw-bold text-light">
            <span className="currency-symbol text-warning me-1">N$</span>
            <span id="terminalModalAmount">{amount.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-light small mb-3">
          Do you want to print a cashout ticket for <strong className="text-warning">{formatCurrency(amount)}</strong>?
        </p>

        {/* Button Actions: Print Ticket & Cancel */}
        <div className="d-flex flex-column gap-2 mt-2">
          <Button variant="primary" onClick={onConfirmPrint} icon="fa-solid fa-print">
            Print Ticket
          </Button>
          <Button variant="cancel" onClick={onClose} icon="fa-solid fa-xmark">
            Cancel
          </Button>
        </div>

        <p className="text-dim small mt-3 mb-0" style={{ fontSize: "0.76rem" }}>
          <i className="fa-solid fa-print me-1 text-warning"></i>
          Ticket voucher will be printed by the terminal receipt printer.
        </p>
      </div>
    </Modal>
  );
};
