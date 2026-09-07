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

const imageMap = { mtn, MTN: mtn, glo, Glo: glo, airtel, Airtel: airtel, '9mobile': nineMobile, '9MOBILE': nineMobile, dstv, DSTV: dstv };

const formatPrice = (amount) => `₦${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

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
    <div className="ot-public">
      <Navbar />
      <main id="main-content">
        <section className="ot-container ot-hero">
          <div className="ot-hero-copy">
            <p className="ot-eyebrow"><span className="ot-small-line" /> DATA PRICING</p>
            <h1>Find the right plan<br />for your day.</h1>
            <p className="ot-hero-description">Browse affordable data plans across all major Nigerian networks. Compare prices and find what works for you.</p>
            <div className="ot-hero-actions"><Link to="/create" className="ot-button ot-button-primary">Create your account <FiArrowRight /></Link><Link to="/about" className="ot-text-link">Learn about us <FiArrowUpRight /></Link></div>
          </div>
        </section>

        <section className="ot-container" style={{ paddingBottom: 98 }}>
          {isLoading ? (
            <div className="ot-empty" role="status"><p>Loading data plans…</p></div>
          ) : error ? (
            <div className="ot-empty"><h3>We couldn't load pricing data.</h3><p>{error.message || 'Please try again later.'}</p><button className="ot-button ot-button-secondary" onClick={() => window.location.reload()}>Try again</button></div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32, alignItems: 'center' }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plan name or code" className="ot-field" style={{ flex: '1 1 200px', maxWidth: 280 }} />
                <select value={network} onChange={(e) => setNetwork(e.target.value)} className="ot-field" style={{ flex: '0 1 160px' }}>
                  <option value="all">All Networks</option>
                  <option value="mtn">MTN</option>
                  <option value="glo">Glo</option>
                  <option value="airtel">Airtel</option>
                  <option value="9mobile">9mobile</option>
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="ot-field" style={{ flex: '0 1 160px' }}>
                  <option value="name">Sort: Name</option>
                  <option value="price">Sort: Price</option>
                </select>
                <span style={{ fontSize: 12, color: 'var(--ot-muted)' }}>{filtered.length} plans</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {filtered.map((plan) => {
                  const imageSrc = imageMap[plan.network] || defaultNetworkImage;
                  return (
                    <div key={plan.id} className="ot-panel" style={{ padding: 24, textAlign: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--ot-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', padding: 4 }}>
                        <img src={imageSrc} alt={plan.network} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{plan.name}</h3>
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 18, fontWeight: 700 }}>{formatPrice(Math.round(plan.finalPrice) || Math.round(plan.price))}</p>
                        {plan.commissionRate > 0 && <p style={{ fontSize: 11, color: '#27805d', marginTop: 4 }}>{plan.commissionRate}% commission</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <Link to="/create" className="ot-button ot-button-primary" style={{ fontSize: 12, padding: '8px 16px', minHeight: 'auto' }}>Select</Link>
                        <Link to="/create" className="ot-button ot-button-secondary" style={{ fontSize: 12, padding: '8px 16px', minHeight: 'auto' }}>Details</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="ot-get-started"><div className="ot-container"><div><p className="ot-eyebrow">READY TO START?</p><h2>One less thing on your list.</h2></div><Link to="/create" className="ot-button ot-button-light">Create an account <FiArrowRight /></Link></div></section>
      </main>
      <Footer />
    </div>
  );
};

export default DataPricing;
