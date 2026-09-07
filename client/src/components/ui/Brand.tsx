import { Link } from 'react-router-dom';

export default function Brand({ to = '/', inverse = false }: { to?: string; inverse?: boolean }) {
  return <Link to={to} className={`ot-brand${inverse ? ' ot-brand-inverse' : ''}`} aria-label="OhTopUp home">
    <span className="ot-brand-mark" aria-hidden="true"><span /></span>
    <span>OhTopUp<span className="ot-brand-period">.</span></span>
  </Link>;
}
