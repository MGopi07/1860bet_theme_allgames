import React from "react";

interface VipPromotionsSectionProps {
  onClaimPromo?: (promoTitle: string) => void;
  onOpenCashout?: () => void;
}

export const VipPromotionsSection: React.FC<VipPromotionsSectionProps> = React.memo(({
  onClaimPromo,
  onOpenCashout,
}) => {
  const PROMOS = [
    {
      id: "reload",
      icon: "fa-solid fa-gift",
      iconColor: "#f5b300",
      tag: "DAILY BONUS",
      tagClass: "bg-warning text-dark",
      title: "100% Reload Bonus",
      desc: "Top up your session with the cashier and double your initial credits up to N$ 1,000!",
      actionText: "CLAIM AT CASHIER",
      actionType: "claim",
    },
    {
      id: "cashback",
      icon: "fa-solid fa-shield-halved",
      iconColor: "#22c55e",
      tag: "VIP SHIELD",
      tagClass: "bg-success text-light",
      title: "15% Weekly Rebate",
      desc: "Automatic cash protection. Get 15% cashback returned directly to your Smart PC balance every Monday.",
      actionText: "VIP ACTIVATED",
      actionType: "vip",
    },
    {
      id: "cashout-desk",
      icon: "fa-solid fa-money-bill-wave",
      iconColor: "#a855f7",
      tag: "FAST PAYOUT",
      tagClass: "bg-purple text-light",
      title: "Instant Desk Cashout",
      desc: "Click Cash Out at any time. Your session balance is locked and instantly paid in cash at the counter.",
      actionText: "REQUEST CASHOUT",
      actionType: "cashout",
    },
    {
      id: "highroller",
      icon: "fa-solid fa-gem",
      iconColor: "#38bdf8",
      tag: "HIGH ROLLER",
      tagClass: "bg-info text-dark",
      title: "Exclusive High Stakes Club",
      desc: "Unlocked higher spin limits up to N$ 500 per spin with dedicated VIP shop assistance.",
      actionText: "VIEW PRIVILEGES",
      actionType: "claim",
    },
  ];

  return (
    <section className="vip-promos-section mb-5">
      <div className="section-header-bar">
        <h2 className="section-header-title">
          <i className="fa-solid fa-award text-warning"></i> Smart PC VIP Club & Cashier Perks
        </h2>
        <span className="badge bg-dark border border-warning text-warning px-3 py-1 rounded-pill" style={{ fontSize: "0.75rem" }}>
          <i className="fa-solid fa-star me-1"></i> MEMBERSHIP ACTIVE
        </span>
      </div>

      <div className="row g-4">
        {PROMOS.map((promo) => (
          <div key={promo.id} className="col-12 col-sm-6 col-xl-3">
            <div className="vip-promo-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div
                    className="vip-icon-box"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1.5px solid ${promo.iconColor}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      color: promo.iconColor,
                      boxShadow: `0 0 15px ${promo.iconColor}22`,
                    }}
                  >
                    <i className={promo.icon}></i>
                  </div>
                  <span className={`badge ${promo.tagClass} fw-bold`} style={{ fontSize: "0.68rem", letterSpacing: "0.5px" }}>
                    {promo.tag}
                  </span>
                </div>

                <h4 className="vip-promo-title mb-2 text-light fw-bold" style={{ fontSize: "1.05rem" }}>
                  {promo.title}
                </h4>
                <p className="vip-promo-desc text-secondary small mb-3" style={{ lineHeight: "1.45" }}>
                  {promo.desc}
                </p>
              </div>

              <button
                type="button"
                className={`btn btn-sm ${
                  promo.actionType === "cashout"
                    ? "btn-outline-warning"
                    : promo.actionType === "vip"
                    ? "btn-outline-success"
                    : "btn-outline-primary text-light"
                } rounded-pill py-2 w-100 fw-semibold`}
                style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}
                onClick={() => {
                  if (promo.actionType === "cashout") {
                    onOpenCashout?.();
                  } else {
                    onClaimPromo?.(promo.title);
                  }
                }}
              >
                {promo.actionText}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

