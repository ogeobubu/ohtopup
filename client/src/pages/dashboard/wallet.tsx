import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";
import { useSelector } from "react-redux";

const Wallet = ({ data }) => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const dropdownRef = useRef(null);
  const isDarkMode = useSelector(state => state.theme.isDarkMode);

  const toggleBalanceVisibility = () => {
    setShowBalance((prev) => !prev);
  };

  const formattedBalance = showBalance
    ? (data?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "***";

  if (!data) {
    return (
      <div className="ot-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        <div className="ot-spinner" style={{ marginBottom: 16 }} />
        <p style={{ color: 'var(--ot-muted)', fontSize: 13 }}>Setting up your wallet...</p>
      </div>
    );
  }

  return (
    <div className="ot-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ot-tint)' }}>
            <span style={{ fontSize: 18 }}>💰</span>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Wallet Balance</h3>
        </div>
        <button
          onClick={toggleBalanceVisibility}
          className="ot-icon-button"
          aria-label={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 700 }}>₦</span>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{formattedBalance}</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={() => navigate("/wallet")}
          className="ot-button ot-button-primary"
          style={{ width: '100%' }}
        >
          <FaBuilding /> Manage
        </button>
      </div>
    </div>
  );
};

export default Wallet;
