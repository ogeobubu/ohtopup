import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiWifi, FiSmartphone, FiZap, FiTv, FiArrowUpRight, FiCheck } from 'react-icons/fi';
import Navbar from './navbar';
import Footer from './footer';

const services = [
  { name: 'Data', icon: FiWifi, title: 'Stay connected.', description: 'Find a data plan for your network and your day.', networks: ['MTN', 'Airtel', 'Glo', '9mobile'], action: 'Browse data plans', href: '/pricing' },
  { name: 'Airtime', icon: FiSmartphone, title: 'Keep the conversation going.', description: 'Top up your number or send airtime to someone else.', networks: ['MTN', 'Airtel', 'Glo', '9mobile'], action: 'Get started', href: '/create' },
  { name: 'Electricity', icon: FiZap, title: 'Take care of home.', description: 'Pay your electricity bill and keep the transaction in one place.', networks: ['Prepaid', 'Postpaid'], action: 'Get started', href: '/create' },
  { name: 'TV', icon: FiTv, title: 'Make time for your favourites.', description: 'Manage your TV subscription alongside your other everyday payments.', networks: ['DStv', 'GOtv', 'StarTimes'], action: 'Get started', href: '/create' },
];
const questions = [
  ['What can I pay for?', 'OhTopUp supports mobile data, airtime, electricity and TV subscriptions. Available plans and providers are shown before you purchase.'],
  ['How do I get started?', 'Create an account, verify your email and set your transaction PIN. You can then fund your wallet and choose a service.'],
  ['What if a payment is pending?', 'Check the transaction in your account before making another purchase. Pending purchases are checked with the provider; a confirmed failed purchase is refunded to your wallet.'],
];

const primaryBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-accent px-[15px] py-[11px] text-[13px] font-semibold text-white transition-[background,border-color] hover:bg-accent-dark nav:gap-4 nav:px-[19px] nav:text-sm';
const lightBtn = 'inline-flex min-h-[46px] items-center justify-center gap-3 rounded-md border border-transparent bg-white px-[15px] py-[11px] text-[13px] font-semibold text-[#18232d] transition hover:bg-[#e9edfa] nav:gap-4 nav:px-[19px] nav:text-sm';
const textLink = 'inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-accent hover:underline hover:underline-offset-4 nav:text-sm nav:gap-4';
const eyebrow = 'mb-[22px] text-[9px] font-semiboldish tracking-[1.4px] leading-relaxed nav:text-[10px] nav:tracking-[1.7px]';

export default function HomePage() {
  const [selected, setSelected] = useState(0);
  const service = services[selected];
  return (
    <div className="min-w-0 overflow-wrap-anywhere bg-paper text-ink">
      <Navbar />
      <main id="main-content">
        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 items-center gap-7 px-4 py-10 xs:gap-8 nav:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] nav:gap-[clamp(28px,5vw,72px)] nav:px-10 nav:py-[clamp(48px,7vw,104px)]">
          <div className="min-w-0">
            <p className={eyebrow}><span className="mr-3 inline-block h-px w-[26px] bg-current align-middle" /> EVERYDAY PAYMENTS, SIMPLIFIED</p>
            <h1 className="m-0 text-[clamp(28px,8.5vw,34px)] font-mediumish leading-[1.15] tracking-[-0.03em] overflow-wrap-anywhere xs:text-[49px] xs:tracking-[-2.4px] nav:text-[clamp(36px,5vw,66px)] nav:leading-[1.12] nav:tracking-[-0.045em]">
              A little less admin.<br /><span className="text-muted">A lot more life.</span>
            </h1>
            <p className="my-0 mb-5 mt-4 max-w-[425px] text-sm leading-relaxed text-muted nav:mb-[29px] nav:mt-[26px] nav:text-[clamp(15px,1.5vw,17px)] nav:leading-[1.8]">
              Data, airtime and household bills. Take care of the essentials in one place, and get on with your day.
            </p>
            <div className="flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:gap-[18px] nav:gap-[25px]">
              <Link to="/create" className={primaryBtn}>Create your account <FiArrowRight className="shrink-0" /></Link>
              <Link to="/pricing" className={textLink}>Explore data plans <FiArrowUpRight className="shrink-0" /></Link>
            </div>
            <p className="mt-6 text-[10px] leading-relaxed text-muted nav:mt-[34px] nav:text-xs">For your phone. For your home. For the people you care about.</p>
          </div>

          <div className="box-border w-full min-w-0 max-w-none rounded-preview border border-line bg-warm p-3 nav:max-w-none nav:p-[clamp(17px,2vw,22px)]">
            <div className="mb-5 flex flex-wrap justify-between gap-3 text-[9px] font-semibold tracking-[0.5px] text-muted nav:text-[10px] nav:tracking-[1px]">
              <span>ONE ACCOUNT. YOUR EVERYDAY ESSENTIALS.</span><span>01 — 04</span>
            </div>
            <div className="mb-3.5 grid grid-cols-2 gap-1 nav:grid-cols-4 nav:gap-0.5" role="tablist" aria-label="Explore services">
              {services.map((item, i) => (
                <button
                  key={item.name}
                  id={`service-tab-${i}`}
                  role="tab"
                  aria-selected={i === selected}
                  aria-controls="service-panel"
                  tabIndex={i === selected ? 0 : -1}
                  onClick={() => setSelected(i)}
                  onKeyDown={e => {
                    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
                      e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
                      setSelected(next); document.getElementById(`service-tab-${next}`)?.focus();
                    }
                  }}
                  className={[
                    'flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[4px] border-none bg-transparent p-2 text-[11px] text-muted',
                    'nav:min-h-16 nav:p-[13px_3px] nav:text-xs',
                    i === selected ? 'bg-paper text-accent shadow-[0_1px_3px_rgba(0,0,0,0.04)]' : '',
                  ].join(' ')}
                >
                  <item.icon className="text-lg" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
            <div id="service-panel" role="tabpanel" aria-labelledby={`service-tab-${selected}`} className="box-border min-w-0 rounded-md border border-line bg-paper px-4 pt-4 nav:px-[clamp(16px,2vw,25px)] nav:pt-7">
              <div className="mb-4 text-accent nav:mb-[22px]">
                <service.icon aria-hidden="true" className="h-9 w-9 stroke-[1.4]" />
              </div>
              <h2 className="m-0 text-lg font-mediumish leading-tight tracking-[-0.65px] nav:min-h-[58px] nav:text-2xl">{service.title}</h2>
              <p className="mb-4 mt-2 text-xs leading-relaxed text-muted nav:mb-[21px] nav:min-h-[46px] nav:text-[13px] nav:leading-[1.7]">{service.description}</p>
              <div className="flex flex-wrap gap-1.5 pb-5 nav:pb-[26px]">
                {service.networks.map(name => <span key={name} className="rounded border border-line px-[7px] py-1 text-[9px] font-mediumish nav:text-[10px] nav:px-2.5 nav:py-[5px]">{name}</span>)}
              </div>
              <Link className="flex items-center justify-between border-t border-line py-[18px] text-xs font-semibold text-accent hover:underline" to={service.href}>
                {service.action}<FiArrowRight className="shrink-0" />
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-muted">
              <FiCheck className="shrink-0 text-accent" /><span>Review your details before every payment.</span>
            </div>
          </div>
        </section>

        <section className="border-y border-line" aria-label="Services">
          <div className="mx-auto box-border grid w-full max-w-app grid-cols-1 px-4 xs:grid-cols-2 nav:grid-cols-4 nav:px-10">
            {services.map(s => (
              <div key={s.name} className="flex min-w-0 items-center justify-center gap-3 box-border border-b border-line px-2 py-4 text-[11px] font-medium last:border-b-0 xs:border-b-0 xs:border-r xs:last:border-r-0 nav:py-[27px] nav:px-3 nav:text-[13px] [&:nth-child(-n+2)]:border-b xs:[&:nth-child(-n+2)]:border-b-0">
                <s.icon className="h-[19px] w-[19px] shrink-0 text-muted" />
                <span>{s.name === 'Data' ? 'Mobile data' : s.name === 'TV' ? 'TV subscriptions' : s.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 gap-8 px-4 py-12 nav:grid-cols-2 nav:gap-[clamp(32px,7vw,100px)] nav:px-10 nav:py-[clamp(48px,7vw,96px)]">
          <div className="min-w-0">
            <p className={eyebrow}>LESS TO KEEP TRACK OF</p>
            <h2 className="mb-[22px] text-[28px] font-medium leading-tight tracking-[-1.3px] nav:text-4xl">Your everyday payments.<br />One clear view.</h2>
            <p className="mb-6 max-w-[350px] text-sm leading-[1.8] text-muted">From a quick top-up to the monthly electricity bill, keep your payments and their details together.</p>
            <Link className={textLink} to="/create">Get started <FiArrowUpRight className="shrink-0" /></Link>
          </div>
          <div className="min-w-0">
            {[
              ['01', 'Know what you’re paying.', 'See your selected plan, recipient and cost before you confirm.'],
              ['02', 'Follow every payment.', 'Find transaction details, payment status and electricity tokens in your account.'],
              ['03', 'Get help with the details.', 'Raise a support request when you need help with a transaction.'],
            ].map(([number, title, body]) => (
              <div className="flex min-w-0 gap-6 border-t border-line py-[23px]" key={number}>
                <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted">{number}</span>
                <div>
                  <h3 className="mb-[7px] text-base font-semibold">{title}</h3>
                  <p className="text-[13px] leading-[1.8] text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-night py-10 text-white nav:py-14">
          <div className="mx-auto box-border flex w-full max-w-app flex-col items-start gap-5 px-4 nav:flex-row nav:items-center nav:justify-between nav:gap-[30px] nav:px-10">
            <div>
              <p className="mb-3 text-[9px] font-semiboldish tracking-[1.4px] text-[#b6c5d4] nav:text-[10px] nav:tracking-[1.7px]">A SIMPLER ROUTINE STARTS HERE</p>
              <h2 className="m-0 text-[26px] font-medium tracking-[-0.5px] nav:text-[34px] nav:tracking-[-1px]">One less thing on your list.</h2>
            </div>
            <Link to="/create" className={lightBtn}>Create an account <FiArrowRight className="shrink-0" /></Link>
          </div>
        </section>

        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 gap-7 px-4 py-10 nav:grid-cols-2 nav:gap-[clamp(32px,7vw,100px)] nav:px-10 nav:py-[85px]">
          <div className="min-w-0">
            <p className={eyebrow}>GOOD TO KNOW</p>
            <h2 className="mb-[22px] text-[28px] font-medium leading-tight tracking-[-1.3px] nav:text-4xl">A few useful answers.</h2>
            <Link to="/tutorials" className={textLink}>Visit the help centre <FiArrowUpRight className="shrink-0" /></Link>
          </div>
          <div className="min-w-0">
            {questions.map(([q, a]) => (
              <details key={q} className="border-b border-line py-[19px] first:border-t first:border-t-line">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 text-[13px] font-mediumish nav:text-sm">
                  {q}<span aria-hidden="true" className="text-xl leading-none text-muted transition-transform">+</span>
                </summary>
                <p className="mt-4 text-[13px] leading-[1.8] text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
