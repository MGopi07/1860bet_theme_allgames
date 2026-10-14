import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMachine } from "./useMachine";
import { ThemeNotificationModal } from "../components/common/ThemeNotificationModal";
import { api } from "../services/api";

interface KeyboardLockContextType {
  isLocked: boolean;
  isOverrideUnlocked: boolean;
  setIsOverrideUnlocked: React.Dispatch<React.SetStateAction<boolean>>;
  balance: number;
}

const KeyboardLockContext = createContext<KeyboardLockContextType>({
  isLocked: false,
  isOverrideUnlocked: false,
  setIsOverrideUnlocked: () => {},
  balance: 0,
});

export const KeyboardLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { machine } = useMachine("smart-pc");
  const balance = machine.balance;
  const location = useLocation();

  const [isOverrideUnlocked, setIsOverrideUnlocked] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // 1. Global Keyboard Protection & Admin Shortcut: Ctrl + Shift + R
  useEffect(() => {
    // Attempt modern W3C Keyboard Lock API if in fullscreen/kiosk
    if (typeof navigator !== "undefined" && "keyboard" in navigator && (navigator as any).keyboard?.lock) {
      (navigator as any).keyboard.lock(["MetaLeft", "MetaRight", "Escape"]).catch(() => {});
    }

    const isWindowsKey = (e: KeyboardEvent) => {
      return (
        e.key === "Meta" ||
        e.key === "OS" ||
        e.code === "MetaLeft" ||
        e.code === "MetaRight" ||
        e.code === "OSLeft" ||
        e.code === "OSRight" ||
        e.keyCode === 91 ||
        e.keyCode === 92
      );
    };

    const handleGlobalKeyGuard = (e: KeyboardEvent) => {
      // Always block Windows key from opening OS menu or minimizing app
      if (isWindowsKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isR = e.key === "R" || e.key === "r" || e.code === "KeyR";

      if (isCtrlOrMeta && isShift && isR) {
        e.preventDefault();
        e.stopPropagation();
        localStorage.removeItem("winbet_machine_id");
        localStorage.removeItem("winbet_numeric_id");
        localStorage.removeItem("winbet_setup_code");
        localStorage.removeItem("winbet_registration_token");
        api.generateNewDeviceFingerprint();
        window.location.href = "/register";
      }
    };

    window.addEventListener("keydown", handleGlobalKeyGuard, true);
    window.addEventListener("keyup", handleGlobalKeyGuard, true);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyGuard, true);
      window.removeEventListener("keyup", handleGlobalKeyGuard, true);
    };
  }, []);

  // 2. If balance becomes positive (> 0), automatically clear the override and unlock
  useEffect(() => {
    if (balance > 0) {
      setIsOverrideUnlocked(false);
    }
  }, [balance]);

  // Current path check: Register / setup pages MUST NEVER be locked
  const currentPath = (location?.pathname || window.location.pathname || "").toLowerCase();
  const isRegisterPage =
    currentPath.includes("register") ||
    currentPath.includes("login") ||
    currentPath === "/" ||
    currentPath === "/not-authorized";

  const isLobbyOrGamePage =
    !isRegisterPage &&
    (currentPath === "/smart-pc" ||
      currentPath.startsWith("/smart-pc/play") ||
      currentPath.startsWith("/play") ||
      currentPath === "/smart-pc/cashout");

  // Locks ALWAYS once past the register screen:
  const isLocked = !isRegisterPage && !isOverrideUnlocked;

  useEffect(() => {
    // If on register/setup page OR if not locked, do NOT attach any keyboard listeners
    if (isRegisterPage || !isLobbyOrGamePage || !isLocked) {
      return;
    }

    const isUnlockCombo = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isD = e.key === "D" || e.key === "d" || e.code === "KeyD";
      const isK = e.key === "K" || e.key === "k" || e.code === "KeyK";
      return isCtrlOrMeta && isShift && (isD || isK);
    };

    const isRegisterCombo = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isR = e.key === "R" || e.key === "r" || e.code === "KeyR";
      return isCtrlOrMeta && isShift && isR;
    };

    const isModifierKey = (e: KeyboardEvent) => {
      return (
        e.key === "Control" ||
        e.key === "Shift" ||
        e.key === "Alt" ||
        e.key === "CapsLock" ||
        e.code === "ControlLeft" ||
        e.code === "ControlRight" ||
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight" ||
        e.code === "AltLeft" ||
        e.code === "AltRight"
      );
    };

    const isInputOrInteractive = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.isContentEditable ||
        Boolean(target.closest("input, textarea, select, [contenteditable]"))
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check for Register Token Shortcut: Ctrl + Shift + R
      if (isRegisterCombo(e)) {
        e.preventDefault();
        e.stopPropagation();
        localStorage.removeItem("winbet_machine_id");
        localStorage.removeItem("winbet_numeric_id");
        localStorage.removeItem("winbet_setup_code");
        localStorage.removeItem("winbet_registration_token");
        window.location.href = "/register";
        return;
      }

      // 2. Check for Admin Override Shortcut: Ctrl + Shift + D (or Ctrl + Shift + K)
      if (isUnlockCombo(e)) {
        e.preventDefault();
        e.stopPropagation();
        setIsOverrideUnlocked((prev) => {
          const nextState = !prev;
          const msg = nextState
            ? "🔓 KEYBOARD UNLOCKED (Admin Mode: Ctrl+Shift+D)"
            : "🔒 KEYBOARD LOCKED (Zero Balance Mode)";
          setNotificationMsg(msg);
          setTimeout(() => setNotificationMsg(null), 4000);
          return nextState;
        });
        return;
      }

      // 3. Always allow typing in any input field or dialog form
      if (isInputOrInteractive(e.target)) {
        return;
      }

      // 4. Allow modifier keys through so combinations (Ctrl, Shift, etc.) can register
      if (isModifierKey(e)) {
        return;
      }

      // 5. Block gaming key inputs while on zero-balance lobby
      e.preventDefault();
      e.stopPropagation();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isInputOrInteractive(e.target) || isModifierKey(e)) {
        return;
      }
      if (!isUnlockCombo(e) && !isRegisterCombo(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (isInputOrInteractive(e.target) || isModifierKey(e)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };

    // Right-click context menu: disabled only when locked on lobby
    const handleContextMenu = (e: MouseEvent) => {
      if (!isInputOrInteractive(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("keypress", handleKeyPress, true);
    window.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("keypress", handleKeyPress, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [isRegisterPage, isLobbyOrGamePage, isLocked]);

  return (
    <KeyboardLockContext.Provider
      value={{
        isLocked,
        isOverrideUnlocked,
        setIsOverrideUnlocked,
        balance,
      }}
    >
      {children}
      {/* Global Notification modal when Ctrl+Shift+D is pressed */}
      <ThemeNotificationModal
        isOpen={Boolean(notificationMsg)}
        message={notificationMsg}
        onClose={() => setNotificationMsg(null)}
      />
    </KeyboardLockContext.Provider>
  );
};

export interface UseKioskKeyboardLockOptions {
  balance?: number;
  onNotify?: (message: string) => void;
}

/**
 * Custom hook to access kiosk keyboard lock status.
 * Can be unlocked/toggled by the admin shortcut: Ctrl + Shift + D.
 * Token registration redirect: Ctrl + Shift + R.
 * Automatically unlocks when balance > 0.
 */
export function useKioskKeyboardLock(_options?: UseKioskKeyboardLockOptions) {
  const context = useContext(KeyboardLockContext);
  return context;
}
