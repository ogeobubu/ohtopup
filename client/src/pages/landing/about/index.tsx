import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import Navbar from "../navbar";
import Footer from "../footer";

const AboutUs = () => {
  return (
    <div className="ot-public">
      <Navbar />
      <main id="main-content">
        <section className="ot-container ot-hero">
          <div className="ot-hero-copy">
            <p className="ot-eyebrow"><span className="ot-small-line" /> ABOUT US</p>
            <h1>A simpler way to<br />take care of the essentials.</h1>
            <p className="ot-hero-description">We started OhTopUp in 2024 with a simple idea: make utility top-ups effortless and affordable for everyone.</p>
            <div className="ot-hero-actions"><Link to="/create" className="ot-button ot-button-primary">Create your account <FiArrowRight /></Link><Link to="/pricing" className="ot-text-link">Explore data plans <FiArrowUpRight /></Link></div>
          </div>
        </section>

        <section className="ot-container ot-about-body">
          <div className="ot-about-grid">
            <div>
              <p className="ot-eyebrow">OUR STORY</p>
              <h2 className="ot-about-heading">Built for everyday life in Nigeria.</h2>
              <p style={{ color: 'var(--ot-muted)', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>From airtime and data to TV and electricity, our platform delivers instant value at transparent prices. Today, thousands of customers trust OhTopUp for fast delivery, bank-grade security, and a delightful wallet experience.</p>
              <p style={{ color: 'var(--ot-muted)', fontSize: 14, lineHeight: 1.8 }}>We focus on reliability so you can focus on what matters: staying connected. Our team is customer-obsessed — we listen, ship improvements quickly, and provide 24/7 support when you need it.</p>
            </div>
            <div>
              <div className="ot-panel" style={{ marginBottom: 16 }}>
                <div className="ot-panel-heading"><h2>Why choose OhTopUp?</h2></div>
                <div style={{ padding: '0 24px 24px' }}>
                  <div className="ot-feature-row" style={{ borderTop: 'none', paddingTop: 0 }}><span>⚡</span><div><h3>Instant top-ups</h3><p>Across all major Nigerian networks.</p></div></div>
                  <div className="ot-feature-row"><span>💸</span><div><h3>Transparent pricing</h3><p>Competitive rates with no hidden fees.</p></div></div>
                  <div className="ot-feature-row"><span>🔒</span><div><h3>Bank-grade security</h3><p>Encrypted payments and secure transactions.</p></div></div>
                  <div className="ot-feature-row"><span>🕑</span><div><h3>24/7 human support</h3><p>Real people, real help, whenever you need it.</p></div></div>
                </div>
              </div>
              <div className="ot-about-stats">
                {[{ k: 'Users', v: '10k+' }, { k: 'Delivery', v: 'Instant' }, { k: 'Support', v: '24/7' }].map(s => (
                  <div key={s.k} className="ot-panel">
                    <strong>{s.v}</strong>
                    <small>{s.k}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ot-get-started"><div className="ot-container"><div><p className="ot-eyebrow">GET STARTED</p><h2>One less thing on your list.</h2></div><Link to="/create" className="ot-button ot-button-light">Create an account <FiArrowRight /></Link></div></section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
