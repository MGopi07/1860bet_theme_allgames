import React from "react";
import { shop } from "../../constants/machine";

interface ShopLocationProps {
  shopName?: string;
  location?: string;
  className?: string;
}

export const ShopLocation: React.FC<ShopLocationProps> = ({
  shopName = shop.name,
  className = "",
}) => {
  return (
    <div className={`brand-security-seal ${className}`}>
      <div className="gold-seal-ring">
        <i className="fa-solid fa-store"></i>
      </div>
      <div>
        <div className="fw-bold text-light" style={{ fontSize: "0.85rem" }}>
          {shopName}
        </div>
      </div>
    </div>
  );
};
