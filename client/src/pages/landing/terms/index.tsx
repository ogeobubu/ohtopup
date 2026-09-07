import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import Navbar from "../navbar";
import Footer from "../footer";

const sections = [
  ['Acceptance of Terms', 'By accessing or using the OhTopUp website and services, you agree to comply with these Terms and Conditions. If you do not agree, please do not use our services.'],
  ['Services', 'OhTopUp provides affordable digital utility services tailored for cost-conscious users. We aim to help you save on your monthly utility expenses.'],
  ['User Accounts', 'Users must create an account to access certain features. You are responsible for maintaining the confidentiality of your account information and for all activities under your account. Notify us immediately of any unauthorized use of your account.'],
  ['Payment Terms', 'All payments for services are due at the time of purchase. We accept various payment methods, which may be subject to change. Prices may vary based on service providers and currency fluctuations.'],
  ['Cancellation and Refund Policy', 'Users can cancel their subscriptions at any time through their account settings. Refunds will be processed according to our refund policy, which is subject to review based on the circumstances.'],
  ['User Responsibilities', 'You agree not to use our services for any illegal or unauthorized purposes. You must comply with all applicable laws and regulations while using our services.'],
  ['Intellectual Property', 'All content on the OhTopUp website, including logos, text, graphics, and software, is the property of OhTopUp or its licensors and is protected by copyright and trademark laws.'],
  ['Limitation of Liability', 'OhTopUp shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use our services.'],
  ['Changes to Terms', 'We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on the website. Your continued use of the services constitutes acceptance of the revised terms.'],
];

const referralTerms = [
  'Referrers earn 500 points when their referred users make their first deposit of ₦1,000 or more.',
  'Referral codes are unique and must be used during the signup process.',
  'Only the first qualifying deposit (₦1,000+) per referred user will trigger the reward.',
  'Points earned through referrals can be redeemed for cash equivalent based on our redemption policy.',
  'Referral rewards are subject to verification and may be withheld if fraudulent activity is suspected.',
  'OhTopUp reserves the right to modify or terminate the referral program at any time.',
];

const Terms = () => {
  return (
    <div className="ot-public">
      <Navbar />
      <main id="main-content">
        <section className="ot-container ot-hero">
          <div className="ot-hero-copy">
            <p className="ot-eyebrow"><span className="ot-small-line" /> LEGAL</p>
            <h1>Terms and<br />Conditions.</h1>
            <p className="ot-hero-description">Please read these terms carefully before using OhTopUp.</p>
            <div className="ot-hero-actions"><Link to="/about" className="ot-text-link">Learn more about us <FiArrowUpRight /></Link></div>
          </div>
        </section>

        <section className="ot-container" style={{ paddingBottom: 98, maxWidth: 720 }}>
          <p style={{ fontSize: 12, color: 'var(--ot-muted)', marginBottom: 32 }}><strong>Last Updated:</strong> April 27, 2025</p>

          {sections.map(([title, body], i) => (
            <div key={i} className="ot-panel" style={{ marginBottom: 16 }}>
              <div className="ot-panel-heading"><h2>{`${i + 1}. ${title}`}</h2></div>
              <p style={{ padding: '0 24px 24px', fontSize: 14, lineHeight: 1.8, color: 'var(--ot-muted)' }}>{body}</p>
            </div>
          ))}

          <div className="ot-panel" style={{ marginBottom: 16 }}>
            <div className="ot-panel-heading"><h2>10. Referral Program</h2></div>
            <div style={{ padding: '0 24px 24px' }}>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ot-muted)', marginBottom: 16 }}>OhTopUp offers a referral program where users can earn rewards by referring new users to our platform. By participating, you agree to the following:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {referralTerms.map((term, i) => (
                  <li key={i} className="ot-feature-row" style={{ borderTop: i === 0 ? 'none' : undefined, paddingTop: i === 0 ? 0 : undefined }}><span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--ot-muted)', paddingTop: 4 }}>{`0${i + 1}`}</span><div><p style={{ fontSize: 14, lineHeight: 1.8 }}>{term}</p></div></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ot-panel" style={{ marginBottom: 16 }}>
            <div className="ot-panel-heading"><h2>11. Governing Law</h2></div>
            <p style={{ padding: '0 24px 24px', fontSize: 14, lineHeight: 1.8, color: 'var(--ot-muted)' }}>These Terms and Conditions are governed by the laws of Nigeria. Any disputes will be resolved in accordance with applicable Nigerian law.</p>
          </div>

          <div className="ot-panel">
            <div className="ot-panel-heading"><h2>12. Contact Us</h2></div>
            <p style={{ padding: '0 24px 24px', fontSize: 14, lineHeight: 1.8, color: 'var(--ot-muted)' }}>For any questions or concerns regarding these Terms and Conditions, please contact us at <a href="mailto:ohtopup@gmail.com" style={{ color: 'var(--ot-accent)' }}>ohtopup@gmail.com</a>.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
