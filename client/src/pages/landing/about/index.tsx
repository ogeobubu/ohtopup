import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import Navbar from "../navbar";
import Footer from "../footer";

const primaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-accent-dark nav:gap-4 nav:px-[19px] nav:text-sm';
const lightBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-white px-[15px] py-[11px] text-[13px] font-semibold text-[#18232d] transition hover:bg-[#e9edfa] nav:gap-4 nav:px-[19px] nav:text-sm';
const textLink = 'inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4 nav:text-sm nav:gap-4';
const eyebrow = 'mb-[22px] text-[9px] font-semiboldish tracking-[1.4px] leading-relaxed nav:text-[10px] nav:tracking-[1.7px]';
const bodyText = 'mb-5 text-sm leading-[1.8] text-muted';

const AboutUs = () => {
  return (
    <div className="min-w-0 overflow-wrap-anywhere bg-paper text-ink">
      <Navbar />
      <main id="main-content">
        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 items-center gap-7 px-4 py-10 nav:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] nav:gap-[clamp(28px,5vw,72px)] nav:px-10 nav:py-[clamp(48px,7vw,104px)]">
          <div className="min-w-0">
            <p className={eyebrow}><span className="mr-3 inline-block h-px w-[26px] bg-current align-middle" /> ABOUT US</p>
            <h1 className="m-0 text-[clamp(28px,8.5vw,34px)] font-mediumish leading-[1.15] tracking-[-0.03em] overflow-wrap-anywhere xs:text-[49px] xs:tracking-[-2.4px] nav:text-[clamp(36px,5vw,66px)] nav:leading-[1.12] nav:tracking-[-0.045em]">
              A simpler way to<br />take care of the essentials.
            </h1>
            <p className="my-0 mb-5 mt-4 max-w-[425px] text-sm leading-relaxed text-muted nav:mb-[29px] nav:mt-[26px] nav:text-[clamp(15px,1.5vw,17px)] nav:leading-[1.8]">
              We started OhTopUp in 2024 with a simple idea: make utility top-ups effortless and affordable for everyone.
            </p>
            <div className="flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:gap-[18px] nav:gap-[25px]">
              <Link to="/create" className={primaryBtn}>Create your account <FiArrowRight className="shrink-0" /></Link>
              <Link to="/pricing" className={textLink}>Explore data plans <FiArrowUpRight className="shrink-0" /></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto box-border w-full max-w-app px-4 pb-12 nav:px-10 nav:pb-24">
          <div className="grid min-w-0 grid-cols-1 gap-8 nav:grid-cols-2 nav:gap-[clamp(32px,7vw,100px)]">
            <div className="min-w-0">
              <p className={eyebrow}>OUR STORY</p>
              <h2 className="mb-[22px] text-[clamp(26px,5vw,36px)] font-medium leading-tight tracking-[-1.3px]">Built for everyday life in Nigeria.</h2>
              <p className={bodyText}>From airtime and data to TV and electricity, our platform delivers instant value at transparent prices. Today, thousands of customers trust OhTopUp for fast delivery, bank-grade security, and a delightful wallet experience.</p>
              <p className="text-sm leading-[1.8] text-muted">We focus on reliability so you can focus on what matters: staying connected. Our team is customer-obsessed — we listen, ship improvements quickly, and provide 24/7 support when you need it.</p>
            </div>
            <div className="min-w-0">
              <div className="mb-4 overflow-hidden rounded-lg border border-line bg-paper">
                <div className="flex flex-wrap items-center justify-between gap-[15px] p-5 nav:p-[22px_24px]">
                  <h2 className="text-[15px] font-semibold tracking-[-0.2px]">Why choose OhTopUp?</h2>
                </div>
                <div className="px-5 pb-5 nav:px-6 nav:pb-6">
                  {[
                    ['⚡', 'Instant top-ups', 'Across all major Nigerian networks.'],
                    ['💸', 'Transparent pricing', 'Competitive rates with no hidden fees.'],
                    ['🔒', 'Bank-grade security', 'Encrypted payments and secure transactions.'],
                    ['🕑', '24/7 human support', 'Real people, real help, whenever you need it.'],
                  ].map(([icon, title, body], idx) => (
                    <div className={`flex gap-6 py-[23px] min-w-0 ${idx === 0 ? 'pt-0' : 'border-t border-line'}`} key={title}>
                      <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted">{icon}</span>
                      <div>
                        <h3 className="mb-[7px] text-base font-semibold">{title}</h3>
                        <p className="text-[13px] leading-[1.8] text-muted">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 min-w-0">
                {[{ k: 'Users', v: '10k+' }, { k: 'Delivery', v: 'Instant' }, { k: 'Support', v: '24/7' }].map(s => (
                  <div key={s.k} className="min-w-0 overflow-hidden rounded-lg border border-line bg-paper p-3 text-center nav:p-5">
                    <strong className="block text-base font-bold text-accent nav:text-[22px]">{s.v}</strong>
                    <small className="mt-1 block text-[11px] text-muted">{s.k}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-night py-8 text-white nav:py-14">
          <div className="mx-auto box-border flex w-full max-w-app flex-col items-start gap-4 px-4 nav:flex-row nav:items-center nav:justify-between nav:gap-[30px] nav:px-10">
            <div>
              <p className="mb-3 text-[9px] font-semiboldish tracking-[1.4px] text-[#b6c5d4] nav:text-[10px] nav:tracking-[1.7px]">GET STARTED</p>
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

export default AboutUs;
