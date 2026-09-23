import { Link } from 'react-router-dom';

export default function Brand({ to = '/', inverse = false }: { to?: string; inverse?: boolean }) {
  return (
    <Link
      to={to}
      aria-label="OhTopUp home"
      className={[
        'inline-flex items-center gap-[9px] whitespace-nowrap text-2xl font-brand tracking-[-1.2px]',
        inverse ? 'text-white' : 'text-ink',
      ].join(' ')}
    >
      <span aria-hidden="true" className="relative box-border inline-block h-[25px] w-[25px] shrink-0 rounded-full border-[6px] border-current">
        <span className="absolute -right-2 -top-2 h-[9px] w-[9px] rounded-full border-2 border-paper bg-accent" />
      </span>
      <span>
        OhTopUp
        <span className={inverse ? 'text-[#a8baff]' : 'text-accent'}>.</span>
      </span>
    </Link>
  );
}
