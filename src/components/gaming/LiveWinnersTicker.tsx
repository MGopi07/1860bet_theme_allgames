import React, { useState, useEffect, useRef } from "react";

interface WinnerItem {
  id: string;
  player: string;
  game: string;
  gameImg: string;
  multiplier: string;
  amount: number;
  timeAgo: string;
}

const INITIAL_WINNERS: WinnerItem[] = [
  {
    id: "w1",
    player: "Player #7043",
    game: "Aviator",
    gameImg: "/assets/games/SPRIBE/AVIATOR.png",
    multiplier: "35.16x",
    amount: 5274.0,
    timeAgo: "Just now",
  },
  {
    id: "w2",
    player: "Player #3284",
    game: "HiLo",
    gameImg: "/assets/games/SPRIBE/HILO.png",
    multiplier: "11.29x",
    amount: 564.5,
    timeAgo: "Just now",
  },
  {
    id: "w3",
    player: "Player #8392",
    game: "Aviator",
    gameImg: "/assets/games/SPRIBE/AVIATOR.png",
    multiplier: "48.20x",
    amount: 14460.0,
    timeAgo: "12s ago",
  },
  {
    id: "w4",
    player: "Player #4102",
    game: "Mines",
    gameImg: "/assets/games/SPRIBE/MINES.png",
    multiplier: "12.50x",
    amount: 3750.0,
    timeAgo: "28s ago",
  },
  {
    id: "w5",
    player: "Player #1984",
    game: "Plinko",
    gameImg: "/assets/games/SPRIBE/PLINKO.png",
    multiplier: "29.00x",
    amount: 5800.0,
    timeAgo: "45s ago",
  },
  {
    id: "w6",
    player: "Player #7731",
    game: "Balloon",
    gameImg: "/assets/games/SPRIBE/BALLON.png",
    multiplier: "18.35x",
    amount: 4587.5,
    timeAgo: "1m ago",
  },
  {
    id: "w7",
    player: "Player #6219",
    game: "Mini Roulette",
    gameImg: "/assets/games/SPRIBE/MINIROULETTE.png",
    multiplier: "36.00x",
    amount: 9000.0,
    timeAgo: "2m ago",
  },
  {
    id: "w8",
    player: "Player #9055",
    game: "Dice",
    gameImg: "/assets/games/SPRIBE/DICE.png",
    multiplier: "24.60x",
    amount: 6150.0,
    timeAgo: "2m ago",
  },
];

const RANDOM_GAMES = [
  { name: "Aviator", img: "/assets/games/SPRIBE/AVIATOR.png" },
  { name: "Mines", img: "/assets/games/SPRIBE/MINES.png" },
  { name: "Plinko", img: "/assets/games/SPRIBE/PLINKO.png" },
  { name: "Balloon", img: "/assets/games/SPRIBE/BALLON.png" },
  { name: "HiLo", img: "/assets/games/SPRIBE/HILO.png" },
  { name: "Goal / Soccer", img: "/assets/games/SPRIBE/SOCCER.png" },
  { name: "Trader", img: "/assets/games/SPRIBE/TRADER.png" },
];

export const LiveWinnersTicker: React.FC = React.memo(() => {
  const [winners, setWinners] = useState<WinnerItem[]>(INITIAL_WINNERS);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomGame = RANDOM_GAMES[Math.floor(Math.random() * RANDOM_GAMES.length)];
      const randomPlayerNum = Math.floor(1000 + Math.random() * 9000);
      const randomMulti = (2 + Math.random() * 35).toFixed(2);
      const baseBet = [20, 50, 100, 150, 200][Math.floor(Math.random() * 5)];
      const wonAmount = baseBet * parseFloat(randomMulti);

      const newWinner: WinnerItem = {
        id: `w-${Date.now()}`,
        player: `Player #${randomPlayerNum}`,
        game: randomGame.name,
        gameImg: randomGame.img,
        multiplier: `${randomMulti}x`,
        amount: wonAmount,
        timeAgo: "Just now",
      };

      setWinners((prev) => [newWinner, ...prev.slice(0, 9)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="live-winners-ticker-wrap mb-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 px-1">
        <div className="d-flex align-items-center gap-2">
          <span className="live-pulse-dot"></span>
          <span className="live-ticker-header-title">
            <i className="fa-solid fa-bolt text-warning me-1"></i>
            LIVE RECENT WINNERS FEED
          </span>
          <span className="badge bg-warning text-dark fw-bold rounded-pill px-2 py-1 ms-1" style={{ fontSize: "0.65rem" }}>
            REAL TIME
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="text-secondary small d-none d-md-flex align-items-center gap-1 me-2">
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Updating live</span>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-light rounded-circle p-0 d-flex align-items-center justify-content-center"
            style={{ width: "26px", height: "26px", borderColor: "rgba(139, 92, 246, 0.4)" }}
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: "0.7rem" }}></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-light rounded-circle p-0 d-flex align-items-center justify-content-center"
            style={{ width: "26px", height: "26px", borderColor: "rgba(139, 92, 246, 0.4)" }}
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
          >
            <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem" }}></i>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="winners-marquee-container"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          overflowX: "auto",
        }}
      >
        <div className="winners-marquee-row">
          {winners.map((winner) => (
            <div key={winner.id} className="winner-chip-card">
              <div className="winner-thumb-wrap">
                <img
                  src={winner.gameImg}
                  alt={winner.game}
                  onError={(e) => {
                    e.currentTarget.src = "/assets/games/1.png";
                  }}
                />
              </div>
              <div className="winner-meta">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <span className="winner-player-tag">{winner.player}</span>
                  <span className="winner-multi-badge">{winner.multiplier}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
                  <span className="winner-amount">
                    N$ {winner.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="winner-time">{winner.timeAgo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

