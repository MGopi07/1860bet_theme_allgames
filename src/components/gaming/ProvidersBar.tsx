import React from "react";

interface ProvidersBarProps {
  selectedProvider?: string;
  onSelectProvider?: (providerId: string) => void;
}

const PROVIDERS = [
  { id: "all", name: "All Studios", icon: "fa-solid fa-layer-group", count: "40+ Games" },
  { id: "spribe", name: "SPRIBE", icon: "fa-solid fa-gamepad text-danger", count: "13 Games", isPopular: true },
  { id: "pragmatic", name: "Pragmatic Play", icon: "fa-solid fa-crown text-warning", count: "15 Games" },
  { id: "evolution", name: "Evolution Live", icon: "fa-solid fa-video text-info", count: "8 Tables" },
  { id: "netent", name: "NetEnt Classics", icon: "fa-solid fa-gem text-success", count: "12 Slots" },
  { id: "1860bet", name: "1860BET Originals", icon: "fa-solid fa-shield-cat text-warning", count: "Exclusive", isPopular: true },
];

export const ProvidersBar: React.FC<ProvidersBarProps> = ({
  selectedProvider = "all",
  onSelectProvider,
}) => {
  return (
    <section className="providers-showcase-section mb-5">
      <div className="section-header-bar">
        <h2 className="section-header-title">
          <i className="fa-solid fa-microchip text-info"></i> Official Gaming Studios & Providers
        </h2>
        <span className="badge bg-dark border border-secondary text-secondary small px-3 py-1 rounded-pill">
          CERTIFIED LICENSED SOFTWARE
        </span>
      </div>

      <div className="providers-carousel-wrap">
        <div className="providers-grid-row">
          {PROVIDERS.map((prov) => {
            const isSelected = selectedProvider === prov.id;
            return (
              <div
                key={prov.id}
                className={`provider-chip-card ${isSelected ? "active" : ""}`}
                onClick={() => onSelectProvider?.(prov.id)}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className={`${prov.icon} fs-5`}></i>
                  <span className="provider-name">{prov.name}</span>
                  {prov.isPopular && (
                    <span
                      className="badge px-1 py-0 fw-bold"
                      style={{
                        fontSize: "0.55rem",
                        background: "linear-gradient(135deg, #FF9431 0%, #F5831F 100%)",
                        color: "#ffffff",
                      }}
                    >
                      TOP
                    </span>
                  )}
                </div>
                <div className="provider-meta d-flex justify-content-between align-items-center">
                  <span className="provider-count text-secondary small">{prov.count}</span>
                  <i className="fa-solid fa-chevron-right text-secondary small"></i>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
