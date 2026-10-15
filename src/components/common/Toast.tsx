import React, { useEffect } from "react";

export interface ToastProps {
  isOpen: boolean;
  message: string | null;
  title?: string;
  onClose: () => void;
  autoCloseDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  message,
  onClose,
  autoCloseDuration = 3500,
}) => {
  useEffect(() => {
    if (!isOpen || !message) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);
    return () => clearTimeout(timer);
  }, [isOpen, message, autoCloseDuration, onClose]);

  if (!isOpen || !message) return null;

  const lower = message.toLowerCase();
  let icon = "fa-solid fa-bell text-warning";
  let borderColor = "rgba(245, 131, 31, 0.6)";
  let glowColor = "rgba(245, 131, 31, 0.35)";

  if (
    lower.includes("approved") ||
    lower.includes("loaded") ||
    lower.includes("success") ||
    lower.includes("enrolled") ||
    lower.includes("activated") ||
    lower.includes("+n$")
  ) {
    icon = "fa-solid fa-circle-check text-success";
    borderColor = "rgba(34, 197, 94, 0.6)";
    glowColor = "rgba(34, 197, 94, 0.35)";
  } else if (
    lower.includes("insufficient") ||
    lower.includes("zero") ||
    lower.includes("warning") ||
    lower.includes("low")
  ) {
    icon = "fa-solid fa-triangle-exclamation text-warning";
    borderColor = "rgba(245, 179, 0, 0.6)";
    glowColor = "rgba(245, 179, 0, 0.35)";
  } else if (
    lower.includes("rejected") ||
    lower.includes("declined") ||
    lower.includes("failed") ||
    lower.includes("error")
  ) {
    icon = "fa-solid fa-circle-xmark text-danger";
    borderColor = "rgba(239, 68, 68, 0.6)";
    glowColor = "rgba(239, 68, 68, 0.35)";
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 99999,
        background: "linear-gradient(135deg, #241408 0%, #110A05 100%)",
        border: `1.5px solid ${borderColor}`,
        boxShadow: `0 8px 30px rgba(0, 0, 0, 0.7), 0 0 20px ${glowColor}`,
        borderRadius: "14px",
        padding: "12px 18px",
        color: "#ffffff",
        maxWidth: "420px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pointerEvents: "auto",
      }}
    >
      <div style={{ fontSize: "1.35rem", display: "flex", alignItems: "center" }}>
        <i className={icon}></i>
      </div>
      <div style={{ flex: 1, fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.4 }}>
        {message}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.6)",
          cursor: "pointer",
          fontSize: "1rem",
          padding: "2px 6px",
          marginLeft: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)")}
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};
