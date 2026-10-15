import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  isLocked?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "380px",
  showCloseButton = true,
  isLocked = false,
}) => {
  useEffect(() => {
    if (isLocked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLocked]);

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block modal-theme-dark"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(8, 6, 4, 0.9)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (!isLocked && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth }}>
        <div className="modal-content position-relative overflow-hidden">
          {!isLocked && showCloseButton && (
            <button
              type="button"
              className="btn-game-modal-close"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
