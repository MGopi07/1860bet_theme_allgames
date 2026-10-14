import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useMachine, CASHOUT_STATUS_EVENT } from "../../hooks/useMachine";
import { BalanceDisplay } from "../../components/gaming/BalanceDisplay";
import { CashOutModal } from "../../components/gaming/CashOutModal";
import { ValidationModals } from "../../components/gaming/ValidationModals";
import { ThemeNotificationModal } from "../../components/common/ThemeNotificationModal";
import { formatCurrency } from "../../utils/formatCurrency";
import { useKioskKeyboardLock } from "../../hooks/useKioskKeyboardLock";
import type { GameItem, ValidationAlertType } from "../../types";

export const GamePlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const { machine, updateBalance, toastMessage, showToast, clearToast } = useMachine("smart-pc");
  const { isOverrideUnlocked } = useKioskKeyboardLock();

  // Game data from location state or API
  const passedGame = location.state?.game as GameItem | undefined;
  const targetGameId = passedGame?.uuid || gameId || passedGame?.id || "aviator";

  const [game, setGame] = useState<GameItem | null>(() => {
    if (passedGame) return passedGame;
    return {
      id: targetGameId,
      name: String(targetGameId),
      title: String(targetGameId).replace(/[-_]/g, " ").toUpperCase(),
      category: "slots",
      categories: ["slots", "popular"],
      theme: "theme-gold",
      image: "/assets/games/SPRIBE/AVIATOR.png",
      kind: "provider",
      provider: "Live Provider",
      actionText: "PLAY NOW",
    };
  });

  // Fetch game details from API if not passed in state
  useEffect(() => {
    if (!passedGame) {
      api.getGames().then((items) => {
        const found = items.find(
          (g) =>
            String(g.id).toLowerCase() === String(targetGameId).toLowerCase() ||
            String(g.uuid).toLowerCase() === String(targetGameId).toLowerCase() ||
            g.name.toLowerCase() === String(targetGameId).toLowerCase()
        );
        if (found) {
          setGame({
            id: found.id || found.uuid || targetGameId,
            name: found.name.toLowerCase(),
            title: found.name.toUpperCase(),
            subtitle: found.description || "LIVE PROVIDER GAME",
            category: (found.category || "slots").toLowerCase(),
            categories: [(found.category || "slots").toLowerCase()],
            theme: "theme-gold",
            badge: { text: "LIVE", type: "live" },
            image: found.image || found.provider_image || "/assets/games/SPRIBE/AVIATOR.png",
            actionText: "PLAY NOW",
            kind: found.kind || "provider",
            provider: found.provider || "Game Provider",
            uuid: found.uuid || String(found.id),
          });
        }
      }).catch(() => {});
    }
  }, [passedGame, targetGameId]);

  // Launch state
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(true);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<"stream" | "arcade">("stream");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Local betting arcade state
  const [selectedChoice, setSelectedChoice] = useState("RED");
  const [stake, setStake] = useState(10);
  const [isPlayingRound, setIsPlayingRound] = useState(false);
  const [roundResult, setRoundResult] = useState<{
    won: boolean;
    result: string;
    payout: number;
    message: string;
  } | null>(null);

  // Slot machine animation state
  const [slotReels, setSlotReels] = useState(["💎", "7️⃣", "👑"]);
  const slotSymbols = ["🍒", "🍋", "🍇", "💎", "👑", "⚡", "7️⃣"];

  // Cash out modal state
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<ValidationAlertType>("NONE");
  const [pendingCashoutAmount, setPendingCashoutAmount] = useState(0);

  const syncSession = useCallback(() => {
    const machineId = api.getStoredMachineId();
    const fingerprint = api.getDeviceFingerprint();

    api
      .getSession(machineId, fingerprint)
      .then((session) => {
        if (session && typeof session.current_balance === "number") {
          updateBalance(session.current_balance);
        }
        if (session?.pending_cash_out?.requested_amount) {
          setPendingCashoutAmount(session.pending_cash_out.requested_amount);
          // Intentionally omitting setActiveAlert("CASHOUT_PENDING") here
        }
      })
      .catch(() => {});
  }, [updateBalance]);

  // 1. Session Sync on Mount (PDF 4.3) & Window Focus
  useEffect(() => {
    syncSession();
    window.addEventListener("focus", syncSession);
    return () => {
      window.removeEventListener("focus", syncSession);
    };
  }, [syncSession]);

  // 2. Heartbeat in background (PDF 4.2)
  useEffect(() => {
    const machineId = api.getStoredMachineId();
    const fingerprint = api.getDeviceFingerprint();

    const doHeartbeat = () => {
      api
        .sendHeartbeat(machineId, fingerprint)
        .then((res) => {
          if (res.data && typeof res.data.current_balance === "number") {
            updateBalance(res.data.current_balance);
          }
        })
        .catch(() => {});
    };

    doHeartbeat();
    const timer = setInterval(doHeartbeat, 15000);

    return () => clearInterval(timer);
  }, [updateBalance]);

  const initiateGameLaunch = useCallback(() => {
    setIsLaunching(true);
    setLaunchError(null);

    api
      .launchProviderGame(targetGameId)
      .then((res) => {
        const url = res.game_url || "";
        const isExternalProvider =
          url.startsWith("http") &&
          !url.includes("/smart-pc") &&
          !url.includes(window.location.host) &&
          !url.includes("staging.iccpanel.com") &&
          !url.includes("staging.game-server.winbet.com");

        if (isExternalProvider) {
          setGameUrl(url);
          setPlayMode("stream");
          setIsLaunching(false);
        } else {
          setLaunchError(
            `Unable to stream "${game?.title || "Game"}". Staging provider returned a redirect instead of an active stream.`
          );
          setIsLaunching(false);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to launch provider game on server.";
        setLaunchError(msg);
        setIsLaunching(false);
      });
  }, [targetGameId, game?.title]);

  // 3. Launch Game Token (POST /smart-pcs/launch-game - PDF 4.6)
  useEffect(() => {
    initiateGameLaunch();
  }, [initiateGameLaunch]);

  // Auto-redirect to Lobby if playing game and balance is 0
  useEffect(() => {
    if (machine.balance <= 0) {
      navigate("/smart-pc", { replace: true });
    }
  }, [machine.balance, navigate]);

  // Choices map for local dummy games (PDF 4.7)
  const getChoices = () => {
    const name = (game?.name || "").toLowerCase();
    if (name.includes("coin") || name.includes("flip")) return ["HEADS", "TAILS"];
    if (name.includes("hilo") || name.includes("hi_lo")) return ["HI", "LO"];
    if (name.includes("soccer") || name.includes("goal")) return ["LEFT", "CENTER", "RIGHT"];
    if (name.includes("dice")) return ["1", "2", "3", "4", "5", "6"];
    if (name.includes("odd") || name.includes("even")) return ["ODD", "EVEN"];
    if (name.includes("roulette")) return ["RED", "BLACK", "GREEN"];
    if (name.includes("card") || name.includes("suit")) return ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];
    if (name.includes("wheel")) return ["A", "B", "C", "D", "E"];
    if (name.includes("nine")) return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    return ["RED", "BLACK"];
  };

  const choices = getChoices();

  const handleOpenCashout = () => {
    if (machine.balance <= 0) {
      navigate("/smart-pc", { replace: true });
      return;
    }
    setIsCashoutModalOpen(true);
  };

  const handleConfirmCashout = async () => {
    const amt = machine.balance;
    setIsCashoutModalOpen(false);

    try {
      await api.requestCashOut(amt);
      updateBalance(0.0);
    } catch {
      updateBalance(0.0);
    } finally {
      // Exit the game and immediately redirect to Lobby with cashout state
      navigate("/smart-pc", {
        replace: true,
        state: { cashoutRequested: true, amount: amt },
      });
    }
  };

  const handleCashierApprove = async () => {
    await api.cashierApproveCashout();
    setActiveAlert("NONE");
    navigate("/smart-pc", { replace: true });
  };

  const handleCashierReject = async () => {
    const res = await api.cashierRejectCashout();
    const restored = res.restoredAmount || pendingCashoutAmount || 250;
    updateBalance(restored);
    setActiveAlert("CASHOUT_REJECTED");
    showToast(`Cash Out rejected by cashier. N$ ${restored.toFixed(2)} restored.`);
  };

  const handlePopoutWindow = () => {
    if (gameUrl) {
      window.open(gameUrl, "_blank", "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no");
    }
  };

  useEffect(() => {
    const handleCashoutStatus = (e: Event) => {
      const customEvt = e as CustomEvent<{ status: string; amount: number }>;
      if (customEvt.detail.status === "REJECTED") {
        setPendingCashoutAmount(customEvt.detail.amount);
        setActiveAlert("CASHOUT_REJECTED");
      } else if (customEvt.detail.status === "APPROVED") {
        setActiveAlert("NONE");
        navigate("/smart-pc", { replace: true });
      }
    };
    window.addEventListener(CASHOUT_STATUS_EVENT, handleCashoutStatus);

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    if (activeAlert === "CASHOUT_PENDING") {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.getCashoutStatus();
          if (res) {
            const latestStatus = res.latest?.status?.toUpperCase();
            const pendingStatus = res.pending?.status?.toUpperCase();

            if (latestStatus === "APPROVED" && (!res.pending || pendingStatus === "APPROVED")) {
              setActiveAlert("NONE");
              navigate("/smart-pc", { replace: true });
            } else if (latestStatus === "REJECTED" && (!res.pending || pendingStatus === "REJECTED")) {
              const restored = res.latest?.requested_amount || pendingCashoutAmount;
              updateBalance(restored);
              setActiveAlert("CASHOUT_REJECTED");
              showToast(`Cash out declined. N$ ${restored.toFixed(2)} restored.`);
            }
          }
        } catch {
          // ignore network poll errors
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener(CASHOUT_STATUS_EVENT, handleCashoutStatus);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeAlert, pendingCashoutAmount, showToast, updateBalance, navigate]);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const toggleFullscreen = () => {
    const container = document.getElementById("gamePlayContainer");
    if (!document.fullscreenElement && container) {
      container.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePlaceBet = async () => {
    if (isPlayingRound) return;
    if (machine.balance < stake) {
      showToast("Insufficient Balance! Please load chips at cashier desk.");
      return;
    }

    setIsPlayingRound(true);
    setRoundResult(null);

    // Slot reel animation if slot
    if (game?.category === "slots" || game?.name.includes("rush") || game?.name.includes("bonanza")) {
      const balanceBefore = machine.balance;
      updateBalance(balanceBefore - stake);

      setTimeout(() => {
        setSlotReels([slotSymbols[Math.floor(Math.random() * slotSymbols.length)], slotReels[1], slotReels[2]]);
      }, 300);

      setTimeout(() => {
        setSlotReels((prev) => [prev[0], slotSymbols[Math.floor(Math.random() * slotSymbols.length)], prev[2]]);
      }, 600);

      setTimeout(() => {
        const lastSymbol = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        setSlotReels((prev) => [prev[0], prev[1], lastSymbol]);

        const won = Math.random() > 0.45;
        const multi = won ? [1.5, 2.0, 3.5, 5.0, 10.0][Math.floor(Math.random() * 5)] : 0;
        const payout = stake * multi;

        if (won) {
          updateBalance(balanceBefore - stake + payout);
        }

        setRoundResult({
          won,
          result: lastSymbol,
          payout,
          message: won ? `Big Win! ${multi}X Multiplier awarded!` : "No match this spin. Try again!",
        });
        setIsPlayingRound(false);
      }, 1000);
      return;
    }

    // PDF 4.7 Local Bet via live API
    try {
      const res = await api.placeBet(game?.name || "red_black", selectedChoice, stake);
      updateBalance(res.current_balance);
      setRoundResult({
        won: res.won,
        result: res.result,
        payout: res.payout,
        message: res.message,
      });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setIsPlayingRound(false);
    }
  };

  return (
    <div id="gamePlayContainer" className="d-flex flex-column min-vh-100" style={{ background: "#080214" }}>
      {/* ==============================================================
           IDENTICAL TOP GAMING HEADER (Matching Smart PC Lobby Exactly)
      =============================================================== */}
      <header className="smart-pc-header sticky-top" style={{ zIndex: 1050 }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          {/* Left: Brand Logo + Back to Lobby + Station Badge + Game Name */}
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            {/* Back to Lobby Button */}
            <Link
              to="/smart-pc"
              className="btn btn-sm btn-outline-warning fw-bold px-3 rounded-pill d-flex align-items-center gap-2"
              title="Return to Smart PC Lobby"
              style={{ fontSize: "0.82rem", borderColor: "rgba(245, 179, 0, 0.7)" }}
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>LOBBY</span>
            </Link>

            <Link
              to="/smart-pc"
              className="d-flex align-items-center gap-2 text-decoration-none me-1"
              title="Betwise Station"
            >
              <span className="brand-name">
                <span style={{ color: "#f5b300" }}>BET</span>
                <span style={{ color: "#ffffff" }}>WISE</span>
              </span>
            </Link>

            {/* Dedicated Station Badge */}
            <div className="station-badge d-flex align-items-center gap-2">
              <span className="online-dot" title="Station Online"></span>
              <span
                className="badge border text-light px-2 py-1 d-inline-flex align-items-center gap-1"
                style={{
                  fontSize: "0.74rem",
                  background: "rgba(94, 23, 187, 0.4)",
                  borderColor: "rgba(168, 85, 247, 0.5)",
                }}
              >
                <i className="fa-solid fa-desktop text-warning"></i> SMART PC
              </span>
              <span id="stationCodeDisplay" className="fw-bold text-light">
                {machine.name || "Smart PC-03"}
              </span>
              <span className="text-secondary">|</span>
              <span className="text-warning-subtle" id="stationShopDisplay" style={{ fontSize: "0.76rem" }}>
                {machine.shopName}
              </span>
            </div>

            {/* Game Badge */}
            <div className="d-none d-lg-flex align-items-center gap-2 ms-2">
              <span className="badge bg-dark border border-warning text-warning fw-bold px-3 py-1" style={{ fontSize: "0.78rem", letterSpacing: "0.5px" }}>
                <i className="fa-solid fa-gamepad me-1"></i> {game?.title || targetGameId}
              </span>
            </div>
          </div>

          {/* Right: Live Balance + Cash Out + Controls */}
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            {isOverrideUnlocked && (
              <span className="badge bg-warning text-dark border border-warning px-2 px-md-3 py-2 fw-bold d-inline-flex align-items-center gap-1 shadow-sm" style={{ fontSize: "0.78rem" }}>
                <i className="fa-solid fa-lock-open"></i> KEYBOARD UNLOCKED (CTRL+SHIFT+D)
              </span>
            )}
            {/* Live Balance Display (Identical to Lobby) */}
            <BalanceDisplay balance={machine.balance} onClick={handleOpenCashout} />

            {/* Cash Out Button (Identical to Lobby) */}
            <button
              type="button"
              className="btn-gold-action"
              id="btnPrimaryCashout"
              onClick={handleOpenCashout}
            >
              <i className="fa-solid fa-money-bill-transfer" id="primaryActionIcon"></i>
              <span id="primaryActionText">Cash Out</span>
            </button>

            {/* Popout Game Window */}
            <button
              type="button"
              className="btn-icon-control"
              onClick={handlePopoutWindow}
              title="Open Direct Game Window"
            >
              <i className="fa-solid fa-up-right-from-square"></i>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              className="btn-icon-control"
              onClick={toggleSound}
              title="Sound Effects"
            >
              <i className={`fa-solid ${soundEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}></i>
            </button>

            {/* Fullscreen Mode */}
            <button
              type="button"
              className="btn-icon-control"
              onClick={toggleFullscreen}
              title="Fullscreen Mode"
            >
              <i className="fa-solid fa-expand"></i>
            </button>
          </div>
        </div>
      </header>

      {/* ==============================================================
           MAIN GAME STAGE (Full Viewport Below Header)
      =============================================================== */}
      <main className="flex-grow-1 position-relative d-flex flex-column" style={{ minHeight: "calc(100vh - 75px)" }}>
        {playMode === "stream" ? (
          /* Live Provider Game Stream Stage */
          <div className="w-100 h-100 flex-grow-1 position-relative d-flex flex-column" style={{ background: "#05010e" }}>
            {isLaunching ? (
              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 py-5 text-center">
                <div className="spinner-border text-warning mb-3" style={{ width: "3rem", height: "3rem" }} role="status"></div>
                <h4 className="text-light fw-bold">Connecting to Game Stream...</h4>
                <p className="text-secondary small">Authenticating Smart PC Machine Station with {game?.provider || "Provider"}.</p>
              </div>
            ) : gameUrl && gameUrl.startsWith("http") && !gameUrl.includes("/smart-pc") && !gameUrl.includes(window.location.host) && !gameUrl.includes("staging.game-server.winbet.com") ? (
              <iframe
                src={gameUrl}
                title={game?.title || "Betwise Game Stream"}
                className="w-100 flex-grow-1 border-0"
                style={{ height: "calc(100vh - 75px)", minHeight: "560px", background: "#05010e" }}
                allow="autoplay; fullscreen; clipboard-write"
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1 p-4 text-center">
                <div className="card bg-dark border-purple-800 p-4 rounded-4 shadow-lg text-center" style={{ maxWidth: "560px" }}>
                  <img
                    src={game?.image || "/assets/games/SPRIBE/AVIATOR.png"}
                    alt={game?.title}
                    style={{ maxHeight: "140px", objectFit: "contain" }}
                    className="rounded-3 mb-3 mx-auto"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/games/SPRIBE/AVIATOR.png";
                    }}
                  />
                  <h3 className="text-warning fw-bold text-uppercase mb-1">{game?.title}</h3>
                  <span className="badge bg-purple-900 border border-purple-600 text-purple-200 mb-3 align-self-center px-3 py-1">
                    {game?.provider || "Slotegrator / Live Casino"}
                  </span>
                  <p className="text-secondary small mb-4">
                    Direct provider stream is ready. You can launch in a full standalone window or play immediately in Fast Bet mode with real-time balance sync.
                  </p>
                  <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                    <button
                      type="button"
                      className="btn btn-warning text-dark fw-bold py-2 px-4 rounded-pill d-flex align-items-center justify-content-center gap-2"
                      onClick={handlePopoutWindow}
                    >
                      <i className="fa-solid fa-up-right-from-square"></i>
                      <span>Launch In Window</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-light py-2 px-4 rounded-pill d-flex align-items-center justify-content-center gap-2"
                      onClick={() => setPlayMode("arcade")}
                    >
                      <i className="fa-solid fa-bolt text-warning"></i>
                      <span>Fast Bet Engine</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fast Bet Interactive Arcade Stage (PDF 4.7) */
          <div className="container py-4 flex-grow-1 d-flex flex-column justify-content-center" style={{ maxWidth: "700px" }}>
            <div
              className="card p-4 rounded-4 shadow-lg border-purple-800 text-center"
              style={{
                background: "radial-gradient(circle at 50% 20%, #1d0938 0%, #090217 100%)",
                border: "2px solid #7c3aed",
                boxShadow: "0 0 35px rgba(124, 58, 237, 0.35)",
              }}
            >
              {/* Game Avatar & Title */}
              <div className="mb-3">
                <img
                  src={game?.image || "/assets/games/SPRIBE/AVIATOR.png"}
                  alt={game?.title}
                  style={{ maxHeight: "130px", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.7))" }}
                  className="rounded-3"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/games/avi.png";
                  }}
                />
                <h3 className="fw-bold text-warning mt-2 mb-1 text-uppercase">{game?.title}</h3>
                <span className="badge bg-purple-900 border border-purple-600 text-purple-200">
                  <i className="fa-solid fa-bolt text-warning me-1"></i> FAST BET SMART PC ENGINE
                </span>
              </div>

              {/* Slot Reels Machine or Choice Pills */}
              {game?.category === "slots" || game?.name.includes("rush") || game?.name.includes("bonanza") ? (
                <div
                  className="reels-container p-4 mb-4 rounded-4 position-relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at 50% 50%, #15052e 0%, #06010f 100%)",
                    border: "2.5px solid #9333ea",
                    boxShadow: "0 0 30px rgba(147, 51, 234, 0.4), inset 0 15px 30px rgba(0,0,0,0.9)",
                  }}
                >
                  <div className="d-flex justify-content-center gap-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`reel-window ${isPlayingRound ? "reel-spinning" : ""}`}
                        style={{
                          width: "90px",
                          height: "115px",
                          background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #e2e8f0 100%)",
                          border: "2px solid #94a3b8",
                          borderRadius: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "3.5rem",
                          boxShadow: "0 8px 15px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.9)",
                          color: "#0f172a",
                        }}
                      >
                        <span>{slotReels[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 mb-3 rounded-4" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(147, 51, 234, 0.3)" }}>
                  <span className="text-secondary small fw-bold text-uppercase d-block mb-2">Select Your Prediction</span>
                  <div className="d-flex flex-wrap justify-content-center gap-2">
                    {choices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`btn px-3 py-2 rounded-pill fw-bold ${selectedChoice === c ? "btn-warning text-dark shadow" : "btn-outline-secondary text-light"}`}
                        style={{ minWidth: "80px" }}
                        onClick={() => setSelectedChoice(c)}
                        disabled={isPlayingRound}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Round Result Alert */}
              {roundResult && (
                <div
                  className={`alert py-3 mb-3 rounded-4 text-center border-0 ${roundResult.won ? "bg-warning text-dark" : "bg-danger text-light"}`}
                  style={{ boxShadow: roundResult.won ? "0 0 25px rgba(245, 179, 0, 0.6)" : "0 0 25px rgba(239, 68, 68, 0.4)" }}
                >
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <i className={`fa-solid ${roundResult.won ? "fa-trophy fs-3" : "fa-circle-xmark fs-3"}`}></i>
                    <div>
                      <strong className="d-block fs-5">{roundResult.message}</strong>
                      {roundResult.won && <span className="small fw-bold">+{formatCurrency(roundResult.payout)} added to balance</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Stake Controller */}
              <div
                className="d-flex align-items-center justify-content-between p-3 rounded-4 mb-3"
                style={{ background: "rgba(0, 0, 0, 0.5)", border: "1px solid rgba(147, 51, 234, 0.4)" }}
              >
                <span className="text-secondary small fw-bold text-uppercase ms-2">Bet Amount</span>
                <div className="d-flex align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-sm text-light rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px", background: "rgba(147, 51, 234, 0.4)", border: "1px solid #a855f7" }}
                    onClick={() => setStake((prev) => Math.max(10, prev - 10))}
                    disabled={isPlayingRound}
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <div className="fw-bold text-warning fs-4 text-center" style={{ minWidth: "100px" }}>
                    N$ {stake.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm text-light rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "36px", height: "36px", background: "rgba(147, 51, 234, 0.4)", border: "1px solid #a855f7" }}
                    onClick={() => setStake((prev) => Math.min(500, prev + 10))}
                    disabled={isPlayingRound}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="btn-gold-action w-100 py-3 fw-bold rounded-4 d-flex justify-content-center align-items-center gap-2"
                onClick={handlePlaceBet}
                disabled={isPlayingRound}
                style={{ fontSize: "1.2rem", letterSpacing: "1px" }}
              >
                {isPlayingRound ? (
                  <>
                    <i className="fa-solid fa-arrows-rotate fa-spin text-dark"></i>
                    <span>PLAYING ROUND...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bolt text-dark"></i>
                    <span>PLACE BET (N$ {stake.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ==============================================================
           GAME LAUNCH FAILED ERROR POPUP MODAL
      =============================================================== */}
      {launchError && (
        <div
          className="position-fixed inset-0 top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            background: "rgba(5, 1, 15, 0.88)",
            backdropFilter: "blur(12px)",
            zIndex: 1100,
            animation: "modalFadeIn 0.25s ease-out forwards",
          }}
        >
          <div
            className="card border-0 rounded-4 p-4 text-center shadow-2xl position-relative"
            style={{
              maxWidth: "520px",
              width: "100%",
              background: "radial-gradient(circle at 50% 0%, #20083d 0%, #0c0218 100%)",
              border: "1.5px solid rgba(239, 68, 68, 0.6)",
              boxShadow: "0 0 45px rgba(239, 68, 68, 0.35)",
            }}
          >
            {/* Warning Icon Badge */}
            <div
              className="d-inline-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle"
              style={{
                width: "76px",
                height: "76px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "2px solid rgba(239, 68, 68, 0.7)",
                boxShadow: "0 0 25px rgba(239, 68, 68, 0.5)",
              }}
            >
              <i className="fa-solid fa-triangle-exclamation text-danger fs-1"></i>
            </div>

            {/* Game Artwork Thumbnail */}
            {game?.image && (
              <div className="mb-2">
                <img
                  src={game.image}
                  alt={game.title}
                  style={{ maxHeight: "75px", objectFit: "contain" }}
                  className="rounded-3 shadow"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <h3 className="text-light fw-bold mb-1">Game Launch Failed</h3>
            <p className="text-secondary small mb-3">
              Unable to establish stream connection for <span className="text-warning fw-bold">{game?.title || "Game"}</span> ({game?.provider || "Live Provider"}).
            </p>

            {/* Error Message Pill */}
            <div
              className="p-3 mb-4 rounded-3 text-start d-flex align-items-start gap-2"
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
              }}
            >
              <i className="fa-solid fa-circle-exclamation text-danger mt-1"></i>
              <div className="small text-light">
                <span className="fw-bold d-block text-danger mb-1">Server Response:</span>
                <span className="font-monospace" style={{ fontSize: "0.82rem" }}>
                  {launchError}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-outline-light rounded-pill px-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                onClick={() => navigate("/smart-pc")}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Return to Lobby</span>
              </button>

              <button
                type="button"
                className="btn btn-danger rounded-pill px-4 py-2 fw-bold text-light d-flex align-items-center justify-content-center gap-2"
                onClick={initiateGameLaunch}
              >
                <i className="fa-solid fa-arrows-rotate"></i>
                <span>Retry Launch</span>
              </button>

              <button
                type="button"
                className="btn btn-warning rounded-pill px-3 py-2 fw-bold text-dark d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setLaunchError(null);
                  setPlayMode("arcade");
                }}
              >
                <i className="fa-solid fa-bolt"></i>
                <span>Play Fast Bet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Out Confirmation Modal */}
      <CashOutModal
        isOpen={isCashoutModalOpen}
        onClose={() => setIsCashoutModalOpen(false)}
        onConfirm={handleConfirmCashout}
        amount={machine.balance}
      />

      {/* Validation / Cashier Action Modals */}
      <ValidationModals
        alertType={activeAlert}
        isOpen={activeAlert !== "NONE"}
        onClose={() => setActiveAlert("NONE")}
        amount={pendingCashoutAmount}
        onSimulateApprove={handleCashierApprove}
        onSimulateReject={handleCashierReject}
      />

      {/* WinBet Theme Modal Popup (Replaces plain toast) */}
      <ThemeNotificationModal
        isOpen={Boolean(toastMessage)}
        message={toastMessage || null}
        onClose={clearToast}
      />
    </div>
  );
};
