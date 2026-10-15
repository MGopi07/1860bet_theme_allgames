import React from "react";

interface SmartPCHelpBarProps {
  machineName?: string;
  shopName?: string;
}

export const SmartPCHelpBar: React.FC<SmartPCHelpBarProps> = React.memo(({ 
  machineName = "Smart PC",
  shopName = "Central Shop"
}) => {
  return (
    <section className="smart-pc-help-banner mb-4 p-4 rounded-4">
      <div className="row align-items-center g-4">
        <div className="col-12 col-lg-8">
          <div className="d-flex align-items-center gap-3">
            <div className="help-icon-glow">
              <i className="fa-solid fa-headset fs-3" style={{ color: "#FF9431" }}></i>
            </div>
            <div>
              <h4 className="text-light fw-bold mb-1" style={{ fontSize: "1.1rem" }}>
                Need Help or Cash Balance Top-Up?
              </h4>
              <p className="text-secondary small mb-0" style={{ lineHeight: "1.4" }}>
                Approach the {shopName} Cashier Counter with your Smart PC Machine Number (<strong style={{ color: "#FF9431" }}>{machineName}</strong>) for instant deposit, session top-up, or cashout assistance.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2">
            <div className="trust-pill">
              <i className="fa-solid fa-shield-check text-success"></i>
              <span>CERTIFIED FAIR RNG</span>
            </div>
            <div className="trust-pill">
              <i className="fa-solid fa-bolt" style={{ color: "#FF9431" }}></i>
              <span>INSTANT PAYOUTS</span>
            </div>
            <div className="trust-pill">
              <i className="fa-solid fa-lock text-info"></i>
              <span>MACHINE  ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

