import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import Navbar from "../navbar";
import Footer from "../footer";
import { getPricing } from "../../../api";
import dstv from "../../../assets/dstv.png";
import mtn from "../../../assets/mtn.png";
import glo from "../../../assets/glo.png";
import airtel from "../../../assets/airtel.svg";
import nineMobile from "../../../assets/9mobile.svg";
import defaultNetworkImage from "../../../assets/default-network.png";

const imageMap: Record<string, string> = {
  mtn,
  MTN: mtn,
  glo,
  Glo: glo,
  airtel,
  Airtel: airtel,
  '9mobile': nineMobile,
  '9MOBILE': nineMobile,
  dstv,
  DSTV: dstv,
};

const formatPrice = (amount: number) => `₦${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const primaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark nav:gap-4 nav:px-[19px] nav:text-sm';
const secondaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-line bg-paper px-[15px] py-[11px] text-[13px] font-semibold text-ink transition hover:bg-tint nav:gap-4 nav:px-[19px] nav:text-sm';
const lightBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-white px-[15px] py-[11px] text-[13px] font-semibold text-[#18232d] transition hover:bg-[#e9edfa] nav:gap-4 nav:px-[19px] nav:text-sm';
const textLink = 'inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4 nav:text-sm nav:gap-4';
const eyebrow = 'mb-[22px] text-[9px] font-semiboldish tracking-[1.4px] leading-relaxed nav:text-[10px] nav:tracking-[1.7px]';
const field = 'min-h-[46px] rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
const empty = 'rounded-lg border border-line bg-paper p-12 text-center';

const DataPricing = () => {
  const { data: pricingPlans, error, isLoading } = useQuery({ queryKey: ["pricing"], queryFn: getPricing });
  const [search, setSearch] = useState("");
  const [network, setNetwork] = useState("all");
  const [sort, setSort] = useState("name");

  const plans = pricingPlans?.data ?? [];
  const filtered = useMemo(() => {
    const byNetwork = network === "all" ? plans : plans.filter((p) => p.network.toLowerCase().startsWith(network.toLowerCase()));
    const bySearch = search ? byNetwork.filter((p) => [p.name, p.planId, p.network, p.planType].some((t) => String(t || '').toLowerCase().includes(search.toLowerCase()))) : byNetwork;
    return [...bySearch].sort((a, b) => sort === "price" ? Number(a.finalPrice || a.price) - Number(b.finalPrice || b.price) : String(a.name).localeCompare(String(b.name)));
  }, [plans, search, network, sort]);

  return (
    <div className="min-w-0 overflow-wrap-anywhere bg-paper text-ink">
      <Navbar />
      <main id="main-content">
        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 items-center gap-7 px-4 py-10 nav:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] nav:gap-[clamp(28px,5vw,72px)] nav:px-10 nav:py-[clamp(48px,7vw,104px)]">
          <div className="min-w-0">
            <p className={eyebrow}><span className="mr-3 inline-block h-px w-[26px] bg-current align-middle" /> DATA PRICING</p>
            <h1 className="m-0 text-[clamp(28px,8.5vw,34px)] font-mediumish leading-[1.15] tracking-[-0.03em] overflow-wrap-anywhere xs:text-[49px] xs:tracking-[-2.4px] nav:text-[clamp(36px,5vw,66px)] nav:leading-[1.12] nav:tracking-[-0.045em]">
              Find the right plan<br />for your day.
            </h1>
            <p className="my-0 mb-5 mt-4 max-w-[425px] text-sm leading-relaxed text-muted nav:mb-[29px] nav:mt-[26px] nav:text-[clamp(15px,1.5vw,17px)] nav:leading-[1.8]">
              Browse affordable data plans across all major Nigerian networks. Compare prices and find what works for you.
            </p>
            <div className="flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:gap-[18px] nav:gap-[25px]">
              <Link to="/create" className={primaryBtn}>Create your account <FiArrowRight className="shrink-0" /></Link>
              <Link to="/about" className={textLink}>Learn about us <FiArrowUpRight className="shrink-0" /></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto box-border w-full max-w-app px-4 pb-24 nav:px-10">
          {isLoading ? (
            <div className={empty} role="status"><p className="text-muted">Loading data plans…</p></div>
          ) : error ? (
            <div className={empty}>
              <h3 className="mb-2 text-lg font-semibold">We couldn&apos;t load pricing data.</h3>
              <p className="mb-4 text-sm text-muted">{(error as Error).message || 'Please try again later.'}</p>
              <button className={secondaryBtn} onClick={() => window.location.reload()}>Try again</button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-wrap items-center gap-2.5">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plan name or code"
                  className={`${field} min-w-0 flex-[1_1_200px] max-w-[280px]`}
                />
                <select value={network} onChange={(e) => setNetwork(e.target.value)} className={`${field} flex-[0_1_160px]`}>
                  <option value="all">All Networks</option>
                  <option value="mtn">MTN</option>
                  <option value="glo">Glo</option>
                  <option value="airtel">Airtel</option>
                  <option value="9mobile">9mobile</option>
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${field} flex-[0_1_160px]`}>
                  <option value="name">Sort: Name</option>
                  <option value="price">Sort: Price</option>
                </select>
                <span className="text-xs text-muted">{filtered.length} plans</span>
              </div>

              <div className="grid grid-cols-1 gap-4 min-w-0 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                {filtered.map((plan) => {
                  const imageSrc = imageMap[plan.network] || defaultNetworkImage;
                  return (
                    <div key={plan.id} className="min-w-0 overflow-hidden rounded-lg border border-line bg-paper p-6 text-center">
                      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line p-1">
                        <img src={imageSrc} alt={plan.network} className="h-full w-full object-contain" />
                      </div>
                      <h3 className="mb-2 text-sm font-semibold">{plan.name}</h3>
                      <div className="mb-4">
                        <p className="text-lg font-bold">{formatPrice(Math.round(plan.finalPrice) || Math.round(plan.price))}</p>
                        {plan.commissionRate > 0 && (
                          <p className="mt-1 text-[11px] text-success dark:text-success-dark">{plan.commissionRate}% commission</p>
                        )}
                      </div>
                      <div className="flex justify-center gap-2">
                        <Link
                          to="/create"
                          className="inline-flex min-h-auto items-center justify-center rounded-md border border-transparent bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dark"
                        >
                          Select
                        </Link>
                        <Link
                          to="/create"
                          className="inline-flex min-h-auto items-center justify-center rounded-md border border-line bg-paper px-4 py-2 text-xs font-semibold text-ink transition hover:bg-tint"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="bg-night py-8 text-white nav:py-14">
          <div className="mx-auto box-border flex w-full max-w-app flex-col items-start gap-4 px-4 nav:flex-row nav:items-center nav:justify-between nav:gap-[30px] nav:px-10">
            <div>
              <p className="mb-3 text-[9px] font-semiboldish tracking-[1.4px] text-[#b6c5d4] nav:text-[10px] nav:tracking-[1.7px]">READY TO START?</p>
              <h2 className="m-0 text-[26px] font-medium tracking-[-0.5px] nav:text-[34px] nav:tracking-[-1px]">One less thing on your list.</h2>
            </div>
            <Link to="/create" className={lightBtn}>Create an account <FiArrowRight className="shrink-0" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DataPricing;
