import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import type { GameItem } from "../../types";
import { api } from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";

interface GameLauncherModalProps {
  game: GameItem | null;
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onBalanceChange?: (newBalance: number) => void;
  showToast?: (message: string) => void;
}

export const GameLauncherModal: React.FC<GameLauncherModalProps> = ({
  game,
  isOpen,
  onClose,
  balance,
  onBalanceChange,
  showToast,
}) => {
  if (!game || !isOpen) return null;

  // View mode: Provider Iframe vs Local Arcade Bet
  const isProviderGame = game.kind === "provider" || game.category === "crash" || game.categories.includes("spribe") || game.categories.includes("featured");
  const [viewMode, setViewMode] = useState<"iframe" | "arcade">(isProviderGame ? "iframe" : "arcade");
  
  // Live Provider Launch State (PDF Section 4.6)
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Local Game Choice & Bet State (PDF Section 4.7)
  const [selectedChoice, setSelectedChoice] = useState<string>("RED");
  const [stake, setStake] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<{
    won: boolean;
    result: string;
    payout: number;
    message: string;
  } | null>(null);

  // Slot Reel State
  const [slotReels, setSlotReels] = useState(["💎", "7️⃣", "👑"]);
  const slotSymbols = ["🍒", "🍋", "🍇", "💎", "👑", "⚡", "7️⃣"];

  // Choices map based on PDF 4.7
  const getChoicesForGame = () => {
    const name = game.name.toLowerCase();
    if (name.includes("coin") || name.includes("flip")) return ["HEADS", "TAILS"];
    if (name.includes("hilo") || name.includes("hi_lo")) return ["HI", "LO"];
    if (name.includes("soccer") || name.includes("goal")) return ["LEFT", "CENTER", "RIGHT"];
    if (name.includes("dice")) return ["1", "2", "3", "4", "5", "6"];
    if (name.includes("odd") || name.includes("even")) return ["ODD", "EVEN"];
    if (name.includes("roulette")) return ["RED", "BLACK", "GREEN"];
    if (name.includes("card") || name.includes("suit")) return ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];
    if (name.includes("wheel") || name.includes("lucky_wheel")) return ["A", "B", "C", "D", "E"];
    if (name.includes("nine") || name.includes("lucky_nine")) return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    return ["RED", "BLACK"];
  };

  const choices = getChoicesForGame();

  useEffect(() => {
    if (choices.length > 0 && !choices.includes(selectedChoice)) {
      setSelectedChoice(choices[0]);
    }
  }, [game?.id, choices, selectedChoice]);

  // Launch provider game on open if provider game (PDF 4.6)
  useEffect(() => {
    let isMounted = true;
    if (isProviderGame && isOpen) {
      setIsLaunching(true);
      setLaunchError(null);
      api
        .launchProviderGame(game.uuid || game.id || game.name)
        .then((res) => {
          if (isMounted) {
            setGameUrl(res.game_url);
            setIsLaunching(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setLaunchError(err instanceof Error ? err.message : "Error launching game");
            setIsLaunching(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [game?.id, isProviderGame, isOpen]);

  const handlePlaceBet = async () => {
    if (isPlaying) return;
    if (balance < stake) {
      showToast?.("Insufficient Balance! Please load chips at cashier desk.");
      return;
    }

    setIsPlaying(true);
    setGameResult(null);

    // If local slot machine
    if (game.category === "slots" || game.name.includes("rush") || game.name.includes("bonanza") || game.name.includes("olympus")) {
      if (onBalanceChange) onBalanceChange(balance - stake);

      setTimeout(() => {
        setSlotReels([slotSymbols[Math.floor(Math.random() * slotSymbols.length)], slotReels[1], slotReels[2]]);
      }, 350);

      setTimeout(() => {
        setSlotReels((prev) => [prev[0], slotSymbols[Math.floor(Math.random() * slotSymbols.length)], prev[2]]);
      }, 700);

      setTimeout(() => {
        const lastSymbol = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
        setSlotReels((prev) => [prev[0], prev[1], lastSymbol]);

        const won = Math.random() > 0.45;
        const multi = won ? [1.5, 2.0, 3.5, 5.0, 10.0][Math.floor(Math.random() * 5)] : 0;
        const payout = stake * multi;

        if (won && onBalanceChange) {
          onBalanceChange(balance - stake + payout);
        }

        setGameResult({
          won,
          result: lastSymbol,
          payout,
          message: won ? `Big Win! ${multi}X Multiplier awarded!` : "No match this spin. Try again!",
        });
        setIsPlaying(false);
      }, 1100);
      return;
    }

    // PDF 4.7 Local Bet via live API
    try {
      const res = await api.placeBet(game.name, selectedChoice, stake);
      const won = res.won;
      const payout = res.payout;

      if (onBalanceChange) {
        onBalanceChange(res.current_balance);
      }

      setGameResult({
        won,
        result: res.result,
        payout,
        message: res.message || (won ? `WIN! Result was ${res.result}. Won ${formatCurrency(payout)}!` : `Result was ${res.result}. You lost ${formatCurrency(stake)}.`),
      });
      setIsPlaying(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error placing bet";
      showToast?.(errorMessage);
      setIsPlaying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={viewMode === "iframe" ? "820px" : "560px"}>
      <div className="game-launcher-box p-3 p-md-4 text-center">
        {/* Game Title & Header Bar */}
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: "rgba(245, 131, 31, 0.3)" }}>
          <div className="text-start pe-3">
            <h3 className="fw-bold text-warning mb-1" style={{ fontSize: "1.35rem", letterSpacing: "1px", textTransform: "uppercase" }}>
              {game.title}
            </h3>
            <div className="d-flex align-items-center gap-2">
              <span className="badge" style={{ fontSize: "0.68rem", background: "rgba(245, 131, 31, 0.2)", border: "1px solid #F5831F", color: "#FDF3E3" }}>
                <i className="fa-solid fa-gamepad me-1"></i> {game.provider || "1860BET"}
              </span>
              <span className="badge" style={{ fontSize: "0.68rem", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#6ee7b7" }}>
                <i className="fa-solid fa-circle text-success me-1" style={{ fontSize: "0.45rem" }}></i> LIVE SESSION
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="px-3 py-1 rounded-pill border fw-bold small" style={{ background: "rgba(245, 131, 31, 0.15)", borderColor: "rgba(245, 131, 31, 0.5)", color: "#FF9431" }}>
              {formatCurrency(balance)}
            </div>
          </div>
        </div>

        {/* View Mode 1: Provider Live Iframe (PDF 4.6) */}
        {viewMode === "iframe" ? (
          <div className="provider-iframe-container mb-3 position-relative rounded-4 overflow-hidden border border-warning border-opacity-25" style={{ minHeight: "420px", background: "#0C0805" }}>
            {isLaunching ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: "400px" }}>
                <div className="spinner-border text-warning mb-3" role="status"></div>
                <h5 className="text-light fw-bold">Authenticating Smart PC Token...</h5>
                <p className="text-secondary small">Connecting to {game.provider || "Game Provider"} live game engine.</p>
              </div>
            ) : launchError ? (
              <div className="p-4 text-center">
                <div className="alert alert-warning py-3 mb-3">
                  <i className="fa-solid fa-triangle-exclamation fs-3 mb-2 d-block text-warning"></i>
                  <strong>Game Stream Note</strong>: {launchError}
                </div>
                <p className="text-light small">You can also use Fast Bet Arcade mode on this Smart PC.</p>
                <button type="button" className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-pill" onClick={() => setViewMode("arcade")}>
                  Switch to Fast Bet
                </button>
              </div>
            ) : (
              <iframe
                src={gameUrl || "about:blank"}
                title={game.title}
                className="w-100 rounded-4"
                style={{ height: "460px", border: "none" }}
                allow="autoplay; fullscreen"
              />
            )}
          </div>
        ) : (
          /* View Mode 2: Fast Bet Arcade Stage */
          <>
            {game.category === "slots" || game.name.includes("rush") || game.name.includes("bonanza") || game.name.includes("olympus") ? (
              /* Slot Reels Machine View */
              <div
                className="reels-container p-4 mb-4 rounded-4 position-relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 50% 50%, #1f140b 0%, #0a0704 100%)",
                  border: "2.5px solid #FF9B42",
                  boxShadow: "0 0 25px rgba(245, 131, 31, 0.4), inset 0 15px 30px rgba(0,0,0,0.8)",
                }}
              >
                <div className="d-flex justify-content-center gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`reel-window ${isPlaying ? "reel-spinning" : ""}`}
                      style={{
                        width: "85px",
                        height: "105px",
                        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #e2e8f0 100%)",
                        border: "2px solid #94a3b8",
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "3.2rem",
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
              /* Arcade / Local Game Arena (PDF 4.7) */
              <div
                className="arcade-stage p-4 mb-4 rounded-4 position-relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 50% 50%, #2A170A 0%, #0C0805 100%)",
                  border: "2px solid rgba(245, 179, 0, 0.45)",
                  boxShadow: "0 0 25px rgba(245, 179, 0, 0.25), inset 0 10px 25px rgba(0,0,0,0.8)",
                }}
              >
                <div className="mb-3 text-center">
                  <img
                    src={game.image}
                    alt={game.title}
                    style={{ maxHeight: "110px", objectFit: "contain", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6))" }}
                    className="rounded-3"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/games/avi.png";
                    }}
                  />
                </div>

                {/* Choice Selector Pills */}
                <div className="mb-2">
                  <span className="text-secondary small fw-bold text-uppercase d-block mb-2">Select Your Prediction</span>
                  <div className="d-flex flex-wrap justify-content-center gap-2">
                    {choices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`btn btn-sm px-3 py-2 rounded-pill fw-bold ${
                          selectedChoice === c ? "btn-warning text-dark shadow" : "btn-outline-secondary text-light"
                        }`}
                        style={{ minWidth: "75px" }}
                        onClick={() => setSelectedChoice(c)}
                        disabled={isPlaying}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Win / Result Banner */}
            {gameResult && (
              <div
                className={`alert py-3 mb-3 rounded-4 text-center border-0 ${
                  gameResult.won ? "bg-warning text-dark" : "bg-danger text-light"
                }`}
                style={{
                  boxShadow: gameResult.won ? "0 0 25px rgba(245, 179, 0, 0.6)" : "0 0 25px rgba(239, 68, 68, 0.4)",
                }}
              >
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <i className={`fa-solid ${gameResult.won ? "fa-trophy fs-3" : "fa-circle-xmark fs-3"}`}></i>
                  <div>
                    <strong className="d-block fs-5">{gameResult.message}</strong>
                    {gameResult.won && <span className="small fw-bold">+{formatCurrency(gameResult.payout)} added to balance</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Stake Controls (PDF 4.7 min stake 10) */}
            <div
              className="d-flex align-items-center justify-content-between p-3 rounded-4 mb-3"
              style={{ background: "rgba(0, 0, 0, 0.45)", border: "1px solid rgba(245, 131, 31, 0.35)" }}
            >
              <span className="text-secondary small fw-bold text-uppercase ms-2">Bet Amount</span>
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  className="btn btn-sm text-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "34px", height: "34px", background: "rgba(245, 131, 31, 0.25)", border: "1px solid #F5831F" }}
                  onClick={() => setStake((prev) => Math.max(10, prev - 10))}
                  disabled={isPlaying}
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <div className="fw-bold text-warning fs-4 text-center" style={{ minWidth: "90px" }}>
                  N$ {stake.toFixed(2)}
                </div>
                <button
                  type="button"
                  className="btn btn-sm text-light rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "34px", height: "34px", background: "rgba(245, 131, 31, 0.25)", border: "1px solid #F5831F" }}
                  onClick={() => setStake((prev) => Math.min(500, prev + 10))}
                  disabled={isPlaying}
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            {/* Play / Spin Action Button */}
            <button
              type="button"
              className="btn-gold-action w-100 py-3 fw-bold rounded-4 d-flex justify-content-center align-items-center gap-2"
              onClick={handlePlaceBet}
              disabled={isPlaying}
              style={{ fontSize: "1.15rem", letterSpacing: "1px" }}
            >
              {isPlaying ? (
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
          </>
        )}
      </div>
    </Modal>
  );
};
