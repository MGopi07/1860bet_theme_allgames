import React, { useRef, useState, useEffect, useCallback } from "react";
import type { GameItem } from "../../types";

interface GameCardProps {
  game: GameItem;
  onPlay: (game: GameItem) => void;
  hideTitleAndSubtitle?: boolean;
}

/**
 * Resolved secondary fallback based on provider and game keyword
 */
const getSecondaryFallback = (game: GameItem): string => {
  const n = (game.name || game.title || "").toLowerCase();
  const p = (game.provider || "").toLowerCase();
  const c = (game.category || "").toLowerCase();

  // Spribe specific games
  if (
    p.includes("spribe") ||
    c.includes("spribe") ||
    game.categories?.some((cat) => cat.toLowerCase().includes("spribe"))
  ) {
    if (n.includes("pilot")) return "/assets/games/SPRIBE/PILOT.png";
    if (n.includes("balloon") || n.includes("ballon")) return "/assets/games/SPRIBE/BALLON.png";
    if (n.includes("dice") || n.includes("odd") || n.includes("even")) return "/assets/games/SPRIBE/DICE.png";
    if (n.includes("hi-lo") || n.includes("hilo") || n.includes("hi lo") || n.includes("card")) return "/assets/games/SPRIBE/HILO.png";
    if (n.includes("hotline")) return "/assets/games/SPRIBE/HOTLINE.png";
    if (n.includes("keno80") || n.includes("keno 80") || (n.includes("keno") && n.includes("80"))) return "/assets/games/SPRIBE/KENO80.png";
    if (n.includes("keno")) return "/assets/games/SPRIBE/KENO.png";
    if (n.includes("mines") || n.includes("mine") || n.includes("bomb")) return "/assets/games/SPRIBE/MINES.png";
    if (n.includes("miniroulette") || n.includes("mini-roulette") || n.includes("roulette")) return "/assets/games/SPRIBE/MINIROULETTE.png";
    if (n.includes("plinko")) return "/assets/games/SPRIBE/PLINKO.png";
    if (n.includes("soccer") || n.includes("goal") || n.includes("kick") || n.includes("football")) return "/assets/games/SPRIBE/SOCCER.png";
    if (n.includes("trader") || n.includes("trade") || n.includes("chart")) return "/assets/games/SPRIBE/TRADER.png";
    return "/assets/games/SPRIBE/AVIATOR.png";
  }

  // Exact matching for common game types
  if (n.includes("aviator")) return "/assets/games/SPRIBE/AVIATOR.png";
  if (n.includes("plinko")) return "/assets/games/SPRIBE/PLINKO.png";
  if (n.includes("mines")) return "/assets/games/SPRIBE/MINES.png";
  if (n.includes("dice")) return "/assets/games/SPRIBE/DICE.png";
  if (n.includes("roulette")) return "/assets/games/SPRIBE/MINIROULETTE.png";
  if (n.includes("soccer") || n.includes("football")) return "/assets/games/SPRIBE/SOCCER.png";

  // General default local placeholder
  return "/assets/games/placeholder.png";
};

const GameCardComponent: React.FC<GameCardProps> = ({ game, onPlay, hideTitleAndSubtitle }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const providerName = game.provider || "Live Game";

  // Image loading & fallback lifecycle
  // stage: 0 = primary (provider URL), 1 = secondary fallback, 2 = local placeholder.png, 3 = CSS fallback
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    return game.image && game.image.trim() !== ""
      ? game.image
      : getSecondaryFallback(game);
  });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [fallbackStage, setFallbackStage] = useState<number>(() => {
    return game.image && game.image.trim() !== "" ? 0 : 1;
  });

  // Reset image state when game changes
  useEffect(() => {
    const initialUrl =
      game.image && game.image.trim() !== ""
        ? game.image
        : getSecondaryFallback(game);
    const initialStage = game.image && game.image.trim() !== "" ? 0 : 1;
    setCurrentSrc(initialUrl);
    setFallbackStage(initialStage);
    setImageLoaded(false);
  }, [game.id, game.uuid, game.image]);

  // Timeout guard for hanging external image servers (e.g. static.ga-stage.work)
  useEffect(() => {
    if (imageLoaded || fallbackStage >= 2) return;

    // Only apply timeout for external HTTP/HTTPS images
    if (currentSrc.startsWith("http://") || currentSrc.startsWith("https://")) {
      const timer = setTimeout(() => {
        if (!imageLoaded) {
          const secondary = getSecondaryFallback(game);
          if (import.meta.env.DEV) {
            console.debug(`[GameCard] External image timed out (>2.5s) for "${game.title}". Switching to fallback: ${secondary}`);
          }
          setCurrentSrc(secondary);
          setFallbackStage(1);
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [currentSrc, imageLoaded, fallbackStage, game]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    if (fallbackStage === 0) {
      const secondary = getSecondaryFallback(game);
      if (import.meta.env.DEV) {
        console.debug(`[GameCard] Provider image load failed for "${game.title}". Switching to secondary fallback: ${secondary}`);
      }
      setFallbackStage(1);
      setCurrentSrc(secondary);
    } else if (fallbackStage === 1) {
      const localPlaceholder = "/assets/games/placeholder.png";
      if (currentSrc !== localPlaceholder) {
        if (import.meta.env.DEV) {
          console.debug(`[GameCard] Secondary image failed for "${game.title}". Switching to local placeholder: ${localPlaceholder}`);
        }
        setFallbackStage(2);
        setCurrentSrc(localPlaceholder);
      } else {
        setFallbackStage(3); // CSS fallback
      }
    } else {
      setFallbackStage(3); // CSS fallback
    }
  }, [fallbackStage, game, currentSrc]);

  const rafRef = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxTilt = 6;

      const rotateX = -((y - centerY) / centerY) * maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) translateY(-4px)`;
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)";
  };


  // Determine dynamic action button text
  const getActionText = () => {
    const n = game.name.toLowerCase();
    if (n.includes("balloon")) return "INFLATE NOW";
    if (n.includes("roulette") || n.includes("spin") || n.includes("blitz") || n.includes("bonanza") || n.includes("sweet")) return "SPIN NOW";
    if (n.includes("pilot") || n.includes("aviator")) return "FLY NOW";
    if (n.includes("trader") || n.includes("trade")) return "TRADE NOW";
    if (n.includes("dice")) return "ROLL NOW";
    if (n.includes("soccer") || n.includes("goal") || n.includes("football")) return "KICK NOW";
    if (n.includes("plinko")) return "DROP NOW";
    if (n.includes("mines")) return "PLAY NOW";
    return game.actionText || "PLAY NOW";
  };

  // Determine dynamic top badge
  const getBadgeInfo = () => {
    if (game.badge) {
      return { text: game.badge.text, type: game.badge.type, icon: game.badge.icon };
    }
    const n = game.name.toLowerCase();
    if (n.includes("balloon") || n.includes("pilot")) return { text: "FUN", type: "fun", icon: "fa-solid fa-bolt" };
    if (n.includes("roulette") || n.includes("mines")) return { text: "HOT", type: "hot", icon: "fa-solid fa-fire" };
    if (n.includes("trader")) return { text: "NEW", type: "new", icon: "fa-solid fa-sparkles" };
    if (n.includes("bonanza") || n.includes("blitz")) return { text: "BONUS", type: "bonus", icon: "fa-solid fa-gift" };
    return { text: "LIVE", type: "live", icon: "fa-solid fa-circle" };
  };

  const badgeInfo = getBadgeInfo();
  const actionText = getActionText();

  return (
    <div
      className="chamfer-card-wrapper"
      data-category={game.categories?.join(" ") || game.category}
      data-name={game.name}
    >
      <div
        ref={cardRef}
        className={`chamfer-casino-card ${game.theme || "theme-gold"}`}
        onClick={() => onPlay(game)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Outer Chamfer Neon Border Wrap */}
        <div className="chamfer-border-wrap">
          <div className="chamfer-inner-deck">
            {/* Top Glowing Center Neon Stripe */}
            <div className="card-top-neon-stripe"></div>

            {/* Top Floating Badge */}
            <div className="card-top-badge-row">
              <span className={`chamfer-badge badge-${badgeInfo.type}`}>
                {badgeInfo.icon && <i className={`${badgeInfo.icon} me-1`}></i>}
                <span>{badgeInfo.text}</span>
              </span>
            </div>

            {/* Crystal-Clear Game Artwork Layer with Automatic Resilient Fallback */}
            <div className="chamfer-artwork-frame">
              {/* Shimmer skeleton while loading */}
              {!imageLoaded && fallbackStage < 3 && (
                <div className="chamfer-artwork-skeleton" />
              )}

              {/* Poster Image or Guaranteed CSS Canvas Fallback */}
              {fallbackStage < 3 ? (
                <img
                  src={currentSrc}
                  alt={game.title}
                  loading="lazy"
                  className={`chamfer-poster-img ${imageLoaded ? "loaded" : ""}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              ) : (
                <div className="chamfer-css-fallback">
                  <i
                    className="fa-solid fa-gamepad text-warning mb-2"
                    style={{
                      fontSize: "2rem",
                      filter: "drop-shadow(0 0 10px rgba(245, 179, 0, 0.6))",
                    }}
                  ></i>
                  <span
                    className="text-light fw-bold small text-uppercase"
                    style={{ letterSpacing: "0.5px" }}
                  >
                    {game.title}
                  </span>
                </div>
              )}
            </div>

            {/* Soft Bottom Shadow for 100% Crisp Typography */}
            <div className="chamfer-bottom-vignette"></div>

            {/* Bottom Content Deck with Italic Title, Gold Subtitle & Pill Button */}
            <div className="chamfer-content-deck">
              {!hideTitleAndSubtitle && (
                <>
                  <div className="chamfer-game-title" title={game.title}>
                    {game.title}
                  </div>
                  <div className="chamfer-game-subtitle">
                    {game.subtitle || `${game.category.toUpperCase()} • ${providerName.toUpperCase()}`}
                  </div>
                </>
              )}
              <button type="button" className="btn-chamfer-neon-pill" aria-label={`Play ${game.title}`}>
                <span>{actionText}</span>
                <i className="fa-solid fa-chevron-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GameCard = React.memo(GameCardComponent);

