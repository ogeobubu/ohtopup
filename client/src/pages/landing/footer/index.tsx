import { Link } from 'react-router-dom';
import Brand from '../../../components/ui/Brand';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-warm pb-6 pt-12 text-ink">
      <div className="mx-auto box-border w-full max-w-app px-4 nav:px-10">
        <div className="flex flex-wrap items-start justify-between gap-8 pb-11">
          <div className="min-w-0 basis-full xs:basis-auto">
            <Brand />
            <p className="mt-2.5 text-xs text-muted">Everyday payments, thoughtfully simple.</p>
          </div>
          <nav className="grid grid-cols-1 gap-2 xs:grid-cols-2 xs:gap-x-10" aria-label="Footer">
            <Link className="inline-flex min-h-11 items-center text-xs hover:text-accent" to="/about">About</Link>
            <Link className="inline-flex min-h-11 items-center text-xs hover:text-accent" to="/pricing">Data pricing</Link>
            <Link className="inline-flex min-h-11 items-center text-xs hover:text-accent" to="/tutorials">Help centre</Link>
            <Link className="inline-flex min-h-11 items-center text-xs hover:text-accent" to="/terms">Terms</Link>
          </nav>
          <a className="inline-flex min-h-11 items-center text-xs text-ink hover:text-accent" href="mailto:ohtopup@gmail.com">
            ohtopup@gmail.com
          </a>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-line pt-[22px] text-[10px] text-muted">
          <span>© {new Date().getFullYear()} OhTopUp. All rights reserved.</span>
          <span>Made for everyday life in Nigeria.</span>
        </div>
      </div>
    </footer>
  );
}
