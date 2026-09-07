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
export default function HomePage() {
  const [selected, setSelected] = useState(0);
  const service = services[selected];
  return <div className="ot-public">
    <Navbar />
    <main id="main-content">
      <section className="ot-container ot-hero">
        <div className="ot-hero-copy"><p className="ot-eyebrow"><span className="ot-small-line" /> EVERYDAY PAYMENTS, SIMPLIFIED</p>
          <h1>A little less admin.<br /><span>A lot more life.</span></h1>
          <p className="ot-hero-description">Data, airtime and household bills. Take care of the essentials in one place, and get on with your day.</p>
          <div className="ot-hero-actions"><Link to="/create" className="ot-button ot-button-primary">Create your account <FiArrowRight /></Link><Link to="/pricing" className="ot-text-link">Explore data plans <FiArrowUpRight /></Link></div>
          <p className="ot-hero-note">For your phone. For your home. For the people you care about.</p>
        </div>
        <div className="ot-service-preview">
          <div className="ot-preview-caption"><span>ONE ACCOUNT. YOUR EVERYDAY ESSENTIALS.</span><span>01 — 04</span></div>
          <div className="ot-service-tabs" role="tablist" aria-label="Explore services">{services.map((item, i) => <button key={item.name} id={`service-tab-${i}`} role="tab" aria-selected={i === selected} aria-controls="service-panel" tabIndex={i === selected ? 0 : -1} onClick={() => setSelected(i)} onKeyDown={e => {
            if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
              e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
              setSelected(next); document.getElementById(`service-tab-${next}`)?.focus();
            }
          }}><item.icon /><span>{item.name}</span></button>)}</div>
          <div id="service-panel" role="tabpanel" aria-labelledby={`service-tab-${selected}`} className="ot-preview-body">
            <div className="ot-preview-symbol"><service.icon aria-hidden="true" /></div>
            <h2>{service.title}</h2><p>{service.description}</p>
            <div className="ot-network-list">{service.networks.map(name => <span key={name}>{name}</span>)}</div>
            <Link className="ot-preview-action" to={service.href}>{service.action}<FiArrowRight /></Link>
          </div>
          <div className="ot-preview-foot"><FiCheck /><span>Review your details before every payment.</span></div>
        </div>
      </section>
      <section className="ot-service-strip" aria-label="Services"><div className="ot-container">{services.map(s => <div key={s.name}><s.icon /><span>{s.name === 'Data' ? 'Mobile data' : s.name === 'TV' ? 'TV subscriptions' : s.name}</span></div>)}</div></section>
      <section className="ot-container ot-explainer">
        <div><p className="ot-eyebrow">LESS TO KEEP TRACK OF</p><h2>Your everyday payments.<br />One clear view.</h2><p>From a quick top-up to the monthly electricity bill, keep your payments and their details together.</p><Link className="ot-text-link" to="/create">Get started <FiArrowUpRight /></Link></div>
        <div className="ot-feature-rows">{[
          ['01', 'Know what you’re paying.', 'See your selected plan, recipient and cost before you confirm.'],
          ['02', 'Follow every payment.', 'Find transaction details, payment status and electricity tokens in your account.'],
          ['03', 'Get help with the details.', 'Raise a support request when you need help with a transaction.'],
        ].map(([number, title, body]) => <div className="ot-feature-row" key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div>
      </section>
      <section className="ot-get-started"><div className="ot-container"><div><p className="ot-eyebrow">A SIMPLER ROUTINE STARTS HERE</p><h2>One less thing on your list.</h2></div><Link to="/create" className="ot-button ot-button-light">Create an account <FiArrowRight /></Link></div></section>
      <section className="ot-container ot-faq"><div><p className="ot-eyebrow">GOOD TO KNOW</p><h2>A few useful answers.</h2><Link to="/tutorials" className="ot-text-link">Visit the help centre <FiArrowUpRight /></Link></div><div>{questions.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
    </main><Footer />
  </div>;
}
