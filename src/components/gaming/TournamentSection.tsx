import React, { useState, useEffect } from "react";

interface TournamentSectionProps {
  onJoinTournament?: (tournamentName: string) => void;
}

export const TournamentSection: React.FC<TournamentSectionProps> = React.memo(({ onJoinTournament }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 38 });
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleJoin = (name: string) => {
    setHasJoined(true);
    onJoinTournament?.(name);
  };

  const padZero = (num: number) => num.toString().padStart(2, "0");

  return (
    <section className="tournament-arena-section mb-5">
      <div className="section-header-bar">
        <h2 className="section-header-title">
          <i className="fa-solid fa-trophy text-warning"></i> 1860BET Daily Tournaments & Arenas
        </h2>
      </div>

      <div className="row g-4">
        {/* Tournament 1: Grand Slot Sprint */}
        <div className="col-12 col-xl-6">
          <div className="tournament-card-glass">
            <div className="tour-badge-strip">
              <span className="tour-status-live">
                <i className="fa-solid fa-circle"></i> LIVE SPRINT
              </span>
              <span className="tour-entry-free">
                <i className="fa-solid fa-ticket me-1"></i> FREE ENTRY FOR SMART PC
              </span>
            </div>

            <div className="tour-card-body">
              <div className="row align-items-center g-3">
                <div className="col-12 col-md-7">
                  <h3 className="tour-title mb-1">
                    <i className="fa-solid fa-crown text-warning me-2"></i>
                    Grand Slot Championship
                  </h3>
                  <p className="tour-subtitle mb-3">
                    Spin any Spribe or Classic Slot to score points. Top 10 players share the jackpot pool!
                  </p>

                  {/* Timer & Prize */}
                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <div className="tour-metric-pill">
                      <span className="metric-label">PRIZE POOL</span>
                      <span className="metric-val text-warning fw-bold">N$ 75,000</span>
                    </div>

                    <div className="tour-metric-pill">
                      <span className="metric-label">ENDS IN</span>
                      <span className="metric-val text-info fw-bold font-monospace">
                        {padZero(timeLeft.hours)}:{padZero(timeLeft.minutes)}:{padZero(timeLeft.seconds)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn ${hasJoined ? "btn-success" : "btn-gold-action"} px-4 py-2 fw-bold w-100 w-sm-auto`}
                    onClick={() => handleJoin("Grand Slot Championship")}
                    disabled={hasJoined}
                  >
                    {hasJoined ? (
                      <>
                        <i className="fa-solid fa-check-circle me-1"></i> ENROLLED (RANK #4)
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-flag-checkered me-1"></i> JOIN TOURNAMENT NOW
                      </>
                    )}
                  </button>
                </div>

                {/* Mini Leaderboard Preview */}
                <div className="col-12 col-md-5">
                  <div className="tour-leaderboard-box">
                    <div className="lb-title d-flex justify-content-between align-items-center mb-2">
                      <span><i className="fa-solid fa-ranking-star text-warning me-1"></i> LEADERBOARD</span>
                      <span className="small text-secondary">TOP 3</span>
                    </div>
                    <div className="lb-item rank-1">
                      <span className="lb-rank">🥇 1st</span>
                      <span className="lb-name">Player #9812</span>
                      <span className="lb-score">48,200 pts</span>
                    </div>
                    <div className="lb-item rank-2">
                      <span className="lb-rank">🥈 2nd</span>
                      <span className="lb-name">Player #3041</span>
                      <span className="lb-score">39,150 pts</span>
                    </div>
                    <div className="lb-item rank-3">
                      <span className="lb-rank">🥉 3rd</span>
                      <span className="lb-name">Player #7749</span>
                      <span className="lb-score">31,800 pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament 2: Aviator Multiplier Cup */}
        <div className="col-12 col-xl-6">
          <div className="tournament-card-glass tour-card-alt">
            <div className="tour-badge-strip">
              <span className="tour-status-live" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", borderColor: "#ef4444" }}>
                <i className="fa-solid fa-circle"></i> HIGH FLYER
              </span>
              <span className="tour-entry-free">
                <i className="fa-solid fa-plane-departure me-1"></i> CRASH & INSTANT GAMES
              </span>
            </div>

            <div className="tour-card-body">
              <div className="row align-items-center g-3">
                <div className="col-12 col-md-7">
                  <h3 className="tour-title mb-1">
                    <i className="fa-solid fa-rocket text-danger me-2"></i>
                    Aviator 100x Multiplier Hunt
                  </h3>
                  <p className="tour-subtitle mb-3">
                    Hit highest cashout multipliers on Aviator, Pilot, Balloon or Mines to climb ranks!
                  </p>

                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <div className="tour-metric-pill">
                      <span className="metric-label">PRIZE POOL</span>
                      <span className="metric-val text-warning fw-bold">N$ 35,000</span>
                    </div>

                    <div className="tour-metric-pill">
                      <span className="metric-label">ENDS IN</span>
                      <span className="metric-val text-info fw-bold font-monospace">
                        {padZero(timeLeft.hours + 2)}:{padZero(timeLeft.minutes)}:{padZero(timeLeft.seconds)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-gold-action px-4 py-2 fw-bold w-100 w-sm-auto"
                    onClick={() => handleJoin("Aviator 100x Multiplier Hunt")}
                  >
                    <i className="fa-solid fa-gamepad me-1"></i> PLAY QUALIFIER
                  </button>
                </div>

                <div className="col-12 col-md-5">
                  <div className="tour-leaderboard-box">
                    <div className="lb-title d-flex justify-content-between align-items-center mb-2">
                      <span><i className="fa-solid fa-fire text-danger me-1"></i> TOP MULTIPLIERS</span>
                      <span className="small text-secondary">MAX X</span>
                    </div>
                    <div className="lb-item rank-1">
                      <span className="lb-rank">🏆 1st</span>
                      <span className="lb-name">Player #4410</span>
                      <span className="lb-score text-success fw-bold">142.80x</span>
                    </div>
                    <div className="lb-item rank-2">
                      <span className="lb-rank">⭐ 2nd</span>
                      <span className="lb-name">Player #1829</span>
                      <span className="lb-score text-success fw-bold">98.40x</span>
                    </div>
                    <div className="lb-item rank-3">
                      <span className="lb-rank">⭐ 3rd</span>
                      <span className="lb-name">Player #9002</span>
                      <span className="lb-score text-success fw-bold">81.15x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

