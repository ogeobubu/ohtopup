import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import Navbar from "../navbar";
import Footer from "../footer";

const sections: [string, string][] = [
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

const textLink = 'inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4 nav:text-sm nav:gap-4';
const eyebrow = 'mb-[22px] text-[9px] font-semiboldish tracking-[1.4px] leading-relaxed nav:text-[10px] nav:tracking-[1.7px]';
const panel = 'mb-4 min-w-0 overflow-hidden rounded-lg border border-line bg-paper';
const panelHeading = 'flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 nav:p-[22px_24px]';
const panelBody = 'px-5 pb-5 text-sm leading-[1.8] text-muted nav:px-6 nav:pb-6';

const Terms = () => {
  return (
    <div className="min-w-0 overflow-wrap-anywhere bg-paper text-ink">
      <Navbar />
      <main id="main-content">
        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 items-center gap-7 px-4 py-10 nav:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] nav:gap-[clamp(28px,5vw,72px)] nav:px-10 nav:py-[clamp(48px,7vw,104px)]">
          <div className="min-w-0">
            <p className={eyebrow}><span className="mr-3 inline-block h-px w-[26px] bg-current align-middle" /> LEGAL</p>
            <h1 className="m-0 text-[clamp(28px,8.5vw,34px)] font-mediumish leading-[1.15] tracking-[-0.03em] overflow-wrap-anywhere xs:text-[49px] xs:tracking-[-2.4px] nav:text-[clamp(36px,5vw,66px)] nav:leading-[1.12] nav:tracking-[-0.045em]">
              Terms and<br />Conditions.
            </h1>
            <p className="my-0 mb-5 mt-4 max-w-[425px] text-sm leading-relaxed text-muted nav:mb-[29px] nav:mt-[26px] nav:text-[clamp(15px,1.5vw,17px)] nav:leading-[1.8]">
              Please read these terms carefully before using OhTopUp.
            </p>
            <div className="flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:gap-[18px] nav:gap-[25px]">
              <Link to="/about" className={textLink}>Learn more about us <FiArrowUpRight className="shrink-0" /></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto box-border w-full max-w-[720px] px-4 pb-24 nav:px-10">
          <p className="mb-8 text-xs text-muted"><strong>Last Updated:</strong> April 27, 2025</p>

          {sections.map(([title, body], i) => (
            <div key={i} className={panel}>
              <div className={panelHeading}>
                <h2 className="text-[15px] font-semibold tracking-[-0.2px]">{`${i + 1}. ${title}`}</h2>
              </div>
              <p className={panelBody}>{body}</p>
            </div>
          ))}

          <div className={panel}>
            <div className={panelHeading}>
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">10. Referral Program</h2>
            </div>
            <div className={panelBody}>
              <p className="mb-4">
                OhTopUp offers a referral program where users can earn rewards by referring new users to our platform. By participating, you agree to the following:
              </p>
              <ul className="m-0 list-none p-0">
                {referralTerms.map((term, i) => (
                  <li
                    key={i}
                    className={`flex gap-6 min-w-0 ${i === 0 ? '' : 'border-t border-line pt-[23px] mt-[23px]'}`}
                  >
                    <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted">{`0${i + 1}`}</span>
                    <div><p className="text-sm leading-[1.8] text-ink">{term}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={panel}>
            <div className={panelHeading}>
              <h2 className="text-[15px] font-semibold tracking-[-0.2px]">11. Governing Law</h2>
            </div>
            <p className={panelBody}>
              These Terms and Conditions are governed by the laws of Nigeria. Any disputes will be resolved in accordance with applicable Nigerian law.
            </p>
          </div>

          <div className="mb-4">
            <div className={panel} style={{ marginBottom: 0 }}>
              <div className={panelHeading}>
                <h2 className="text-[15px] font-semibold tracking-[-0.2px]">12. Contact Us</h2>
              </div>
              <p className={panelBody}>
                For any questions or concerns regarding these Terms and Conditions, please contact us at{" "}
                <a href="mailto:ohtopup@gmail.com" className="text-accent hover:underline">ohtopup@gmail.com</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
