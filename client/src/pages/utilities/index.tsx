import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import Airtime from "./airtime";
import Data from "./data";
import Cable from "./cable";
import Electricity from "./electricity";
import { Link, useSearchParams } from "react-router-dom";
import { FiSmartphone, FiWifi, FiZap, FiTv } from "react-icons/fi";
import { formatNairaAmount } from "../../utils";
import { getWallet } from "../../api";

const Settings = () => {
  const [params, setParams] = useSearchParams();
  const tabs = [
    ["airtime", "Airtime", FiSmartphone],
    ["data", "Data", FiWifi],
    ["electricity", "Electricity", FiZap],
    ["tv", "TV", FiTv],
  ] as const;
  const activeTab = tabs.some(([id]) => id === params.get("id")) ? params.get("id") : "airtime";
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: getWallet });

  return (
    <div className="min-w-0">
      <div className="mb-[30px] flex min-w-0 flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-[22px] font-mediumish leading-tight tracking-[-0.5px] nav:text-[30px] nav:tracking-[-0.9px]">
            Make a payment
          </h1>
          <p className="text-[13px] text-muted">Choose an everyday essential to get started.</p>
        </div>
      </div>
      <div>
        <nav className="mb-5 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-6 border-b border-line" aria-label="Payment services">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-pressed={activeTab === id}
              onClick={() => setParams({ id })}
              className={[
                "-mb-px flex min-h-11 items-center justify-center gap-1.5 border-b-2 sm:justify-start pb-3 text-xs font-mediumish transition-colors",
                activeTab === id ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
              ].join(" ")}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <div className="grid min-w-0 items-start gap-5 nav:grid-cols-[minmax(0,680px)_minmax(220px,1fr)]">
          <div className="min-w-0 nav:col-start-1 nav:row-start-1">
          {activeTab === "airtime" && <Airtime />}
          {activeTab === "data" && <Data />}
          {activeTab === "tv" && <Cable isDarkMode={isDarkMode} />}
          {activeTab === "electricity" && <Electricity isDarkMode={isDarkMode} />}
          </div>
          <aside className="order-first rounded-lg border border-line bg-paper p-4 nav:order-none nav:col-start-2 nav:row-start-1 nav:p-5" aria-label="Payment wallet">
            <div className="flex flex-wrap items-center justify-between gap-3 nav:block">
              <div><p className="text-xs text-muted">Available balance</p><p className="mt-1 text-xl font-semibold tabular-nums">{wallet.isPending ? 'Loading…' : wallet.isError ? 'Unavailable' : formatNairaAmount(wallet.data?.balance ?? 0)}</p></div>
              {wallet.isError ? <button type="button" onClick={() => wallet.refetch()} className="min-h-11 text-xs font-semibold text-accent">Try again</button> : <Link to="/wallet" className="inline-flex min-h-11 items-center text-xs font-semibold text-accent hover:underline nav:mt-3">Add money →</Link>}
            </div>
            <p className="mt-3 hidden border-t border-line pt-4 text-xs leading-relaxed text-muted nav:block">Check the recipient and final wallet debit before confirming. Your PIN authorizes the payment.</p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Settings;
