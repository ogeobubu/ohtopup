import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPricing } from '../../api';
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
  ['Can I see data prices before signing up?', 'Yes. Browse our data pricing page without an account. Compare the network, plan and price, then create an account when you are ready to buy.'],
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
  const { data: pricing, isLoading, isError, refetch } = useQuery({ queryKey: ['pricing'], queryFn: getPricing });
  const plans = (Array.isArray(pricing?.data) ? pricing.data : [])
    .filter(plan => {
      const name = String(plan.name || '');
      const price = Number(plan.finalPrice ?? plan.price);
      return Number.isFinite(price) && price > 0
        && /\d+(?:\.\d+)?\s*(?:MB|GB|TB)\b/i.test(name)
        && !/\b(?:voice|minutes?|talk|airtime)\b/i.test(`${name} ${plan.planType || ''}`);
    })
    .slice(0, 3);
  return (
    <div className="min-w-0 overflow-wrap-anywhere bg-paper text-ink">
      <Navbar />
      <main id="main-content">
        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 items-center gap-7 px-4 py-10 xs:gap-8 nav:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] nav:gap-[clamp(28px,5vw,72px)] nav:px-10 nav:py-[clamp(48px,7vw,104px)]">
          <div className="min-w-0">
            <p className={eyebrow}><span className="mr-3 inline-block h-px w-[26px] bg-current align-middle" /> DATA, AIRTIME & BILLS • NIGERIA</p>
            <h1 className="m-0 text-[clamp(28px,8.5vw,34px)] font-mediumish leading-[1.15] tracking-[-0.03em] overflow-wrap-anywhere xs:text-[49px] xs:tracking-[-2.4px] nav:text-[clamp(36px,5vw,66px)] nav:leading-[1.12] nav:tracking-[-0.045em]">
              Your next top-up.<br /><span className="text-accent">One less thing<br />to think about.</span>
            </h1>
            <p className="my-0 mb-5 mt-4 max-w-[425px] text-sm leading-relaxed text-muted nav:mb-[29px] nav:mt-[26px] nav:text-[clamp(15px,1.5vw,17px)] nav:leading-[1.8]">
              Buy data for yourself or someone you care about. Top up airtime, pay electricity and renew TV — with the details of every payment in one place.
            </p>
            <div className="flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:gap-[18px] nav:gap-[25px]">
              <Link to="/pricing" className={primaryBtn}>Browse data plans <FiArrowRight className="shrink-0" /></Link>
              <Link to="/create" className={textLink}>Create an account <FiArrowUpRight className="shrink-0" /></Link>
            </div>
            <p className="mt-6 text-[10px] leading-relaxed text-muted nav:mt-[34px] nav:text-xs">See data prices before you sign up. Choose when you’re ready.</p>
          </div>

          <div className="box-border w-full min-w-0 max-w-none rounded-preview border border-line bg-warm p-3 nav:max-w-none nav:p-[clamp(17px,2vw,22px)]">
            <div className="mb-5 flex flex-wrap justify-between gap-3 text-[9px] font-semibold tracking-[0.5px] text-muted nav:text-[10px] nav:tracking-[1px]">
              <span>WHAT’S ON YOUR LIST?</span><span>0{selected + 1} — 04</span>
            </div>
            <div className="mb-3.5 grid grid-cols-4 gap-1 nav:gap-0.5" role="tablist" aria-label="Explore services">
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
                    'flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[4px] border-none px-1 py-2 text-[10px]',
                    'nav:min-h-16 nav:p-[13px_3px] nav:text-xs',
                    i === selected ? 'bg-paper text-accent shadow-[0_1px_3px_rgba(0,0,0,0.04)]' : 'bg-transparent text-muted hover:text-ink',
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

        <section aria-labelledby="plans-heading" className="border-b border-line bg-tint">
          <div className="mx-auto max-w-app px-4 py-8 nav:px-10 nav:py-16">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={eyebrow}>START WITH YOUR NEXT DATA PLAN</p>
                <h2 id="plans-heading" className="text-[28px] font-medium leading-tight tracking-[-1px] nav:text-4xl">Find your next data plan.</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">Current prices. Browse all plans for full details and options.</p>
              </div>
              <Link to="/pricing" className={textLink}>See all data plans <FiArrowUpRight /></Link>
            </div>
            {isLoading ? (
              <p role="status" className="rounded-lg border border-line bg-paper p-6 text-sm text-muted">Loading current data plans…</p>
            ) : isError ? (
              <div className="rounded-lg border border-line bg-paper p-6">
                <p className="mb-3 text-sm text-muted">We couldn’t load current prices. Please try again.</p>
                <button type="button" onClick={() => refetch()} className={textLink}>Retry loading plans <FiArrowRight /></button>
              </div>
            ) : plans.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {plans.map(plan => {
                  const name = String(plan.name || '').trim();
                  const allowance = plan.dataLimit && plan.dataLimit !== 'Unknown' ? plan.dataLimit : '';
                  const title = allowance || name;
                  const validity = plan.validity !== 'Unknown' ? plan.validity : '';
                  const details = [validity, plan.planType].filter(Boolean).join(' · ');
                  return (
                    <article key={plan.id || plan.planId} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-paper p-4 md:flex md:flex-col md:items-stretch md:p-6">
                      <div className="min-w-0">
                        <p className="mb-2 text-xs font-semibold text-accent">{plan.network}</p>
                        <h3 className="text-sm font-semibold leading-relaxed md:text-lg">{title}</h3>
                        {details && <p className="mt-1 text-xs leading-relaxed text-muted">{details}</p>}
                        {title !== name && <p className="mt-2 text-xs leading-relaxed text-muted">{name}</p>}
                      </div>
                      <p className="text-lg font-semibold tracking-tight md:my-4 md:text-3xl">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(Number(plan.finalPrice ?? plan.price))}</p>
                      <Link to="/pricing" className={`${textLink} col-span-2 md:mt-auto md:border-t md:border-line md:pt-4`}>View plan details <FiArrowRight /></Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-line bg-paper p-6 text-sm text-muted">No data plans are available right now. Please check again later.</p>
            )}
          </div>
        </section>

        <section aria-labelledby="getting-started" className="mx-auto max-w-app px-4 py-9 nav:px-10 nav:py-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={eyebrow}>HOW IT WORKS</p>
              <h2 id="getting-started" className="text-[28px] font-medium leading-tight tracking-[-1px] nav:text-4xl">Your first top-up, step by step.</h2>
            </div>
            <Link className={textLink} to="/create">Get started <FiArrowUpRight /></Link>
          </div>
          <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
            {[
              ['01', 'Create your account', 'Verify your email and set your transaction PIN.'],
              ['02', 'Fund and choose', 'Review an available funding method, fund your wallet and choose your service.'],
              ['03', 'Check, pay and track', 'Confirm the recipient and cost. Find the payment status, details and support in your account.'],
            ].map(([step, title, description]) => (
              <li key={step} className="flex gap-4 border-t border-line pt-4 md:block"><span className="w-6 shrink-0 whitespace-nowrap pt-1 text-xs font-semibold tabular-nums text-accent">{step}</span><div className="min-w-0"><h3 className="mb-2 font-semibold md:mt-3">{title}</h3><p className="text-sm leading-relaxed text-muted">{description}</p></div></li>
            ))}
          </ol>
        </section>

        <section className="bg-night py-10 text-white nav:py-14">
          <div className="mx-auto box-border flex w-full max-w-app flex-col items-start gap-5 px-4 nav:flex-row nav:items-center nav:justify-between nav:gap-[30px] nav:px-10">
            <div>
              <p className="mb-3 text-[9px] font-semiboldish tracking-[1.4px] text-[#b6c5d4] nav:text-[10px] nav:tracking-[1.7px]">YOUR FIRST TOP-UP STARTS HERE</p>
              <h2 className="m-0 text-[26px] font-medium tracking-[-0.5px] nav:text-[34px] nav:tracking-[-1px]">Ready for your next top-up?</h2>
            </div>
            <Link to="/create" className={lightBtn}>Create an account <FiArrowRight className="shrink-0" /></Link>
          </div>
        </section>

        <section className="mx-auto box-border grid w-full max-w-app grid-cols-1 gap-7 px-4 py-10 nav:grid-cols-2 nav:gap-[clamp(32px,7vw,100px)] nav:px-10 nav:py-[85px]">
          <div className="min-w-0">
            <p className={eyebrow}>GOOD TO KNOW</p>
            <h2 className="mb-[22px] text-[28px] font-medium leading-tight tracking-[-1.3px] nav:text-4xl">Before you make a payment.</h2>
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
