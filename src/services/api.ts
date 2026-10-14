import { shop } from "../constants/machine";
import type {
  TicketInfo,
  SmartPCRegisterPayload,
  SmartPCRegisterData,
  SmartPCSessionData,
  SmartPCProviderItem,
  SmartPCGameItem,
  SmartPCGamesPageResponse,
  SmartPCLaunchGameResponse,
  SmartPCPlaceBetResponse,
  SmartPCCashoutData,
} from "../types";
import { generateTicketNumber } from "../utils/formatCurrency";
import { broadcastBalanceChange, broadcastStationUnbound } from "../hooks/useMachine";

// Base URL configuration (PDF Section 1.1)
const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL || "https://staging.iccpanel.com/api";

export const generateNewDeviceFingerprint = (): string => {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").substring(0, 12)
      : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const fp = `fp_spc_${randomPart}`;
  localStorage.setItem("winbet_device_fingerprint", fp);
  return fp;
};

export const getDeviceFingerprint = (): string => {
  let fp = localStorage.getItem("winbet_device_fingerprint");
  if (!fp || fp === "fp_browser_smartpc_01") {
    fp = generateNewDeviceFingerprint();
  }
  return fp;
};

export const getPortalSlug = (): string => {
  return (
    localStorage.getItem("winbet_portal") ||
    import.meta.env.VITE_PORTAL_SLUG ||
    "betwise"
  );
};

export const getStoredMachineId = (): string => {
  return localStorage.getItem("winbet_machine_id") || "";
};

const buildShopUrl = (path: string, portalSlug?: string): string => {
  const slug = portalSlug || getPortalSlug();
  const cleanOrigin = API_ORIGIN.replace(/\/$/, "");
  return `${cleanOrigin}/v1/${slug}/shop${path}`;
};

// Real-time API balance state
let fallbackChipsBalance = Number(localStorage.getItem("winbet_machine_balance")) || 0.0;
let fallbackPendingCashout: { isPending: boolean; amount: number; id: number } = {
  isPending: false,
  amount: 0,
  id: 0,
};

// In-memory query cache & in-flight promise deduplication
interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const inFlightRequests = new Map<string, Promise<any>>();
const queryCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const item = queryCache.get(key);
  if (item && Date.now() - item.timestamp < ttlMs) {
    return item.data as T;
  }
  return null;
}

function setCached<T>(key: string, data: T): void {
  queryCache.set(key, { timestamp: Date.now(), data });
}

export const clearApiCache = (): void => {
  queryCache.clear();
  inFlightRequests.clear();
};

export const api = {
  getDeviceFingerprint,
  generateNewDeviceFingerprint,
  getPortalSlug,
  getStoredMachineId,
  clearCache: clearApiCache,

  /**
   * 4.1 Register (POST /smart-pcs/register)
   * Status 201. Returns machine metadata, balance, shop details, player_id
   */
  async registerSmartPC(payload: SmartPCRegisterPayload): Promise<SmartPCRegisterData> {
    clearApiCache();
    const url = buildShopUrl("/smart-pcs/register", payload.portal_slug);
    const token = payload.registration_token.trim().toUpperCase();
    const fp = payload.device_fingerprint || getDeviceFingerprint();

    const body = {
      registration_token: token,
      device_fingerprint: fp,
      operating_system: payload.operating_system || "Windows 11",
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.data) {
        const data: SmartPCRegisterData = json.data;
        localStorage.setItem("winbet_machine_id", data.machine_id);
        localStorage.setItem("winbet_numeric_id", String(data.id));
        localStorage.setItem("winbet_player_id", String(data.player_id));
        localStorage.setItem("winbet_shop_id", String(data.shop_id));
        localStorage.setItem("winbet_shop_name", data.shop_name);
        localStorage.setItem("winbet_machine_name", data.pc_name || data.terminal_name || data.machine_id);
        localStorage.setItem("winbet_portal", payload.portal_slug);
        localStorage.setItem("winbet_device_fingerprint", fp);
        
        const balance = typeof data.current_balance === "number" ? data.current_balance : 0;
        fallbackChipsBalance = balance;
        broadcastBalanceChange(balance);

        return data;
      }

      const specificError =
        json.errors?.registration_token?.[0] ||
        json.errors?.device_fingerprint?.[0] ||
        json.message ||
        "Registration failed on server";
      throw new Error(specificError);
    } catch (err) {
      console.warn("API register error:", err);
      throw err;
    }
  },

  /**
   * 4.2 Heartbeat (POST /smart-pcs/heartbeat)
   * Sends heartbeat every 15-30s in background
   * Returns live station metadata including current_balance
   */
  async sendHeartbeat(machineId?: string, fingerprint?: string): Promise<{ success: boolean; message?: string; data?: any }> {
    const mId = machineId || getStoredMachineId();
    const fp = fingerprint || getDeviceFingerprint();
    const url = buildShopUrl("/smart-pcs/heartbeat");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machine_id: mId,
          device_fingerprint: fp,
          status: "ONLINE",
        }),
      });

      const json = await res.json().catch(() => ({}));
      const isUnboundStatus =
        res.status === 401 ||
        res.status === 403 ||
        res.status === 404 ||
        res.status === 422 ||
        json.status === "UNBOUND" ||
        json.status === "DEAUTHORIZED" ||
        json.status === "INACTIVE" ||
        json.status === "UNASSIGNED" ||
        json.data?.status === "UNBOUND" ||
        json.data?.status === "DEAUTHORIZED" ||
        json.data?.status === "INACTIVE" ||
        json.data?.status === "UNASSIGNED" ||
        (typeof json.message === "string" && (
          json.message.toLowerCase().includes("unbound") ||
          json.message.toLowerCase().includes("not authorized") ||
          json.message.toLowerCase().includes("not registered") ||
          json.message.toLowerCase().includes("fingerprint mismatch") ||
          json.message.toLowerCase().includes("mismatch") ||
          json.message.toLowerCase().includes("not found")
        ));

      if (isUnboundStatus) {
        broadcastStationUnbound(json.data?.current_balance ?? fallbackChipsBalance);
        return { success: false, message: json.message || "Smart PC unbound on server", data: { status: "UNBOUND" } };
      }

      if (res.ok && json.data) {
        if (typeof json.data.current_balance === "number") {
          fallbackChipsBalance = json.data.current_balance;
        }
        return { success: true, message: json.message, data: json.data };
      }
      return { success: res.ok, message: json.message, data: json.data };
    } catch {
      return { success: true };
    }
  },

  /**
   * 4.3 Session (GET /smart-pcs/session?machine_id=&device_fingerprint=)
   * Deduplicates concurrent in-flight session requests
   */
  async getSession(machineId?: string, fingerprint?: string): Promise<SmartPCSessionData> {
    const mId = machineId || getStoredMachineId();
    const fp = fingerprint || getDeviceFingerprint();
    const inFlightKey = `session:${mId}:${fp}`;

    if (inFlightRequests.has(inFlightKey)) {
      return inFlightRequests.get(inFlightKey)!;
    }

    const sessionPromise = (async (): Promise<SmartPCSessionData> => {
      const url = buildShopUrl(`/smart-pcs/session?machine_id=${encodeURIComponent(mId)}&device_fingerprint=${encodeURIComponent(fp)}`);

      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
          },
        });
        const json = await res.json().catch(() => ({}));

        const isUnbound =
          res.status === 401 ||
          res.status === 403 ||
          res.status === 404 ||
          res.status === 422 ||
          json.status === "UNBOUND" ||
          json.status === "DEAUTHORIZED" ||
          json.status === "INACTIVE" ||
          json.status === "UNASSIGNED" ||
          json.data?.status === "UNBOUND" ||
          json.data?.status === "DEAUTHORIZED" ||
          json.data?.status === "INACTIVE" ||
          json.data?.status === "UNASSIGNED" ||
          (typeof json.message === "string" && (
            json.message.toLowerCase().includes("unbound") ||
            json.message.toLowerCase().includes("not authorized") ||
            json.message.toLowerCase().includes("not registered") ||
            json.message.toLowerCase().includes("fingerprint mismatch") ||
            json.message.toLowerCase().includes("mismatch")
          ));

        if (isUnbound) {
          const unboundBal = typeof json.data?.current_balance === "number" ? json.data.current_balance : fallbackChipsBalance;
          broadcastStationUnbound(unboundBal);
          return {
            id: Number(localStorage.getItem("winbet_numeric_id")) || 0,
            machine_id: mId,
            hostname: localStorage.getItem("winbet_machine_name") || mId || "Smart PC",
            terminal_name: localStorage.getItem("winbet_machine_name") || mId || "Smart PC",
            pc_name: localStorage.getItem("winbet_machine_name") || mId || "Smart PC",
            status: "UNBOUND",
            current_balance: unboundBal,
            loaded_amount: 0,
            player_id: Number(localStorage.getItem("winbet_player_id")) || 0,
            shop_id: Number(localStorage.getItem("winbet_shop_id")) || 0,
            shop_name: localStorage.getItem("winbet_shop_name") || "WinBet Shop",
            pending_cash_out: null,
          };
        }

        if (res.ok && json.success && json.data) {
          const data: SmartPCSessionData = json.data;
          if (typeof data.current_balance === "number") {
            fallbackChipsBalance = data.current_balance;
          }
          return data;
        }
      } catch (err) {
        console.warn("API getSession failed, using active session state:", err);
      }

      const storedBal = localStorage.getItem("winbet_machine_balance");
      const balance = storedBal !== null && !isNaN(Number(storedBal)) ? Number(storedBal) : fallbackChipsBalance;

      return {
        id: Number(localStorage.getItem("winbet_numeric_id")) || 0,
        machine_id: mId,
        hostname: localStorage.getItem("winbet_machine_name") || mId || "Smart PC",
        terminal_name: localStorage.getItem("winbet_machine_name") || mId || "Smart PC",
        pc_name: localStorage.getItem("winbet_machine_name") || mId || "Smart PC",
        status: localStorage.getItem("winbet_machine_status") || "ONLINE",
        current_balance: balance,
        loaded_amount: 0,
        player_id: Number(localStorage.getItem("winbet_player_id")) || 0,
        shop_id: Number(localStorage.getItem("winbet_shop_id")) || 0,
        shop_name: localStorage.getItem("winbet_shop_name") || "WinBet Shop",
        pending_cash_out: fallbackPendingCashout.isPending
          ? {
              id: fallbackPendingCashout.id,
              requested_amount: fallbackPendingCashout.amount,
              status: "PENDING",
              requested_at: new Date().toISOString(),
            }
          : null,
      };
    })().finally(() => {
      inFlightRequests.delete(inFlightKey);
    });

    inFlightRequests.set(inFlightKey, sessionPromise);
    return sessionPromise;
  },

  /**
   * 4.4 Providers (GET /smart-pcs/providers?page=1&limit=50&provider=)
   * Cached for 60 seconds with in-flight deduplication
   */
  async getProviders(search?: string, page = 1, limit = 50, forceFresh = false): Promise<SmartPCProviderItem[]> {
    const searchParam = search ? `&provider=${encodeURIComponent(search)}` : "";
    const cacheKey = `providers:${search || ""}:${page}:${limit}`;

    if (!forceFresh) {
      const cached = getCached<SmartPCProviderItem[]>(cacheKey, 60000);
      if (cached) return cached;
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<SmartPCProviderItem[]> => {
      const url = buildShopUrl(`/smart-pcs/providers?page=${page}&limit=${limit}${searchParam}`);

      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          setCached(cacheKey, json.data);
          return json.data;
        }
      } catch (err) {
        console.warn("API getProviders failed:", err);
      }

      return [];
    })().finally(() => {
      inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  /**
   * 4.5 Games (GET /smart-pcs/games?page=1&limit=50 or ?provider=...)
   */
  async getGames(provider?: string, page = 1, limit = 50, forceFresh = false): Promise<SmartPCGameItem[]> {
    const res = await this.getGamesPage(provider, page, limit, forceFresh);
    return res.games;
  },

  /**
   * 4.5 Games with Full Pagination Data
   * Cached for 30 seconds with in-flight deduplication
   */
  async getGamesPage(provider?: string, page = 1, limit = 50, forceFresh = false): Promise<SmartPCGamesPageResponse> {
    const providerParam = provider && provider.toLowerCase() !== "all" ? `&provider=${encodeURIComponent(provider)}` : "";
    const cacheKey = `games:${providerParam}:${page}:${limit}`;

    if (!forceFresh) {
      const cached = getCached<SmartPCGamesPageResponse>(cacheKey, 30000);
      if (cached) return cached;
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<SmartPCGamesPageResponse> => {
      const url = buildShopUrl(`/smart-pcs/games?page=${page}&limit=${limit}${providerParam}`);

      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          const total = json.pagination?.total || json.data.length;
          const lastPage = json.pagination?.last_page || 1;
          const currentPage = json.pagination?.current_page || page;
          const result: SmartPCGamesPageResponse = {
            games: json.data,
            currentPage,
            lastPage,
            total,
            hasMore: currentPage < lastPage,
          };
          setCached(cacheKey, result);
          return result;
        }
      } catch (err) {
        console.warn("API getGamesPage failed:", err);
      }

      return {
        games: [],
        currentPage: page,
        lastPage: 1,
        total: 0,
        hasMore: false,
      };
    })().finally(() => {
      inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  /**
   * 4.6 Launch Provider Game (POST /smart-pcs/launch-game)
   */
  async launchProviderGame(gameIdOrUuid: string | number): Promise<SmartPCLaunchGameResponse> {
    const mId = getStoredMachineId();
    const fp = getDeviceFingerprint();
    const url = buildShopUrl("/smart-pcs/launch-game");

    const returnUrl = "https://staging.iccpanel.com/close";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machine_id: mId,
          device_fingerprint: fp,
          game: String(gameIdOrUuid),
          return_url: returnUrl,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.data) {
        return json.data;
      } else {
        const errorMsg =
          json.message ||
          json.errors?.game?.[0] ||
          json.errors?.machine_id?.[0] ||
          json.errors?.device_fingerprint?.[0] ||
          json.errors?.registration_token?.[0] ||
          "Failed to launch provider game on server.";
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.warn("API launchProviderGame error:", err);
      throw err;
    }
  },

  /**
   * 4.7 Place Bet - Dummy / Local Only (POST /smart-pcs/place-bet)
   * Minimum stake 10. Default game: red_black.
   */
  async placeBet(game = "red_black", choice = "RED", stake = 10): Promise<SmartPCPlaceBetResponse> {
    const mId = getStoredMachineId();
    const fp = getDeviceFingerprint();
    const url = buildShopUrl("/smart-pcs/place-bet");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machine_id: mId,
          device_fingerprint: fp,
          game,
          choice,
          stake,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        fallbackChipsBalance = json.data.current_balance;
        broadcastBalanceChange(json.data.current_balance);
        return json.data;
      } else if (json.message) {
        throw new Error(json.message);
      }
    } catch (err) {
      console.warn("API placeBet error / executing outcome:", err);
      if (err instanceof Error && err.message && !err.message.includes("Failed to fetch") && !err.message.includes("NetworkError")) {
        throw err;
      }
    }

    const storedBal = localStorage.getItem("winbet_machine_balance");
    const currentBal = storedBal !== null && !isNaN(Number(storedBal)) ? Number(storedBal) : fallbackChipsBalance;

    if (currentBal < stake) {
      throw new Error("Insufficient player chips. Please load coins at cashier counter.");
    }

    const won = Math.random() > 0.45;
    const multi = won ? 2.0 : 0;
    const payout = won ? stake * multi : 0;
    const newBal = Math.max(0, currentBal - stake + payout);
    fallbackChipsBalance = newBal;
    broadcastBalanceChange(newBal);

    return {
      game,
      game_name: game.replace(/[-_]/g, " ").toUpperCase(),
      choice,
      result: won ? choice : choice === "RED" ? "BLACK" : "HEADS",
      won,
      stake,
      payout,
      multiplier: multi,
      current_balance: newBal,
      message: won
        ? `${game.replace(/[-_]/g, " ").toUpperCase()} — You won! Result: ${choice}. +${payout.toFixed(2)}`
        : `${game.replace(/[-_]/g, " ").toUpperCase()} — You lost. Result: ${choice === "RED" ? "BLACK" : "TAILS"}. -${stake.toFixed(2)}`,
      round_id: `rnd_${Math.random().toString(36).substring(2, 9)}`,
      transaction_id: Math.floor(100 + Math.random() * 900),
      player_id: Number(localStorage.getItem("winbet_player_id")) || 11030,
    };
  },

  /**
   * 4.8 Cash-out Request (POST /cashout/request)
   * Status 201. Omit amount to cash full chips.
   */
  async requestCashOut(requestedAmount?: number): Promise<SmartPCCashoutData> {
    const mId = getStoredMachineId();
    const fp = getDeviceFingerprint();
    const url = buildShopUrl("/cashout/request");

    const body: Record<string, unknown> = {
      machine_id: mId,
      device_fingerprint: fp,
    };
    if (requestedAmount !== undefined && requestedAmount > 0) {
      body.requested_amount = requestedAmount;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        fallbackPendingCashout = {
          isPending: true,
          amount: json.data.requested_amount,
          id: json.data.id,
        };
        fallbackChipsBalance = 0.0;
        broadcastBalanceChange(0.0);
        return json.data;
      }
    } catch (err) {
      console.warn("API requestCashOut failed, creating pending record:", err);
    }

    const storedBal = Number(localStorage.getItem("winbet_machine_balance")) || fallbackChipsBalance;
    const amt = requestedAmount || storedBal || 0.0;
    fallbackPendingCashout = {
      isPending: true,
      amount: amt,
      id: Math.floor(10 + Math.random() * 90),
    };
    fallbackChipsBalance = 0.0;
    broadcastBalanceChange(0.0);

    return {
      id: fallbackPendingCashout.id,
      machine_id: mId,
      shop_machine_id: Number(localStorage.getItem("winbet_numeric_id")) || 0,
      pc_name: localStorage.getItem("winbet_machine_name") || mId || "Smart PC",
      shop_id: Number(localStorage.getItem("winbet_shop_id")) || 0,
      shop_name: localStorage.getItem("winbet_shop_name") || "WinBet Shop",
      player_id: Number(localStorage.getItem("winbet_player_id")) || 0,
      requested_amount: amt,
      approved_amount: null,
      remarks: null,
      status: "PENDING",
      requested_at: new Date().toISOString(),
      processed_at: null,
    };
  },

  /**
   * 4.9 Cash-out Status (GET /cashout/terminal-status?machine_id=&device_fingerprint=)
   */
  async getCashoutStatus(): Promise<{ pending?: { id: number; status: string; requested_amount: number } | null; latest?: { id: number; status: string; requested_amount: number } | null }> {
    const mId = getStoredMachineId();
    const fp = getDeviceFingerprint();
    const url = buildShopUrl(`/cashout/terminal-status?machine_id=${encodeURIComponent(mId)}&device_fingerprint=${encodeURIComponent(fp)}`);

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        return json.data;
      }
    } catch {
      // Return local state
    }

    return {
      pending: fallbackPendingCashout.isPending
        ? { id: fallbackPendingCashout.id, status: "PENDING", requested_amount: fallbackPendingCashout.amount }
        : null,
      latest: !fallbackPendingCashout.isPending
        ? { id: fallbackPendingCashout.id, status: "APPROVED", requested_amount: fallbackPendingCashout.amount }
        : null,
    };
  },

  /**
   * 4.10 Echo Auth (POST /broadcasting/auth/terminal)
   */
  async broadcastAuth(channelName: string, socketId: string): Promise<{ auth: string }> {
    const mId = getStoredMachineId();
    const fp = getDeviceFingerprint();
    const url = buildShopUrl("/broadcasting/auth/terminal");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel_name: channelName,
          socket_id: socketId,
          machine_id: mId,
          device_fingerprint: fp,
        }),
      });
      const json = await res.json();
      return json;
    } catch {
      return { auth: `auth_mock_${socketId}` };
    }
  },

  /**
   * Cashier actions simulated for pure web testing
   */
  async cashierApproveCashout(): Promise<{ success: boolean; paidAmount: number }> {
    const amt = fallbackPendingCashout.amount;
    fallbackPendingCashout = { isPending: false, amount: 0, id: 0 };
    fallbackChipsBalance = 0.0;
    broadcastBalanceChange(0.0);
    return { success: true, paidAmount: amt };
  },

  async cashierRejectCashout(): Promise<{ success: boolean; restoredAmount: number }> {
    const amt = fallbackPendingCashout.amount || 250.0;
    fallbackChipsBalance = amt;
    fallbackPendingCashout = { isPending: false, amount: 0, id: 0 };
    broadcastBalanceChange(amt);
    return { success: true, restoredAmount: amt };
  },

  async loadCoinsByStaff(_machineId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
    const storedBal = localStorage.getItem("winbet_machine_balance");
    const current = storedBal !== null && !isNaN(Number(storedBal)) ? Number(storedBal) : fallbackChipsBalance;
    const updated = current + amount;
    fallbackChipsBalance = updated;
    broadcastBalanceChange(updated);
    return { success: true, newBalance: updated };
  },

  async printTerminalTicket(machineName: string, amount: number): Promise<{ success: boolean; ticket: TicketInfo }> {
    const ticket: TicketInfo = {
      ticketNumber: generateTicketNumber(),
      amount,
      createdAt: new Date().toISOString(),
      machineName,
      shopName: shop.name,
    };

    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        const { printTicketNative } = await import("./tauri");
        await printTicketNative({
          ticket_number: ticket.ticketNumber,
          amount: ticket.amount,
          machine_name: ticket.machineName,
          shop_name: ticket.shopName,
          created_at: ticket.createdAt,
        });
      } catch (err) {
        console.warn("Native printer dispatch notice:", err);
      }
    }

    return { success: true, ticket };
  },
};
