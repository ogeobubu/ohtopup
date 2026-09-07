import { FiWifi, FiSmartphone, FiZap, FiTv } from 'react-icons/fi';
import { Link } from 'react-router-dom';
export default function Shortcut() {
  return <div className="ot-shortcuts">{[
    ['data', 'Data', FiWifi], ['airtime', 'Airtime', FiSmartphone], ['electricity', 'Electricity', FiZap], ['tv', 'TV', FiTv],
  ].map(([id, label, Icon]: any) => <Link key={id} to={`/utilities?id=${id}`} className="ot-shortcut"><Icon /><span>{label}</span></Link>)}</div>;
}
