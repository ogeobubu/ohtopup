import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaBuilding } from "react-icons/fa";

const primaryBtn =
  "inline-flex min-h-[46px] w-full items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark";

const Wallet = ({ data }: { data?: any }) => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  const formattedBalance = showBalance
    ? (data?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "***";

  if (!data) {
    return (
      <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-lg border border-line bg-paper p-6">
        <div className="mb-4 h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="text-[13px] text-muted">Setting up your wallet...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-paper p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint">
            <span className="text-lg">💰</span>
          </div>
          <h3 className="m-0 text-[15px] font-semibold">Wallet Balance</h3>
        </div>
        <button
          onClick={() => setShowBalance((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-tint hover:text-ink"
          aria-label={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">₦</span>
          <span className="text-2xl font-bold tabular-nums">{formattedBalance}</span>
        </div>
      </div>

      <div className="mt-auto">
        <button onClick={() => navigate("/wallet")} className={primaryBtn}>
          <FaBuilding /> Manage
        </button>
      </div>
    </div>
  );
};

export default Wallet;
