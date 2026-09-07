import { Link } from 'react-router-dom';
import Brand from '../../../components/ui/Brand';
export default function Footer() {
  return <footer className="ot-public-footer"><div className="ot-container">
    <div className="ot-footer-top"><div><Brand /><p>Everyday payments, thoughtfully simple.</p></div>
      <nav aria-label="Footer"><Link to="/about">About</Link><Link to="/pricing">Data pricing</Link><Link to="/tutorials">Help centre</Link><Link to="/terms">Terms</Link></nav>
      <a href="mailto:ohtopup@gmail.com">ohtopup@gmail.com</a>
    </div>
    <div className="ot-footer-bottom"><span>© {new Date().getFullYear()} OhTopUp. All rights reserved.</span><span>Made for everyday life in Nigeria.</span></div>
  </div></footer>;
}
